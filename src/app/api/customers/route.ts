// src/app/api/customers/route.ts
import { UserRole } from "@/generated/prisma/client";
import {
  buildMeta,
  created,
  err,
  getPagination,
  ok,
  parseBody,
  withAuth,
} from "@/lib/api-helpers";
import { generateCustomerCode, prisma } from "@/lib/db";
import { CustomerSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const GET = withAuth(
  async (req) => {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip, search, sortBy, sortOrder } = getPagination(sp);
    const status = sp.get("status"); // "active", "inactive", "blocked"

    const where: any = {
      role: UserRole.PELANGGAN,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              {
                customerProfile: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
              {
                customerProfile: {
                  customerCode: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    // Filter by status
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "blocked") where.isActive = false; // blocked users are inactive

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
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
            },
          },
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" as const },
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data for response
    const transformed = data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      customerCode: user.customerProfile?.customerCode,
      companyName: user.customerProfile?.companyName,
      npwp: user.customerProfile?.npwp,
      creditLimit: user.customerProfile?.creditLimit,
      paymentTerms: user.customerProfile?.paymentTerms,
      loyaltyPoints: user.customerProfile?.loyaltyPoints,
      addresses: user.customerProfile?.addresses || [],
      orderCount: user._count.orders,
      totalSpent: user.orders.reduce((sum, o) => sum + (o.total || 0), 0),
      recentOrders: user.orders,
    }));

    return ok(transformed, undefined, buildMeta(total, page, limit));
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAJER_PENJUALAN],
  },
);

export const POST = withAuth(
  async (req: NextRequest) => {
    const { data, error } = await parseBody(req, CustomerSchema);
    if (error) return error;

    // Check if email already exists
    const dup = await prisma.user.findUnique({ where: { email: data.email } });
    if (dup) return err("Email sudah terdaftar.", 409);

    // Check if phone already exists
    if (data.phone) {
      const phoneDup = await prisma.user.findFirst({
        where: { phone: data.phone },
      });
      if (phoneDup) return err("Nomor telepon sudah terdaftar.", 409);
    }

    const hashed = await bcrypt.hash("pelanggan123", 12); // Default password
    const customerCode = await generateCustomerCode();

    const user = await prisma.$transaction(async (tx) => {
      // Create user with PELANGGAN role
      const u = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: UserRole.PELANGGAN,
          emailVerified: true,
          accounts: {
            create: {
              accountId: data.email,
              providerId: "credential",
              password: hashed,
            },
          },
        },
      });

      // Create customer profile
      await tx.customerProfile.create({
        data: {
          userId: u.id,
          customerCode,
          companyName: data.companyName,
          npwp: data.npwp,
          creditLimit: data.creditLimit || 0,
          paymentTerms: data.paymentTerms || 0,
          addresses: data.addresses || [],
        },
      });

      return u;
    });

    return created(
      { id: user.id, name: user.name, email: user.email, customerCode },
      "Pelanggan berhasil dibuat.",
    );
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] },
);
