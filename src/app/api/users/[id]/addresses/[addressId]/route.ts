// src/app/api/users/[id]/addresses/[addressId]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string; addressId: string }> };

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

// DELETE - Delete an address
export const DELETE = withAuth(async (_req, ctx) => {
  const { id, addressId } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { customerProfile: true },
  });

  if (!user || !user.customerProfile) {
    return err("Pengguna atau profil tidak ditemukan.", 404);
  }

  const addresses: AddressType[] = (user.customerProfile.addresses as AddressType[]) || [];

  const filtered = addresses.filter((a) => a.id !== addressId);

  await prisma.customerProfile.update({
    where: { userId: id },
    data: { addresses: filtered },
  });

  return ok(filtered, "Alamat dihapus.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
