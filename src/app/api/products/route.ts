// src/app/api/products/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err, parseBody, getPagination, buildMeta } from "@/lib/api-helpers";
import { CreateProductSchema } from "@/lib/validators";
import { prisma, generateProductSku } from "@/lib/db";
import { UserRole, Prisma } from "@/generated/prisma/client";
import slugify from "slugify";

// GET /api/products
export const GET = withAuth(async (req) => {
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip, search, sortBy, sortOrder } = getPagination(sp);
  const categoryId = sp.get("categoryId") ?? undefined;
  const brand      = sp.get("brand")      ?? undefined;
  const isActive   = sp.has("isActive")   ? sp.get("isActive") === "true" : undefined;
  const featured   = sp.has("featured")   ? sp.get("featured") === "true"  : undefined;

  const where: Prisma.ProductWhereInput = {
    ...(isActive  !== undefined ? { isActive }  : {}),
    ...(featured  !== undefined ? { featured }  : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brand      ? { brand: { contains: brand, mode: "insensitive" } } : {}),
    ...(search
      ? { OR: [
          { name:    { contains: search, mode: "insensitive" } },
          { sku:     { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
          { brand:   { contains: search, mode: "insensitive" } },
        ] }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: limit, orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { name: true, icon: true, type: true } },
        variants: { where: { isActive: true }, select: { id: true, sku: true, size: true, color: true, colorHex: true, priceAdj: true } },
        priceTiers: { where: { isActive: true }, orderBy: { minQty: "asc" } },
        _count: { select: { stocks: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return ok(data, undefined, buildMeta(total, page, limit));
}); // no permission — products are readable by all auth users

// POST /api/products
export const POST = withAuth(async (req) => {
  const { data, error } = await parseBody(req, CreateProductSchema);
  if (error) return error;

  const category = await prisma.productCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) return err("Kategori tidak ditemukan.", 404);

  const sku  = data.sku  ?? await generateProductSku(category.type);
  const slug = slugify(data.name, { lower: true, strict: true });

  // Cek duplikat
  const [dupSku, dupSlug] = await Promise.all([
    prisma.product.findUnique({ where: { sku } }),
    prisma.product.findUnique({ where: { slug } }),
  ]);
  if (dupSku)  return err("SKU sudah digunakan.", 409);
  if (dupSlug) return err("Nama produk sudah digunakan (slug duplikat).", 409);

  const product = await prisma.product.create({
    data: { ...data, sku, slug },
    include: { category: true },
  });

  return created(product, `Produk ${product.name} berhasil dibuat.`);
}, { requiredPermission: "product:create" });
