// src/app/api/warehouses/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err, parseBody, getPagination, buildMeta } from "@/lib/api-helpers";
import { CreateWarehouseSchema } from "@/lib/validators";
import { prisma, generateWarehouseCode } from "@/lib/db";
import { UserRole } from "@prisma/client";

// GET /api/warehouses
export const GET = withAuth(async (req) => {
  const { page, limit, skip, search, sortBy, sortOrder } = getPagination(req.nextUrl.searchParams);

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }, { city: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.warehouse.findMany({
      where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { stocks: true, staff: true } },
        staff:  { include: { user: { select: { id: true, name: true, role: true } } } },
      },
    }),
    prisma.warehouse.count({ where }),
  ]);

  return ok(data, undefined, buildMeta(total, page, limit));
}, { requiredPermission: "warehouse:read" });

// POST /api/warehouses
export const POST = withAuth(async (req) => {
  const { data, error } = await parseBody(req, CreateWarehouseSchema);
  if (error) return error;

  const exists = await prisma.warehouse.findFirst({ where: { code: data.code.toUpperCase() } });
  if (exists) return err("Kode gudang sudah digunakan.", 409);

  const code = data.code || await generateWarehouseCode();
  const warehouse = await prisma.warehouse.create({ data: { ...data, code: code.toUpperCase() } });

  return created(warehouse, `Gudang ${warehouse.name} berhasil dibuat.`);
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
