// src/services/pos.service.ts
import {
  FulfillmentStatus,
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  StockMovementType,
  TransactionType,
} from "@/generated/prisma/client";
import {
  generatePOSOrderNumber,
  generatePOSSessionCode,
  prisma,
} from "@/lib/db";
import type {
  ClosePOSSessionInput,
  CreatePOSSessionInput,
  POSCheckoutInput,
} from "@/lib/validators";
import { StockService } from "@/services/stock.service";

export class POSService {
  // ── Create Session (Open Shift) ─────────────────────────────────

  static async createSession(input: CreatePOSSessionInput, userId: string) {
    // Check if user already has an open session
    const existingSession = await prisma.pOSession.findFirst({
      where: { userId, status: "OPEN" },
    });

    if (existingSession) {
      throw new Error("Anda sudah memiliki sesi POS yang masih aktif.");
    }

    const sessionCode = await generatePOSSessionCode();

    return prisma.pOSession.create({
      data: {
        sessionCode,
        userId,
        warehouseId: input.warehouseId,
        openingBalance: input.openingBalance,
        status: "OPEN",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });
  }

  // ── Close Session (Close Shift) ──────────────────────────────────

  static async closeSession(
    sessionId: string,
    input: ClosePOSSessionInput,
    userId: string,
  ) {
    const session = await prisma.pOSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: { select: { total: true, paymentStatus: true } },
      },
    });

    if (!session) {
      throw new Error("Sesi POS tidak ditemukan.");
    }

    if (session.status !== "OPEN") {
      throw new Error("Sesi POS sudah ditutup.");
    }

    if (session.userId !== userId) {
      throw new Error("Anda tidak memiliki akses untuk menutup sesi ini.");
    }

    // Calculate expected balance
    const totalSales = session.orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.total, 0);

    const expectedBalance = session.openingBalance + totalSales;

    return prisma.pOSession.update({
      where: { id: sessionId },
      data: {
        closingBalance: input.closingBalance,
        status: "CLOSED",
        closedAt: new Date(),
        notes: input.notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        orders: {
          select: {
            orderNumber: true,
            total: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // ── Get Current Session ─────────────────────────────────────────

  static async getCurrentSession(userId: string) {
    return prisma.pOSession.findFirst({
      where: { userId, status: "OPEN" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        orders: {
          where: { paymentStatus: "PAID" },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            paymentMethod: true,
            customerName: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                product: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { orders: { where: { paymentStatus: "PAID" } } } },
      },
    });
  }

  // ── Get Session Summary ─────────────────────────────────────────

  static async getSessionSummary(sessionId: string) {
    const session = await prisma.pOSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: {
          where: { paymentStatus: "PAID" },
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Sesi POS tidak ditemukan.");
    }

    const totalSales = session.orders.reduce((sum, o) => sum + o.total, 0);
    const totalItems = session.orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    const transactionsByPayment = await prisma.transaction.groupBy({
      by: ["metadata"],
      where: {
        orderId: { in: session.orders.map((o) => o.id) },
        type: TransactionType.PAYMENT_IN,
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      session,
      totalSales,
      totalItems,
      totalTransactions: session.orders.length,
      expectedBalance: session.openingBalance + totalSales,
      transactionsByPayment,
    };
  }

  // ── POS Checkout ────────────────────────────────────────────────

  static async checkout(input: POSCheckoutInput, userId: string) {
    // Get current open session for user
    const session = await prisma.pOSession.findFirst({
      where: { userId, status: "OPEN" },
    });

    // Calculate totals
    const subtotal = input.items.reduce(
      (s, i) => s + (i.unitPrice - i.discount) * i.quantity,
      0,
    );
    const total = subtotal - input.discount;

    // Validate payment
    if (input.paidAmount < total) {
      throw new Error(
        `Jumlah bayar tidak cukup. Total: Rp${total.toLocaleString("id-ID")}, Bayar: Rp${input.paidAmount.toLocaleString("id-ID")}`,
      );
    }

    const change = input.paidAmount - total;

    return prisma.$transaction(async (tx) => {
      // Validate and deduct stock with row-level locking
      for (const item of input.items) {
        const variantId = item.variantId ?? null;

        // Lock the stock row for update
        const lockResult = await tx.$queryRaw<
          Array<{ id: string; quantity: number; reserved: number }>
        >`
          SELECT id, quantity, reserved FROM stocks 
          WHERE "warehouseId" = ${input.warehouseId} 
            AND "productId" = ${item.productId} 
            AND ("variantId" = ${variantId} OR ("variantId" IS NULL AND ${variantId}::uuid IS NULL))
          FOR UPDATE
        `;

        if (lockResult.length === 0) {
          const p = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          throw new Error(
            `Stok ${p?.name ?? item.productId} tidak ditemukan di gudang.`,
          );
        }

        const stock = lockResult[0];
        const avail = stock.quantity - stock.reserved;

        if (avail < item.quantity) {
          const p = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          throw new Error(`Stok ${p?.name} tidak cukup. Tersedia: ${avail}`);
        }

        // Deduct stock immediately for POS (offline) orders
        await StockService.recordMovement(tx, {
          warehouseId: input.warehouseId,
          productId: item.productId,
          variantId: item.variantId,
          type: StockMovementType.OUT,
          quantity: -item.quantity,
          referenceType: "POS_ORDER",
          notes: `POS Checkout by user ${userId}`,
        });
      }

      // Generate order number
      const orderNumber = await generatePOSOrderNumber();

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: OrderChannel.OFFLINE,
          status: OrderStatus.COMPLETED,
          paymentMethod: input.paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          customerName: input.customerName ?? "Walk-in Customer",
          customerPhone: input.customerPhone,
          subtotal,
          discount: input.discount,
          total,
          paidAmount: input.paidAmount,
          changeAmount: change,
          paidAt: new Date(),
          completedAt: new Date(),
          notes: input.notes,
          posSessionId: session?.id,
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
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, images: true } },
              variant: { select: { size: true, color: true } },
            },
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          type: TransactionType.PAYMENT_IN,
          orderId: order.id,
          amount: input.paidAmount,
          description: `Pembayaran POS ${order.orderNumber}`,
          reference: order.orderNumber,
          referenceType: "POS_ORDER",
          metadata: {
            paymentMethod: input.paymentMethod,
            change,
            userId,
            sessionId: session?.id,
          },
        },
      });

      return { order, change };
    });
  }

  // ── Get Products for POS ────────────────────────────────────────

  static async getPOSProducts(warehouseId: string, search?: string, categoryId?: string) {
    const stocks = await prisma.stock.findMany({
      where: {
        warehouseId,
        quantity: { gt: 0 },
        product: {
          isActive: true,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { sku: { contains: search, mode: "insensitive" } },
                  { barcode: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(categoryId ? { categoryId } : {}),
        },
      },
      include: {
        product: {
          include: {
            category: { select: { name: true, icon: true } },
            variants: {
              where: { isActive: true },
              select: { id: true, sku: true, size: true, color: true, priceAdj: true },
            },
          },
        },
        variant: { select: { id: true, sku: true, size: true, color: true, priceAdj: true } },
      },
      orderBy: { product: { name: "asc" } },
      take: 100,
    });

    return stocks.map((s) => ({
      stockId: s.id,
      productId: s.product.id,
      variantId: s.variantId,
      sku: s.variant ? s.variant.sku : s.product.sku,
      name: s.product.name,
      category: s.product.category,
      images: s.product.images,
      sellingPrice: s.product.sellingPrice + (s.variant?.priceAdj ?? 0),
      available: s.quantity - s.reserved,
      variant: s.variant,
      variants: s.product.variants.length > 0 ? s.product.variants : undefined,
    }));
  }
}
