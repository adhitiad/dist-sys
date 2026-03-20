// src/app/api/settings/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/client";

export const GET = withAuth(async () => {
  const settings = await prisma.setting.findMany({ orderBy: { group: "asc" } });
  return ok(settings);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const updates = await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never, group: key.split(".")[0] ?? "general" },
      })
    )
  );
  return ok(updates, "Pengaturan disimpan.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN] });
