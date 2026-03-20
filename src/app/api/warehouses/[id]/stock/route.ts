// src/app/api/warehouses/[id]/stock/route.ts
import { withAuth, ok } from "@/lib/api-helpers";
import { StockService } from "@/services/stock.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (req, ctx) => {
  const { id }  = await ctx.params;
  const search  = req.nextUrl.searchParams.get("search") ?? undefined;
  const lowOnly = req.nextUrl.searchParams.get("lowOnly") === "true";
  const stocks  = await StockService.getWarehouseStock(id, search);
  const result  = lowOnly ? stocks.filter(s => s.quantity <= s.minStock) : stocks;
  return ok(result);
}, { requiredPermission: "stock:read" });
