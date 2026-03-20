// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use DIRECT_URL for migrations/seeding to avoid pgbouncer issues
const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: connectionUrl });
const prisma = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ── Code generators ─────────────────────────────────────────────

function datePart() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function monthPart() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function generateOrderNumber() {
  const prefix = `ORD-${datePart()}`;
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function generatePONumber() {
  const prefix = `PO-${monthPart()}`;
  const count = await prisma.purchaseOrder.count({
    where: { poNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateTransferCode() {
  const prefix = `TRF-${monthPart()}`;
  const count = await prisma.stockTransfer.count({
    where: { transferCode: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateReturnCode() {
  const prefix = `RET-${datePart()}`;
  const count = await prisma.orderReturn.count({
    where: { returnCode: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateSupplierCode() {
  const count = await prisma.supplier.count();
  return `SUP-${String(count + 1).padStart(4, "0")}`;
}

export async function generateWarehouseCode() {
  const count = await prisma.warehouse.count();
  return `WH-${String(count + 1).padStart(3, "0")}`;
}

export async function generateCustomerCode() {
  const count = await prisma.customerProfile.count();
  return `CUST-${String(count + 1).padStart(6, "0")}`;
}

export async function generateProductSku(categoryCode: string) {
  const prefix = categoryCode.toUpperCase().slice(0, 3);
  const count = await prisma.product.count({
    where: { sku: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export { prisma };
