// src/app/api/warehouses/[id]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err, parseBody } from "@/lib/api-helpers";
import { UpdateWarehouseSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/warehouses/:id
export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { stocks: true, staff: true } },
      staff: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
  if (!warehouse) return err("Gudang tidak ditemukan.", 404);
  return ok(warehouse);
}, { requiredPermission: "warehouse:read" });

// PATCH /api/warehouses/:id
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, UpdateWarehouseSchema);
  if (error) return error;

  const exists = await prisma.warehouse.findUnique({ where: { id } });
  if (!exists) return err("Gudang tidak ditemukan.", 404);

  // Cek duplikat kode jika kode diubah
  if (data.code && data.code.toUpperCase() !== exists.code) {
    const dupCode = await prisma.warehouse.findFirst({
      where: { code: data.code.toUpperCase(), id: { not: id } },
    });
    if (dupCode) return err("Kode gudang sudah digunakan.", 409);
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: {
      ...data,
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
    },
  });
  return ok(updated, "Gudang berhasil diperbarui.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

// DELETE /api/warehouses/:id
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const exists = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { stocks: true, staff: true } },
    },
  });
  if (!exists) return err("Gudang tidak ditemukan.", 404);

  // Cek apakah gudang memiliki stok atau staff
  if (exists._count.stocks > 0 || exists._count.staff > 0) {
    // Soft delete jika ada data
    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
    return ok(null, "Gudang dinonaktifkan (memiliki stok atau staff).");
  }

  // Hard delete jika tidak ada data
  await prisma.warehouse.delete({ where: { id } });
  return ok(null, "Gudang berhasil dihapus.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
