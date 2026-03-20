// src/app/api/orders/[id]/status/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, parseBody } from "@/lib/api-helpers";
import { UpdateOrderStatusSchema } from "@/lib/validators";
import { OrderService } from "@/services/order.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const { id }      = await ctx.params;
  const { data, error } = await parseBody(req, UpdateOrderStatusSchema);
  if (error) return error;

  const order = await OrderService.updateStatus(id, data);
  return ok(order, `Status order diubah ke ${data.status}.`);
}, { requiredPermission: "order:update" });
