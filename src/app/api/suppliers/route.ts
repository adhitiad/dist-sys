// src/app/api/suppliers/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err, parseBody, getPagination, buildMeta } from "@/lib/api-helpers";
import { CreateSupplierSchema } from "@/lib/validators";
import { prisma, generateSupplierCode } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

export const GET = withAuth(async (req) => {
  const { page, limit, skip, search, sortBy, sortOrder } = getPagination(req.nextUrl.searchParams);
  const isActive = req.nextUrl.searchParams.get("isActive");

  const where = {
    ...(isActive !== null ? { isActive: isActive === "true" } : {}),
    ...(search ? { OR: [
      { name:    { contains: search, mode: "insensitive" as const } },
      { company: { contains: search, mode: "insensitive" as const } },
      { email:   { contains: search, mode: "insensitive" as const } },
      { code:    { contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { purchaseOrders: true } } },
    }),
    prisma.supplier.count({ where }),
  ]);
  return ok(data, undefined, buildMeta(total, page, limit));
}, { requiredPermission: "supplier:read" });

export const POST = withAuth(async (req: NextRequest) => {
  const { data, error } = await parseBody(req, CreateSupplierSchema);
  if (error) return error;

  const dupEmail = await prisma.supplier.findFirst({ where: { email: data.email } });
  if (dupEmail) return err("Email supplier sudah terdaftar.", 409);

  const code     = await generateSupplierCode();
  const supplier = await prisma.supplier.create({ data: { ...data, code } });
  return created(supplier, `Supplier ${supplier.name} berhasil ditambahkan.`);
}, { requiredPermission: "supplier:create" });
