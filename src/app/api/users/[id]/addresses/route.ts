// src/app/api/users/[id]/addresses/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err, parseBody } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const AddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(5),
  isDefault: z.boolean().default(false),
});

// GET - Get all addresses for a customer
export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      customerProfile: {
        select: { addresses: true },
      },
    },
  });

  if (!user) return err("Pengguna tidak ditemukan.", 404);

  return ok(user.customerProfile?.addresses || []);
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });

type AddressType = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

// PATCH - Add or update address
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, AddressSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { customerProfile: true },
  });

  if (!user) return err("Pengguna tidak ditemukan.", 404);

  // Ensure customer profile exists
  let customerProfile = user.customerProfile;
  if (!customerProfile) {
    customerProfile = await prisma.customerProfile.create({
      data: {
        userId: user.id,
        customerCode: `CUST-${Date.now().toString(36).toUpperCase()}`,
      },
    });
  }

  const addresses: AddressType[] = (customerProfile.addresses as AddressType[]) || [];

  // If setting as default, remove default from others
  if (data.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  }

  if (data.id) {
    // Update existing
    const idx = addresses.findIndex((a) => a.id === data.id);
    if (idx >= 0) {
      addresses[idx] = { ...data, id: data.id } as AddressType;
    }
  } else {
    // Add new
    addresses.push({
      ...data,
      id: `addr_${Date.now().toString(36)}`,
    } as AddressType);
  }

  await prisma.customerProfile.update({
    where: { userId: id },
    data: { addresses },
  });

  return ok(addresses, "Alamat disimpan.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
