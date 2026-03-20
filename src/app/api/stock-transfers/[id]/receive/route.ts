// src/app/api/stock-transfers/[id]/receive/route.ts
import { UserRole } from "@/generated/prisma/client";
import { ok, parseBody, withAuth } from "@/lib/api-helpers";
import { ReceiveTransferSchema } from "@/lib/validators";
import { StockService } from "@/services/stock.service";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const { id } = await ctx.params;
    const { data, error } = await parseBody(req, ReceiveTransferSchema);
    if (error) return error;
    const transfer = await StockService.receiveTransfer(id, data.items);
    return ok(transfer, `Transfer diterima dengan status ${transfer.status}.`);
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.PENGELOLA_GUDANG] },
);
