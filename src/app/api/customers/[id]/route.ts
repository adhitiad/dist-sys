// src/app/api/customers/[id]/route.ts
import { UserRole } from "@/generated/prisma/client";
import { err, ok, parseBody, withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { UpdateCustomerSchema } from "@/lib/validators";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, ctx: any) => {
  const { id } = await ctx.params;

    const user = await prisma.user.findFirst({
      where: { id, role: UserRole.PELANGGAN },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        customerProfile: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
            npwp: true,
            creditLimit: true,
            paymentTerms: true,
            loyaltyPoints: true,
            addresses: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!user) return err("Pelanggan tidak ditemukan.", 404);

    // Calculate stats
    const totalSpent = user.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedOrders = user.orders.filter(
      (o) => o.status === "COMPLETED",
    ).length;
    const pendingOrders = user.orders.filter(
      (o) => o.status === "PENDING",
    ).length;

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      customerProfile: user.customerProfile,
      orders: user.orders,
      stats: {
        totalOrders: user._count.orders,
        completedOrders,
        pendingOrders,
        totalSpent,
      },
    });
  },
  {
    allowedRoles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.MANAJER_PENJUALAN,
      UserRole.KASIR,
    ],
  },
);

export const PATCH = withAuth(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params;
    const { data, error } = await parseBody(req, UpdateCustomerSchema);
    if (error) return error;

    const existing = await prisma.user.findFirst({
      where: { id, role: UserRole.PELANGGAN },
      include: { customerProfile: true },
    });

    if (!existing) return err("Pelanggan tidak ditemukan.", 404);

    // Check email uniqueness
    if (data.email && data.email !== existing.email) {
      const dup = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (dup) return err("Email sudah digunakan.", 409);
    }

    // Check phone uniqueness
    if (data.phone && data.phone !== existing.phone) {
      const phoneDup = await prisma.user.findFirst({
        where: { phone: data.phone },
      });
      if (phoneDup) return err("Nomor telepon sudah digunakan.", 409);
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });

      await tx.customerProfile.update({
        where: { userId: id },
        data: {
          companyName: data.companyName,
          npwp: data.npwp,
          creditLimit: data.creditLimit,
          paymentTerms: data.paymentTerms,
          addresses: data.addresses,
        },
      });

      return tx.user.findUnique({ where: { id } });
    });

    return ok(user, "Data pelanggan diperbarui.");
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] },
);

export const DELETE = withAuth(async (_req, ctx: any) => {
  const { id } = await ctx.params;

    const existing = await prisma.user.findFirst({
      where: { id, role: UserRole.PELANGGAN },
    });

    if (!existing) return err("Pelanggan tidak ditemukan.", 404);

    // Check if customer has orders
    const orderCount = await prisma.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return err(
        "Tidak dapat menghapus pelanggan yang memiliki pesanan. Gunakan fitur blokir sebagai alternatif.",
        400,
      );
    }

    // Delete customer profile first (cascade should handle this, but explicit is safer)
    await prisma.customerProfile.delete({ where: { userId: id } });

    // Delete user (cascade will delete accounts, sessions)
    await prisma.user.delete({ where: { id } });

    return ok(null, "Pelanggan dihapus.");
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] },
);
