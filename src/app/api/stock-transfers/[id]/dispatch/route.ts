// src/app/api/stock-transfers/[id]/dispatch/route.ts
import { UserRole } from "@/generated/prisma/client";
import { ok, withAuth } from "@/lib/api-helpers";
import { StockService } from "@/services/stock.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(
  async (_req, ctx) => {
    const { id } = await ctx.params;
    const transfer = await StockService.dispatchTransfer(id);
    return ok(transfer, "Barang sedang dikirim (IN_TRANSIT).");
  },
  {
    allowedRoles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.PENGELOLA_GUDANG,
      UserRole.DRIVER,
    ],
  },
);
