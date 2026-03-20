// src/lib/api-helpers.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, hasPermission } from "@/lib/auth";
import { logApiError } from "@/lib/logger";
import { ZodError } from "zod";
import { UserRole } from "@/generated/prisma/client";

// ── Response helpers ─────────────────────────────────────────────

export type ApiMeta = { page?: number; limit?: number; total?: number; totalPages?: number };
export type ApiResponse<T = unknown> = { success: boolean; data?: T; error?: string; message?: string; meta?: ApiMeta };

export const ok = <T>(data: T, message?: string, meta?: ApiMeta, status = 200) =>
  NextResponse.json({ success: true, data, message, meta } satisfies ApiResponse<T>, { status });

export const created = <T>(data: T, message = "Berhasil dibuat") => ok(data, message, undefined, 201);

export const err = (error: string, status = 400) =>
  NextResponse.json({ success: false, error } satisfies ApiResponse, { status });

// back-compat aliases
export const apiSuccess  = ok;
export const apiCreated  = created;
export const apiError    = err;

// ── withAuth HOC ─────────────────────────────────────────────────

type SessionUser = { id: string; role: UserRole; email: string; name: string };

export function withAuth(
  handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }, user: SessionUser) => Promise<NextResponse>,
  opts?: { requiredPermission?: string; allowedRoles?: UserRole[] }
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return err("Sesi tidak valid. Silakan login kembali.", 401);

      const role = session.user.role as UserRole;

      if (opts?.allowedRoles && !opts.allowedRoles.includes(role))
        return err("Anda tidak memiliki akses ke resource ini.", 403);

      if (opts?.requiredPermission && !hasPermission(role, opts.requiredPermission))
        return err("Izin tidak mencukupi.", 403);

      return handler(req, ctx, session.user as SessionUser);
    } catch (e) {
      logApiError(e, { endpoint: req.nextUrl.pathname, method: req.method });
      if (e instanceof ZodError)
        return err("Validasi gagal: " + e.issues.map((x: { message: string }) => x.message).join(", "), 422);
      return err("Terjadi kesalahan internal.", 500);
    }
  };
}

// ── parseBody ────────────────────────────────────────────────────

export async function parseBody<T>(
  req: NextRequest,
  schema: { parseAsync(v: unknown): Promise<T> }
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const json = await req.json();
    const data = await schema.parseAsync(json);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      const msgs = e.issues.map((x) => `${(x.path as (string | number)[]).join(".")}: ${x.message}`);
      return { data: null, error: err(`Validasi gagal: ${msgs.join("; ")}`, 422) };
    }
    return { data: null, error: err("Format request tidak valid.", 400) };
  }
}

// ── Pagination ───────────────────────────────────────────────────

export function getPagination(sp: URLSearchParams) {
  const page  = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  return {
    page, limit, skip: (page - 1) * limit,
    search:    sp.get("search")    ?? undefined,
    sortBy:    sp.get("sortBy")    ?? "createdAt",
    sortOrder: (sp.get("sortOrder") ?? "desc") as "asc" | "desc",
  };
}

export function buildMeta(total: number, page: number, limit: number): ApiMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
