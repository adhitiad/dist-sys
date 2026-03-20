// src/lib/cloudinary.ts
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { logger } from "@/lib/logger";

// ── Init ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const ROOT = process.env.CLOUDINARY_FOLDER ?? "distributor";

// ── Folder map ───────────────────────────────────────────────────
export const FOLDERS = {
  products:        `${ROOT}/products`,
  productVariants: `${ROOT}/products/variants`,
  categories:      `${ROOT}/categories`,
  suppliers:       `${ROOT}/suppliers`,
  users:           `${ROOT}/users`,
  warehouses:      `${ROOT}/warehouses`,
  documents:       `${ROOT}/documents`,
} as const;

export type CloudinaryFolder = keyof typeof FOLDERS;

// ── Types ─────────────────────────────────────────────────────────
export type CloudinaryImage = {
  publicId:  string;
  url:       string;
  width:     number;
  height:    number;
  bytes:     number;
  format:    string;
};

export type UploadOptions = {
  folder:     CloudinaryFolder;
  publicId?:  string;
  overwrite?: boolean;
  tags?:      string[];
};

// ── Upload from Buffer (server-side FormData) ────────────────────
export async function uploadBuffer(
  buffer:  Buffer,
  options: UploadOptions
): Promise<CloudinaryImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:       FOLDERS[options.folder],
        public_id:    options.publicId,
        overwrite:    options.overwrite ?? true,
        tags:         options.tags,
        resource_type: "image",
        format:       "webp",
        quality:      "auto:good",
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) {
          logger.error("Cloudinary upload error", { error });
          return reject(error ?? new Error("Upload result kosong"));
        }
        resolve(toImage(result));
      }
    );
    stream.end(buffer);
  });
}

// ── Upload dari URL eksternal ────────────────────────────────────
export async function uploadFromUrl(
  url:     string,
  options: UploadOptions
): Promise<CloudinaryImage> {
  const result = await cloudinary.uploader.upload(url, {
    folder:    FOLDERS[options.folder],
    public_id: options.publicId,
    overwrite: options.overwrite ?? true,
    tags:      options.tags,
    format:    "webp",
    quality:   "auto:good",
  });
  return toImage(result);
}

// ── Delete file ──────────────────────────────────────────────────
export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const r = await cloudinary.uploader.destroy(publicId);
    return r.result === "ok";
  } catch (e) {
    logger.error("Cloudinary delete error", { publicId, e });
    return false;
  }
}

// ── Delete multiple ──────────────────────────────────────────────
export async function deleteFiles(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;
  await cloudinary.api.delete_resources(publicIds);
}

// ── On-the-fly transformation URL ───────────────────────────────
export type Transform = {
  width?:   number;
  height?:  number;
  crop?:    "fill" | "fit" | "scale" | "thumb" | "pad";
  gravity?: "face" | "center" | "auto";
  quality?: number | "auto";
};

export function transformUrl(publicId: string, t: Transform): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{
      width:        t.width,
      height:       t.height,
      crop:         t.crop    ?? "fill",
      gravity:      t.gravity ?? "center",
      quality:      t.quality ?? "auto:good",
      fetch_format: "auto",
    }],
  });
}

// ── Preset helpers ───────────────────────────────────────────────
export const img = {
  thumb:  (id: string) => transformUrl(id, { width: 120,  height: 120,  crop: "fill" }),
  card:   (id: string) => transformUrl(id, { width: 400,  height: 400,  crop: "fill" }),
  detail: (id: string) => transformUrl(id, { width: 800,  height: 800,  crop: "fit"  }),
  avatar: (id: string) => transformUrl(id, { width: 96,   height: 96,   crop: "thumb", gravity: "face" }),
  banner: (id: string) => transformUrl(id, { width: 1200, height: 400,  crop: "fill" }),
};

// ── Generate signed upload params (browser direct upload) ────────
export function signedUploadParams(folder: CloudinaryFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = FOLDERS[folder];
  const toSign = { folder: folderPath, timestamp, format: "webp", quality: "auto:good" };
  const signature = cloudinary.utils.api_sign_request(toSign, process.env.CLOUDINARY_API_SECRET!);
  return {
    signature,
    timestamp,
    folder:    folderPath,
    apiKey:    process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    format:    "webp",
  };
}

// ── Internal helper ───────────────────────────────────────────────
function toImage(r: UploadApiResponse): CloudinaryImage {
  return {
    publicId: r.public_id,
    url:      r.secure_url,
    width:    r.width,
    height:   r.height,
    bytes:    r.bytes,
    format:   r.format,
  };
}

export { cloudinary };
