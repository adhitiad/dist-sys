// src/app/api/products/[id]/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, err, parseBody } from "@/lib/api-helpers";
import { UpdateProductSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/products/:id
export const GET = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category:   true,
      variants:   { orderBy: [{ size: "asc" }, { color: "asc" }] },
      priceTiers: { where: { isActive: true }, orderBy: { minQty: "asc" } },
      stocks: {
        include: { warehouse: { select: { id: true, name: true, code: true, city: true } } },
      },
    },
  });
  if (!product) return err("Produk tidak ditemukan.", 404);
  return ok(product);
});

// PATCH /api/products/:id
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, UpdateProductSchema);
  if (error) return error;

  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) return err("Produk tidak ditemukan.", 404);

  const updated = await prisma.product.update({ where: { id }, data });
  return ok(updated, "Produk berhasil diperbarui.");
}, { requiredPermission: "product:update" });

// DELETE /api/products/:id
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = await ctx.params;
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) return err("Produk tidak ditemukan.", 404);

  // Soft delete
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return ok(null, "Produk dinonaktifkan.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
