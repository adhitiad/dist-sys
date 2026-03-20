// src/services/order.service.ts
import {
  FulfillmentStatus,
  PaymentStatus,
  StockMovementType,
  TransactionType,
} from "@/generated/prisma/client";
import { generateOrderNumber, prisma } from "@/lib/db";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
} from "@/lib/validators";
import { StockService } from "@/services/stock.service";

export class OrderService {
  // ── Create ────────────────────────────────────────────────────

  static async createOrder(input: CreateOrderInput) {
    const orderNumber = await generateOrderNumber();

    const subtotal = input.items.reduce(
      (s, i) => s + (i.unitPrice - i.discount) * i.quantity,
      0,
    );
    const tax = (subtotal - input.discount) * (input.taxPercent / 100);
    const total = subtotal - input.discount + tax + input.shippingCost;

    return prisma.$transaction(async (tx) => {
      const warehouseId = await this.findWarehouse(
        input.items,
        input.shippingAddress?.city,
      );

      // Reserve stock
      for (const item of input.items) {
        const stock = await tx.stock.findFirst({
          where: {
            warehouseId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
        const avail = (stock?.quantity ?? 0) - (stock?.reserved ?? 0);
        if (avail < item.quantity) {
          const p = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          throw new Error(`Stok ${p?.name} tidak cukup. Tersedia: ${avail}`);
        }
        await tx.stock.update({
          where: { id: stock!.id },
          data: { reserved: { increment: item.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: input.customerId,
          channel: input.channel,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          shippingName: input.shippingAddress?.name,
          shippingPhone: input.shippingAddress?.phone,
          shippingAddress: input.shippingAddress?.address,
          shippingCity: input.shippingAddress?.city,
          shippingProvince: input.shippingAddress?.province,
          shippingPostal: input.shippingAddress?.postalCode,
          shippingCourier: input.shippingCourier,
          shippingCost: input.shippingCost,
          paymentMethod: input.paymentMethod,
          subtotal,
          discount: input.discount,
          discountCode: input.discountCode,
          taxPercent: input.taxPercent,
          tax,
          total,
          notes: input.notes,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              subtotal: (i.unitPrice - i.discount) * i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderFulfillment.create({
        data: {
          orderId: order.id,
          warehouseId,
          status: FulfillmentStatus.ASSIGNED,
        },
      });

      return order;
    });
  }

  // ── Find best warehouse ───────────────────────────────────────

  private static async findWarehouse(
    items: CreateOrderInput["items"],
    city?: string,
  ) {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, city: true },
    });
    let fallback: string | null = null;

    for (const wh of warehouses) {
      let ok = true;
      for (const item of items) {
        const stock = await prisma.stock.findFirst({
          where: {
            warehouseId: wh.id,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
        const avail = (stock?.quantity ?? 0) - (stock?.reserved ?? 0);
        if (avail < item.quantity) {
          ok = false;
          break;
        }
      }
      if (ok) {
        if (city && wh.city.toLowerCase() === city.toLowerCase()) return wh.id;
        if (!fallback) fallback = wh.id;
      }
    }
    if (fallback) return fallback;
    throw new Error(
      "Tidak ada gudang dengan stok yang cukup untuk semua item.",
    );
  }

  // ── Update status ─────────────────────────────────────────────

  static async updateStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, fulfillment: true },
    });

    const transitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PICKING"],
      PICKING: ["PACKING"],
      PACKING: ["READY"],
      READY: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["COMPLETED", "RETURNED"],
    };
    if (!(transitions[order.status] ?? []).includes(input.status))
      throw new Error(
        `Tidak bisa ubah status dari ${order.status} ke ${input.status}`,
      );

    return prisma.$transaction(async (tx) => {
      // Kurangi stok saat SHIPPED
      if (input.status === "SHIPPED" && order.fulfillment) {
        for (const item of order.items) {
          await StockService.recordMovement(tx, {
            warehouseId: order.fulfillment.warehouseId,
            productId: item.productId,
            variantId: item.variantId ?? undefined,
            type: StockMovementType.OUT,
            quantity: -item.quantity,
            reference: orderId,
            referenceType: "ORDER",
          });
          await tx.stock.updateMany({
            where: {
              warehouseId: order.fulfillment.warehouseId,
              productId: item.productId,
              variantId: item.variantId ?? null,
            },
            data: { reserved: { decrement: item.quantity } },
          });
        }
      }

      // Lepas reservasi jika CANCELLED
      if (input.status === "CANCELLED" && order.fulfillment) {
        for (const item of order.items) {
          await tx.stock.updateMany({
            where: {
              warehouseId: order.fulfillment.warehouseId,
              productId: item.productId,
              variantId: item.variantId ?? null,
            },
            data: { reserved: { decrement: item.quantity } },
          });
        }
      }

      // Update fulfillment status
      const fStatusMap: Record<string, FulfillmentStatus | null> = {
        PICKING: FulfillmentStatus.PICKING,
        PACKING: FulfillmentStatus.PACKING,
        READY: FulfillmentStatus.READY_TO_SHIP,
        SHIPPED: FulfillmentStatus.DISPATCHED,
      };
      if (order.fulfillment && fStatusMap[input.status]) {
        await tx.orderFulfillment.update({
          where: { orderId },
          data: { status: fStatusMap[input.status]! },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: input.status as never,
          cancelReason: input.cancelReason,
          internalNotes: input.internalNotes,
          trackingNumber: input.trackingNumber,
          confirmedAt: input.status === "CONFIRMED" ? new Date() : undefined,
          shippedAt: input.status === "SHIPPED" ? new Date() : undefined,
          deliveredAt: input.status === "DELIVERED" ? new Date() : undefined,
          completedAt: input.status === "COMPLETED" ? new Date() : undefined,
          cancelledAt: input.status === "CANCELLED" ? new Date() : undefined,
        },
      });
    });
  }

  // ── Payment ───────────────────────────────────────────────────

  static async processPayment(
    orderId: string,
    paidAmount: number,
    userId: string,
  ) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    const newPaid = order.paidAmount + paidAmount;
    const status: PaymentStatus = newPaid >= order.total ? "PAID" : "PARTIAL";
    const change =
      paidAmount > order.total - order.paidAmount
        ? paidAmount - (order.total - order.paidAmount)
        : 0;

    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaid,
          paymentStatus: status,
          changeAmount: change,
          paidAt: status === "PAID" ? new Date() : undefined,
        },
      });
      await tx.transaction.create({
        data: {
          type: TransactionType.PAYMENT_IN,
          orderId,
          amount: paidAmount,
          description: `Pembayaran Order ${order.orderNumber}`,
          reference: order.orderNumber,
          referenceType: "ORDER",
          metadata: { userId, change },
        },
      });
      return { paymentStatus: status, changeAmount: change };
    });
  }

  // ── Dashboard summary ─────────────────────────────────────────

  static async getSummary(from: Date, to: Date) {
    const [total, revenue, pending, byStatus] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: from, lte: to } },
        _count: { status: true },
      }),
    ]);
    return {
      totalOrders: total,
      totalRevenue: revenue._sum.total ?? 0,
      pendingOrders: pending,
      byStatus,
    };
  }
}
