// src/app/api/users/[id]/addresses/[addressId]/default/route.ts
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

// PATCH - Set address as default
export const PATCH = withAuth(async (_req, ctx) => {
  const { id, addressId } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { customerProfile: true },
  });

  if (!user || !user.customerProfile) {
    return err("Pengguna atau profil tidak ditemukan.", 404);
  }

  const addresses: AddressType[] = (user.customerProfile.addresses as AddressType[]) || [];

  // Find and set default
  const addr = addresses.find((a) => a.id === addressId);
  if (!addr) return err("Alamat tidak ditemukan.", 404);

  addresses.forEach((a) => {
    a.isDefault = a.id === addressId;
  });

  await prisma.customerProfile.update({
    where: { userId: id },
    data: { addresses },
  });

  return ok(addresses, "Alamat utama diubah.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
