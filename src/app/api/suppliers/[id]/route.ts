// src/app/api/suppliers/[id]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err, parseBody } from "@/lib/api-helpers";
import { UpdateSupplierSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/suppliers/:id
export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { purchaseOrders: true } },
    },
  });
  if (!supplier) return err("Supplier tidak ditemukan.", 404);
  return ok(supplier);
}, { requiredPermission: "supplier:read" });

// PATCH /api/suppliers/:id
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, UpdateSupplierSchema);
  if (error) return error;

  const exists = await prisma.supplier.findUnique({ where: { id } });
  if (!exists) return err("Supplier tidak ditemukan.", 404);

  // Cek duplikat email jika email diubah
  if (data.email && data.email !== exists.email) {
    const dupEmail = await prisma.supplier.findFirst({
      where: { email: data.email, id: { not: id } },
    });
    if (dupEmail) return err("Email sudah digunakan supplier lain.", 409);
  }

  const updated = await prisma.supplier.update({
    where: { id },
    data,
  });
  return ok(updated, "Supplier berhasil diperbarui.");
}, { requiredPermission: "supplier:update" });

// DELETE /api/suppliers/:id
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const exists = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  if (!exists) return err("Supplier tidak ditemukan.", 404);

  // Cek apakah supplier memiliki PO
  if (exists._count.purchaseOrders > 0) {
    // Soft delete jika ada PO
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return ok(null, "Supplier dinonaktifkan (memiliki riwayat PO).");
  }

  // Hard delete jika tidak ada PO
  await prisma.supplier.delete({ where: { id } });
  return ok(null, "Supplier berhasil dihapus.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
