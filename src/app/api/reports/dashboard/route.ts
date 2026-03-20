// src/app/api/reports/dashboard/route.ts
import { withAuth, ok } from "@/lib/api-helpers";
import { OrderService } from "@/services/order.service";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (req) => {
  const sp   = req.nextUrl.searchParams;
  const from = new Date(sp.get("from") ?? new Date(new Date().setDate(1)).toISOString());
  const to   = new Date(sp.get("to")   ?? new Date().toISOString());

  const [orderSummary, topProducts, stockAlerts, recentOrders] = await Promise.all([
    OrderService.getSummary(from, to),

    // Top 5 produk terlaris
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: from, lte: to }, paymentStatus: "PAID" } },
      _sum:   { quantity: true, subtotal: true },
      orderBy:{ _sum: { quantity: "desc" } },
      take:   5,
    }),

    // Stok menipis
    prisma.stock.findMany({
      where: { quantity: { lte: prisma.stock.fields.minStock as never } },
      include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } },
      take: 10,
    }),

    // 5 order terbaru
    prisma.order.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true },
    }),
  ]);

  // Gabungkan nama produk ke topProducts
  const productIds = topProducts.map(p => p.productId);
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true, images: true } });
  const topWithName = topProducts.map(p => ({ ...p, product: products.find(x => x.id === p.productId) }));

  return ok({ orderSummary, topProducts: topWithName, stockAlerts, recentOrders });
}, { requiredPermission: "report:*" });
