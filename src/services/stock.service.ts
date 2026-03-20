// src/services/stock.service.ts
import {
  Prisma,
  StockMovementType,
  StockTransferStatus,
} from "@/generated/prisma/client";
import { generateTransferCode, prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type {
  CreateTransferInput,
  StockAdjustmentInput,
} from "@/lib/validators";

export class StockService {
  // ── Query ─────────────────────────────────────────────────────

  static getWarehouseStock(warehouseId: string, search?: string) {
    return prisma.stock.findMany({
      where: {
        warehouseId,
        ...(search
          ? { product: { name: { contains: search, mode: "insensitive" } } }
          : {}),
      },
      include: {
        product: {
          include: { category: { select: { name: true, icon: true } } },
        },
        variant: true,
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: { product: { name: "asc" } },
    });
  }

  static async getTotalStock(productId: string, variantId?: string) {
    const r = await prisma.stock.aggregate({
      where: { productId, variantId: variantId ?? null },
      _sum: { quantity: true, reserved: true },
    });
    const total = r._sum.quantity ?? 0;
    const reserved = r._sum.reserved ?? 0;
    return { total, reserved, available: total - reserved };
  }

  static getLowStockItems(warehouseId?: string) {
    return prisma.stock.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        quantity: { lte: prisma.stock.fields.minStock as never },
      },
      include: {
        product: { select: { name: true, sku: true, images: true } },
        variant: { select: { size: true, color: true } },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: { quantity: "asc" },
    });
  }

  // ── Movement (internal) ───────────────────────────────────────

  static async recordMovement(
    tx: Prisma.TransactionClient,
    p: {
      warehouseId: string;
      productId: string;
      variantId?: string;
      type: StockMovementType;
      quantity: number;
      reference?: string;
      referenceType?: string;
      notes?: string;
      createdBy?: string;
    },
  ) {
    const stock = await tx.stock.upsert({
      where: {
        warehouseId_productId_variantId: {
          warehouseId: p.warehouseId,
          productId: p.productId,
          variantId: (p.variantId ?? null) as string,
        },
      },
      create: {
        warehouseId: p.warehouseId,
        productId: p.productId,
        variantId: p.variantId ?? null,
        quantity: 0,
      },
      update: {},
    });

    const newQty = stock.quantity + p.quantity;
    if (newQty < 0)
      throw new Error(
        `Stok tidak mencukupi. Tersedia: ${stock.quantity}, dibutuhkan: ${Math.abs(p.quantity)}`,
      );

    await tx.stock.update({
      where: { id: stock.id },
      data: { quantity: newQty },
    });

    await tx.stockMovement.create({
      data: {
        warehouseId: p.warehouseId,
        productId: p.productId,
        variantId: p.variantId ?? null,
        type: p.type,
        quantity: p.quantity,
        balanceBefore: stock.quantity,
        balanceAfter: newQty,
        reference: p.reference,
        referenceType: p.referenceType,
        notes: p.notes,
        createdBy: p.createdBy,
      },
    });

    return newQty;
  }

  // ── Adjustment (opname) ───────────────────────────────────────

  static adjustStock(input: StockAdjustmentInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const balance = await this.recordMovement(tx, {
        warehouseId: input.warehouseId,
        productId: input.productId,
        variantId: input.variantId,
        type: input.type,
        quantity: input.quantity,
        referenceType: "ADJUSTMENT",
        notes: input.notes,
        createdBy: userId,
      });
      logger.info("Stock adjusted", { ...input, newBalance: balance, userId });
      return balance;
    });
  }

  // ── Stock Transfer ────────────────────────────────────────────

  static async createTransfer(
    input: CreateTransferInput,
    requestedById: string,
  ) {
    const transferCode = await generateTransferCode();

    return prisma.$transaction(async (tx) => {
      // Validasi stok cukup & reservasi
      for (const item of input.items) {
        const stock = await tx.stock.findUnique({
          where: {
            warehouseId_productId_variantId: {
              warehouseId: input.fromWarehouseId,
              productId: item.productId,
              variantId: (item.variantId ?? null) as string,
            },
          },
        });
        const avail = (stock?.quantity ?? 0) - (stock?.reserved ?? 0);
        if (avail < item.requestedQty) {
          const prod = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          throw new Error(
            `Stok ${prod?.name ?? item.productId} tidak cukup. Tersedia: ${avail}`,
          );
        }
        await tx.stock.update({
          where: {
            warehouseId_productId_variantId: {
              warehouseId: input.fromWarehouseId,
              productId: item.productId,
              variantId: (item.variantId ?? null) as string,
            },
          },
          data: { reserved: { increment: item.requestedQty } },
        });
      }

      return tx.stockTransfer.create({
        data: {
          transferCode,
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          priority: input.priority,
          requestedById,
          status: "REQUESTED",
          notes: input.notes,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              requestedQty: i.requestedQty,
              notes: i.notes,
            })),
          },
        },
        include: {
          items: true,
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } },
        },
      });
    });
  }

  static async approveTransfer(
    transferId: string,
    approvedById: string,
    approved: boolean,
    notes?: string,
  ) {
    const t = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transferId },
    });
    if (t.status !== "REQUESTED")
      throw new Error("Hanya bisa approve saat status REQUESTED");
    return prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedById,
        approvalNotes: notes,
        approvedAt: new Date(),
      },
    });
  }

  static async dispatchTransfer(transferId: string) {
    const t = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transferId },
      include: { items: true },
    });
    if (t.status !== "APPROVED")
      throw new Error("Hanya bisa dispatch saat status APPROVED");

    return prisma.$transaction(async (tx) => {
      for (const item of t.items) {
        await this.recordMovement(tx, {
          warehouseId: t.fromWarehouseId,
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          type: StockMovementType.TRANSFER_OUT,
          quantity: -item.requestedQty,
          reference: transferId,
          referenceType: "TRANSFER",
        });
        await tx.stock.update({
          where: {
            warehouseId_productId_variantId: {
              warehouseId: t.fromWarehouseId,
              productId: item.productId,
              variantId: (item.variantId ?? null) as string,
            },
          },
          data: { reserved: { decrement: item.requestedQty } },
        });
      }
      return tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: "IN_TRANSIT", inTransitAt: new Date() },
      });
    });
  }

  static async receiveTransfer(
    transferId: string,
    items: Array<{
      itemId: string;
      receivedQty: number;
      condition: string;
      notes?: string;
    }>,
  ) {
    const t = await prisma.stockTransfer.findUniqueOrThrow({
      where: { id: transferId },
      include: { items: true },
    });
    if (t.status !== "IN_TRANSIT")
      throw new Error("Hanya bisa terima saat status IN_TRANSIT");

    return prisma.$transaction(async (tx) => {
      let allReceived = true;
      for (const recv of items) {
        const tItem = t.items.find((i) => i.id === recv.itemId);
        if (!tItem) continue;
        if (recv.receivedQty < tItem.requestedQty) allReceived = false;
        if (recv.receivedQty > 0) {
          await this.recordMovement(tx, {
            warehouseId: t.toWarehouseId,
            productId: tItem.productId,
            variantId: tItem.variantId ?? undefined,
            type: StockMovementType.TRANSFER_IN,
            quantity: recv.receivedQty,
            reference: transferId,
            referenceType: "TRANSFER",
            notes: recv.notes,
          });
        }
        await tx.stockTransferItem.update({
          where: { id: recv.itemId },
          data: {
            receivedQty: recv.receivedQty,
            condition: recv.condition,
            notes: recv.notes,
          },
        });
      }
      return tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: allReceived
            ? StockTransferStatus.RECEIVED
            : StockTransferStatus.PARTIAL_RECEIVED,
          receivedAt: new Date(),
        },
      });
    });
  }
}
