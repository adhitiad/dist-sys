// src/app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err } from "@/lib/api-helpers";
import { UpdateUserSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      isActive: true, emailVerified: true, createdAt: true,
      warehouseStaff: { include: { warehouse: true } },
      customerProfile: true,
    },
  });
  if (!user) return err("Pengguna tidak ditemukan.", 404);
  return ok(user);
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) return err("Pengguna tidak ditemukan.", 404);

  // Handle role change + warehouse assignment
  const { warehouseId, ...rest } = body;
  const updated = await prisma.user.update({ where: { id }, data: rest });

  if (warehouseId && rest.role) {
    const WAREHOUSE_ROLES: UserRole[] = [UserRole.PENGELOLA_GUDANG, UserRole.PICKER, UserRole.PACKER, UserRole.DRIVER];
    if (WAREHOUSE_ROLES.includes(rest.role)) {
      await prisma.warehouseStaff.upsert({
        where: { userId: id },
        create: { userId: id, warehouseId },
        update: { warehouseId },
      });
    }
  }

  return ok({ id: updated.id, name: updated.name, role: updated.role }, "Pengguna diperbarui.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return err("Pengguna tidak ditemukan.", 404);
  // Soft delete
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return ok(null, "Pengguna dinonaktifkan.");
}, { allowedRoles: [UserRole.OWNER] });
