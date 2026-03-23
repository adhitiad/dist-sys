// src/app/api/pos/session/close/route.ts
import { err, ok, parseBody, withAuth } from "@/lib/api-helpers";
import { ClosePOSSessionSchema } from "@/lib/validators";
import { POSService } from "@/services/pos.service";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";
import { NextRequest } from "next/server";

// POST /api/pos/session/close - Close current POS session
export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const { data, error } = await parseBody(req, ClosePOSSessionSchema);
    if (error) return error;

    // Get current open session
    const session = await prisma.pOSession.findFirst({
      where: { userId: user.id, status: "OPEN" },
    });

    if (!session) {
      return err("Tidak ada sesi POS yang aktif.", 400);
    }

    const closedSession = await POSService.closeSession(session.id, data, user.id);
    return ok(closedSession, `Sesi POS ${session.sessionCode} berhasil ditutup.`);
  },
  {
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR],
  }
);
