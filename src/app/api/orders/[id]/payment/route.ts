// src/app/api/orders/[id]/payment/route.ts
import { UserRole } from "@/generated/prisma/client";
import { err, ok, parseBody, withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { ProcessPaymentSchema } from "@/lib/validators";
import { OrderService } from "@/services/order.service";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(
  async (req: NextRequest, ctx, user) => {
    const { id } = await ctx.params;
    const { data, error } = await parseBody(req, ProcessPaymentSchema);
    if (error) return error;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return err("Order tidak ditemukan.", 404);
    if (order.paymentStatus === "PAID") return err("Order sudah lunas.", 400);

    const result = await OrderService.processPayment(
      id,
      data.paidAmount,
      user.id,
    );
    return ok(
      result,
      `Pembayaran Rp${data.paidAmount.toLocaleString("id-ID")} berhasil dicatat.`,
    );
  },
  {
    allowedRoles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.KASIR,
      UserRole.MANAJER_PENJUALAN,
    ],
  },
);
