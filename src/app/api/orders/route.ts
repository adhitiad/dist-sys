// src/app/api/orders/route.ts
import {
  buildMeta,
  created,
  getPagination,
  ok,
  parseBody,
  withAuth,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { CreateOrderSchema } from "@/lib/validators";
import { OrderService } from "@/services/order.service";
import { OrderStatus, Prisma, UserRole } from "@/generated/prisma/client";
import { NextRequest } from "next/server";

// GET /api/orders
export const GET = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip, search, sortBy, sortOrder } = getPagination(sp);
    const status = sp.get("status") as OrderStatus | null;
    const channel = sp.get("channel") ?? undefined;
    const warehouseId = sp.get("warehouseId") ?? undefined;
    const dateFrom = sp.get("dateFrom") ?? undefined;
    const dateTo = sp.get("dateTo") ?? undefined;

    const where: Prisma.OrderWhereInput = {};

    // Pelanggan hanya lihat order sendiri
    if (user.role === UserRole.PELANGGAN) where.customerId = user.id;
    // Picker/Packer/Driver hanya lihat order di gudang mereka
    const fulfillmentRoles = [
      UserRole.PICKER,
      UserRole.PACKER,
      UserRole.DRIVER,
    ] as const;
    if (
      fulfillmentRoles.includes(user.role as (typeof fulfillmentRoles)[number])
    ) {
      const staff = await prisma.warehouseStaff.findUnique({
        where: { userId: user.id },
      });
      if (staff) where.fulfillment = { warehouseId: staff.warehouseId };
    }

    if (status) where.status = status;
    if (channel) where.channel = channel as never;
    if (warehouseId) where.fulfillment = { warehouseId };
    if (dateFrom || dateTo)
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    if (search)
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ];

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, images: true } },
              variant: { select: { size: true, color: true } },
            },
          },
          fulfillment: {
            include: { warehouse: { select: { name: true, code: true } } },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return ok(data, undefined, buildMeta(total, page, limit));
  },
  { requiredPermission: "order:read" },
);

// POST /api/orders
export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const { data, error } = await parseBody(req, CreateOrderSchema);
    if (error) return error;

    // Pelanggan selalu order untuk dirinya sendiri
    if (user.role === UserRole.PELANGGAN) data.customerId = user.id;

    const order = await OrderService.createOrder(data);
    return created(order, `Order ${order.orderNumber} berhasil dibuat.`);
  },
  { requiredPermission: "order:create" },
);
