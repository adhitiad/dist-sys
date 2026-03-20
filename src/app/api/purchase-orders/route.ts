// src/app/api/purchase-orders/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err, parseBody, getPagination, buildMeta } from "@/lib/api-helpers";
import { CreatePurchaseOrderSchema } from "@/lib/validators";
import { prisma, generatePONumber } from "@/lib/db";
import { UserRole, StockMovementType } from "@/generated/prisma/client";
import { StockService } from "@/services/stock.service";

export const GET = withAuth(async (req, _ctx, user) => {
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip, sortBy, sortOrder } = getPagination(sp);
  const status      = sp.get("status")      ?? undefined;
  const supplierId  = sp.get("supplierId")  ?? undefined;
  const warehouseId = sp.get("warehouseId") ?? undefined;

  // Supplier hanya lihat PO untuk mereka
  let supplierFilter = supplierId;
  if (user.role === UserRole.SUPPLIER) {
    const s = await prisma.supplier.findFirst({ where: { userId: user.id } });
    if (!s) return ok([], undefined, buildMeta(0, page, limit));
    supplierFilter = s.id;
  }

  const where = {
    ...(status        ? { status: status as never }  : {}),
    ...(supplierFilter ? { supplierId: supplierFilter } : {}),
    ...(warehouseId   ? { warehouseId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
      include: {
        supplier:  { select: { name: true, company: true, code: true } },
        warehouse: { select: { name: true, code: true } },
        items:     { include: { product: { select: { name: true, sku: true } }, variant: { select: { size: true, color: true } } } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);
  return ok(data, undefined, buildMeta(total, page, limit));
}, { requiredPermission: "purchase_order:read" });

export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const { data, error } = await parseBody(req, CreatePurchaseOrderSchema);
  if (error) return error;

  const [supplier, warehouse] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: data.supplierId } }),
    prisma.warehouse.findUnique({ where: { id: data.warehouseId } }),
  ]);
  if (!supplier)  return err("Supplier tidak ditemukan.", 404);
  if (!warehouse) return err("Gudang tidak ditemukan.", 404);

  // Hitung total
  const subtotal = data.items.reduce((s, i) => s + (i.unitPrice - i.discount) * i.quantity, 0);
  const tax      = (subtotal - data.discount) * (data.taxPercent / 100);
  const total    = subtotal - data.discount + tax + data.shippingCost;
  const poNumber = await generatePONumber();

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber, supplierId: data.supplierId, warehouseId: data.warehouseId,
      expectedDate: data.expectedDate, taxPercent: data.taxPercent,
      discount: data.discount, shippingCost: data.shippingCost,
      subtotal, tax, total, notes: data.notes,
      items: {
        create: data.items.map(i => ({
          productId: i.productId, variantId: i.variantId,
          quantity: i.quantity, unitPrice: i.unitPrice,
          discount: i.discount, expiryDate: i.expiryDate,
          subtotal: (i.unitPrice - i.discount) * i.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return created(po, `PO ${poNumber} berhasil dibuat.`);
}, { requiredPermission: "purchase_order:create" });
