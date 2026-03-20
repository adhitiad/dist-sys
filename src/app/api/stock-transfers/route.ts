// src/app/api/stock-transfers/route.ts
import { UserRole } from "@/generated/prisma/client";
import {
  buildMeta,
  created,
  getPagination,
  ok,
  parseBody,
  withAuth,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { CreateTransferSchema } from "@/lib/validators";
import { StockService } from "@/services/stock.service";
import { NextRequest } from "next/server";

export const GET = withAuth(
  async (req, _ctx, user) => {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPagination(sp);
    const status = sp.get("status") ?? undefined;
    const fromWarehouseId = sp.get("fromWarehouseId") ?? undefined;
    const toWarehouseId = sp.get("toWarehouseId") ?? undefined;

    // Staff gudang hanya lihat transfer gudang mereka
    let warehouseFilter: object = {};
    const warehouseRoles = [
      UserRole.PENGELOLA_GUDANG,
      UserRole.PICKER,
      UserRole.PACKER,
      UserRole.DRIVER,
    ] as const;
    if (warehouseRoles.includes(user.role as (typeof warehouseRoles)[number])) {
      const staff = await prisma.warehouseStaff.findUnique({
        where: { userId: user.id },
      });
      if (staff)
        warehouseFilter = {
          OR: [
            { fromWarehouseId: staff.warehouseId },
            { toWarehouseId: staff.warehouseId },
          ],
        };
    }

    const where = {
      ...warehouseFilter,
      ...(status ? { status: status as never } : {}),
      ...(fromWarehouseId ? { fromWarehouseId } : {}),
      ...(toWarehouseId ? { toWarehouseId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          fromWarehouse: { select: { name: true, code: true, city: true } },
          toWarehouse: { select: { name: true, code: true, city: true } },
          requestedBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          items: {
            // product and variant are not directly related in the schema
            select: {
              id: true,
              productId: true,
              variantId: true,
              requestedQty: true,
              transferredQty: true,
              receivedQty: true,
              condition: true,
              notes: true,
            },
          },
        },
      }),
      prisma.stockTransfer.count({ where }),
    ]);
    return ok(data, undefined, buildMeta(total, page, limit));
  },
  { requiredPermission: "stock_transfer:read" },
);

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const { data, error } = await parseBody(req, CreateTransferSchema);
    if (error) return error;
    const transfer = await StockService.createTransfer(data, user.id);
    return created(
      transfer,
      `Transfer ${transfer.transferCode} berhasil diajukan.`,
    );
  },
  { requiredPermission: "stock_transfer:create" },
);
