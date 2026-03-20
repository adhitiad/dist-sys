// src/hooks/use-upload.ts
"use client";
import { useState, useCallback, useRef } from "react";
import client from "@/lib/axios";
import { toast } from "sonner";
import type { CloudinaryFolder, CloudinaryImage } from "@/lib/cloudinary";

// ── Single upload ─────────────────────────────────────────────────

export type UploadState = {
  isUploading: boolean;
  progress:    number;
  error:       string | null;
  result:      CloudinaryImage | null;
  previewUrl:  string | null;
};

export function useUpload(opts: {
  folder:     CloudinaryFolder;
  maxSizeMB?: number;
  onSuccess?: (r: CloudinaryImage) => void;
  onError?:   (msg: string) => void;
}) {
  const { folder, maxSizeMB = 5, onSuccess, onError } = opts;
  const [state, setState] = useState<UploadState>({ isUploading: false, progress: 0, error: null, result: null, previewUrl: null });
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif"];
    if (!allowed.includes(file.type)) {
      const msg = "Format tidak didukung. Gunakan JPG, PNG, atau WebP.";
      setState(s => ({ ...s, error: msg }));
      onError?.(msg); toast.error(msg); return null;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      const msg = `Ukuran melebihi ${maxSizeMB} MB.`;
      setState(s => ({ ...s, error: msg }));
      onError?.(msg); toast.error(msg); return null;
    }

    const previewUrl = URL.createObjectURL(file);
    setState({ isUploading: true, progress: 0, error: null, result: null, previewUrl });

    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    abortRef.current = new AbortController();
    try {
      const res = await client.post<{ data: CloudinaryImage }>("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        signal:  abortRef.current.signal,
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          setState(s => ({ ...s, progress: pct }));
        },
      });
      const result = res.data.data;
      setState(s => ({ ...s, isUploading: false, progress: 100, result }));
      onSuccess?.(result);
      toast.success("Gambar berhasil diupload.");
      return result;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Upload gagal.";
      setState(s => ({ ...s, isUploading: false, error: msg }));
      onError?.(msg); toast.error(msg); return null;
    }
  }, [folder, maxSizeMB, onSuccess, onError]);

  const cancel = useCallback(() => { abortRef.current?.abort(); setState(s => ({ ...s, isUploading: false, progress: 0 })); }, []);
  const reset  = useCallback(() => setState({ isUploading: false, progress: 0, error: null, result: null, previewUrl: null }), []);

  const deleteUpload = useCallback(async (publicId: string) => {
    try {
      await client.delete("/api/upload", { data: { publicId } });
      reset(); toast.success("Gambar dihapus."); return true;
    } catch { toast.error("Gagal hapus gambar."); return false; }
  }, [reset]);

  return { ...state, upload, cancel, reset, deleteUpload };
}

// ── Multi upload ──────────────────────────────────────────────────

export type MultiItem = {
  id: string; file: File; previewUrl: string;
  status: "pending"|"uploading"|"done"|"error";
  progress: number; result?: CloudinaryImage; error?: string;
};

export function useMultiUpload(opts: { folder: CloudinaryFolder; onSuccess?: (r: CloudinaryImage) => void }) {
  const { folder, onSuccess } = opts;
  const [items, setItems]       = useState<MultiItem[]>([]);
  const [isUploading, setUpl]   = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: MultiItem[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2), file: f,
      previewUrl: URL.createObjectURL(f), status: "pending", progress: 0,
    }));
    setItems(prev => [...prev, ...next]);
  }, []);

  const uploadAll = useCallback(async () => {
    const pending = items.filter(i => i.status === "pending");
    if (!pending.length) return;
    setUpl(true);

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "uploading" } : i));
      const form = new FormData();
      form.append("file", item.file);
      form.append("folder", folder);
      try {
        const res = await client.post<{ data: CloudinaryImage }>("/api/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i));
          },
        });
        const result = res.data.data;
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "done", progress: 100, result } : i));
        onSuccess?.(result);
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal";
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", error: msg } : i));
      }
    }
    setUpl(false);
  }, [items, folder, onSuccess]);

  const removeItem = useCallback((id: string) => setItems(prev => prev.filter(i => i.id !== id)), []);
  const clearAll   = useCallback(() => setItems([]), []);
  const results    = items.filter(i => i.status === "done").map(i => i.result!);

  return { items, results, isUploading, addFiles, uploadAll, removeItem, clearAll };
}
