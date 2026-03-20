// src/app/api/stock-transfers/[id]/approve/route.ts
import { UserRole } from "@/generated/prisma/client";
import { ok, parseBody, withAuth } from "@/lib/api-helpers";
import { StockService } from "@/services/stock.service";
import { NextRequest } from "next/server";
import { z } from "zod";

const Schema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});
type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(
  async (req: NextRequest, ctx, user) => {
    const { id } = await ctx.params;
    const { data, error } = await parseBody(req, Schema);
    if (error) return error;
    const transfer = await StockService.approveTransfer(
      id,
      user.id,
      data.approved,
      data.notes,
    );
    const msg = data.approved ? "Transfer disetujui." : "Transfer ditolak.";
    return ok(transfer, msg);
  },
  { allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.PENGELOLA_GUDANG] },
);
