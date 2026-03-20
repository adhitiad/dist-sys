// src/app/api/reports/low-stock/route.ts
import { withAuth, ok } from "@/lib/api-helpers";
import { StockService } from "@/services/stock.service";

export const GET = withAuth(async (req) => {
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? undefined;
  const items = await StockService.getLowStockItems(warehouseId);
  return ok(items);
}, { requiredPermission: "stock:read" });
