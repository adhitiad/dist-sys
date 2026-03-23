// src/app/api/pos/checkout/route.ts
import { created, parseBody, withAuth } from "@/lib/api-helpers";
import { POSCheckoutSchema } from "@/lib/validators";
import { POSService } from "@/services/pos.service";
import { UserRole } from "@/generated/prisma/client";
import { NextRequest } from "next/server";

// POST /api/pos/checkout - Process POS checkout
export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const { data, error } = await parseBody(req, POSCheckoutSchema);
    if (error) return error;

    const result = await POSService.checkout(data, user.id);
    return created(result, `Transaksi ${result.order.orderNumber} berhasil.`);
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR],
  }
);
