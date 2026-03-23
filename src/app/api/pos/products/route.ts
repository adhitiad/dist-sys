// src/app/api/pos/products/route.ts
import { err, ok, withAuth } from "@/lib/api-helpers";
import { POSService } from "@/services/pos.service";
import { UserRole } from "@/generated/prisma/client";
import { NextRequest } from "next/server";

// GET /api/pos/products - Get products for POS
export const GET = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const sp = req.nextUrl.searchParams;
    const warehouseId = sp.get("warehouseId");
    const search = sp.get("search") ?? undefined;
    const categoryId = sp.get("categoryId") ?? undefined;

    if (!warehouseId) {
      return err("Warehouse ID diperlukan.", 400);
    }

    const products = await POSService.getPOSProducts(warehouseId, search, categoryId ?? undefined);
    return ok(products);
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR],
  }
);
