// src/app/api/products/categories/route.ts
import { withAuth, ok } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export const GET = withAuth(async () => {
  const cats = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return ok(cats);
});
