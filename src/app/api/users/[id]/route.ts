// src/app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err, parseBody } from "@/lib/api-helpers";
import { UpdateUserSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      warehouseStaff: { include: { warehouse: true } },
      customerProfile: true,
    },
  });
  if (!user) return err("Pengguna tidak ditemukan.", 404);
  return ok(user);
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

export const PATCH = withAuth(
  async (req: NextRequest, ctx, currentUser) => {
    const { id } = await ctx.params;

    // Validate input with Zod
    const { data, error } = await parseBody(req, UpdateUserSchema);
    if (error) return error;

    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return err("Pengguna tidak ditemukan.", 404);

    // Security: Only OWNER can change roles
    if (data.role && data.role !== exists.role) {
      if (currentUser.role !== UserRole.OWNER) {
        return err("Hanya Owner yang dapat mengubah role pengguna.", 403);
      }
      // Prevent changing the last OWNER's role
      if (exists.role === UserRole.OWNER) {
        const ownerCount = await prisma.user.count({
          where: { role: UserRole.OWNER, isActive: true },
        });
        if (ownerCount <= 1) {
          return err(
            "Tidak dapat mengubah role Owner terakhir. Tetapkan Owner lain terlebih dahulu.",
            400,
          );
        }
      }
    }

    // Security: Only OWNER can deactivate/activate users
    if (data.isActive !== undefined && data.isActive !== exists.isActive) {
      if (currentUser.role !== UserRole.OWNER) {
        return err("Hanya Owner yang dapat mengubah status aktif pengguna.", 403);
      }
      // Prevent deactivating the last active OWNER
      if (!data.isActive && exists.role === UserRole.OWNER) {
        const activeOwnerCount = await prisma.user.count({
          where: { role: UserRole.OWNER, isActive: true },
        });
        if (activeOwnerCount <= 1) {
          return err(
            "Tidak dapat menonaktifkan Owner terakhir.",
            400,
          );
        }
      }
    }

    // Handle warehouse assignment
    const { warehouseId, ...userData } = data;
    const WAREHOUSE_ROLES: UserRole[] = [
      UserRole.PENGELOLA_GUDANG,
      UserRole.PICKER,
      UserRole.PACKER,
      UserRole.DRIVER,
    ];

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: userData,
      });

      // Handle warehouse assignment for warehouse staff roles
      if (warehouseId && userData.role && WAREHOUSE_ROLES.includes(userData.role)) {
        await tx.warehouseStaff.upsert({
          where: { userId: id },
          create: { userId: id, warehouseId },
          update: { warehouseId },
        });
      }

      return user;
    });

    return ok(
      { id: updated.id, name: updated.name, role: updated.role },
      "Pengguna diperbarui.",
    );
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] },
);

export const DELETE = withAuth(
  async (_req, ctx, currentUser) => {
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return err("Pengguna tidak ditemukan.", 404);

    // Prevent deleting the last OWNER
    if (user.role === UserRole.OWNER) {
      const activeOwnerCount = await prisma.user.count({
        where: { role: UserRole.OWNER, isActive: true },
      });
      if (activeOwnerCount <= 1) {
        return err(
          "Tidak dapat menonaktifkan Owner terakhir.",
          400,
        );
      }
    }

    // Soft delete
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return ok(null, "Pengguna dinonaktifkan.");
  },
  { allowedRoles: [UserRole.OWNER] },
);
