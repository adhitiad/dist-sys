// src/app/api/pos/session/route.ts
import { created, err, ok, parseBody, withAuth } from "@/lib/api-helpers";
import { CreatePOSSessionSchema } from "@/lib/validators";
import { POSService } from "@/services/pos.service";
import { UserRole } from "@/generated/prisma/client";
import { NextRequest } from "next/server";

// GET /api/pos/session - Get current open session
export const GET = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const session = await POSService.getCurrentSession(user.id);
    return ok(session);
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR],
  }
);

// POST /api/pos/session - Open new POS session
export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const { data, error } = await parseBody(req, CreatePOSSessionSchema);
    if (error) return error;

    const session = await POSService.createSession(data, user.id);
    return created(session, `Sesi POS ${session.sessionCode} berhasil dibuka.`);
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR],
  }
);
