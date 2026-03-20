// src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { withAuth, ok, created, err } from "@/lib/api-helpers";
import { uploadBuffer, deleteFile, signedUploadParams, FOLDERS } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import { UserRole } from "@prisma/client";
import type { CloudinaryFolder } from "@/lib/cloudinary";

const MAX_MB   = 5;
const ALLOWED  = ["image/jpeg","image/png","image/webp","image/gif"];
const FOLDERS_KEYS = Object.keys(FOLDERS) as CloudinaryFolder[];

// ── POST /api/upload ──────────────────────────────────────────────
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  let form: FormData;
  try   { form = await req.formData(); }
  catch { return err("Request harus multipart/form-data.", 400); }

  const file   = form.get("file") as File | null;
  const folder = (form.get("folder") ?? "products") as CloudinaryFolder;

  if (!file)                        return err("File tidak ditemukan.", 400);
  if (!ALLOWED.includes(file.type)) return err(`Tipe tidak didukung: ${ALLOWED.join(", ")}`, 415);
  if (file.size > MAX_MB * 1024 * 1024) return err(`Ukuran melebihi ${MAX_MB} MB.`, 413);
  if (!FOLDERS_KEYS.includes(folder))   return err("Folder tidak valid.", 400);

  // Folder restriction
  const restricted: Partial<Record<CloudinaryFolder, UserRole[]>> = {
    users:     [UserRole.OWNER, UserRole.ADMIN],
    documents: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAJER_PEMBELIAN, UserRole.AKUNTAN],
  };
  const allowed = restricted[folder];
  if (allowed && !allowed.includes(user.role as UserRole))
    return err("Tidak ada izin upload ke folder ini.", 403);

  const buf    = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buf, {
    folder,
    tags: [user.role.toLowerCase(), "distributor"],
  });

  logger.info("Upload berhasil", { publicId: result.publicId, folder, userId: user.id });
  return created(result, "File berhasil diupload.");
}, { requiredPermission: "product:create" });

// ── DELETE /api/upload  body: { publicId } ────────────────────────
export const DELETE = withAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  if (!body.publicId) return err("publicId wajib diisi.", 400);

  const deleted = await deleteFile(body.publicId);
  if (!deleted)   return err("File tidak ditemukan atau sudah dihapus.", 404);

  return ok({ publicId: body.publicId }, "File dihapus.");
}, { allowedRoles: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAJER_PENJUALAN, UserRole.MANAJER_PEMBELIAN] });

// ── GET /api/upload?folder=products  → signed params ─────────────
export const GET = withAuth(async (req: NextRequest) => {
  const folder = (req.nextUrl.searchParams.get("folder") ?? "products") as CloudinaryFolder;
  if (!FOLDERS_KEYS.includes(folder)) return err("Folder tidak valid.", 400);

  const params = signedUploadParams(folder);
  return ok(params);
}, { requiredPermission: "product:create" });
