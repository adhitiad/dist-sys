// src/app/api/users/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err, parseBody, getPagination, buildMeta } from "@/lib/api-helpers";
import { CreateUserSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

export const GET = withAuth(async (req) => {
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip, search, sortBy, sortOrder } = getPagination(sp);
  const role = sp.get("role") as UserRole | null;

  const where = {
    ...(role   ? { role } : {}),
    ...(search ? { OR: [
      { name:  { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        isActive: true, emailVerified: true, createdAt: true,
        warehouseStaff: { include: { warehouse: { select: { name: true, code: true } } } },
        customerProfile: { select: { customerCode: true, companyName: true, loyaltyPoints: true, creditLimit: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return ok(data, undefined, buildMeta(total, page, limit));
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

export const POST = withAuth(async (req: NextRequest) => {
  const { data, error } = await parseBody(req, CreateUserSchema);
  if (error) return error;

  const dup = await prisma.user.findUnique({ where: { email: data.email } });
  if (dup) return err("Email sudah terdaftar.", 409);

  const hashed = await bcrypt.hash(data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name: data.name, email: data.email, role: data.role,
        phone: data.phone, emailVerified: true,
        accounts: { create: { accountId: data.email, providerId: "credential", password: hashed } },
      },
    });

    // Assign ke gudang jika role warehouse
    const WAREHOUSE_ROLES: UserRole[] = [UserRole.PENGELOLA_GUDANG, UserRole.PICKER, UserRole.PACKER, UserRole.DRIVER];
    if (WAREHOUSE_ROLES.includes(data.role) && data.warehouseId) {
      await tx.warehouseStaff.create({ data: { userId: u.id, warehouseId: data.warehouseId } });
    }

    return u;
  });

  return created({ id: user.id, name: user.name, email: user.email, role: user.role }, "Pengguna berhasil dibuat.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
