// src/components/shared/image-uploader.tsx
"use client";
import { useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload, useMultiUpload } from "@/hooks/use-upload";
import type { CloudinaryFolder, CloudinaryImage } from "@/lib/cloudinary";

// ── Single ────────────────────────────────────────────────────────
type SingleProps = {
  folder:       CloudinaryFolder;
  value?:       string;
  publicId?:    string;
  onChange:     (r: CloudinaryImage | null) => void;
  aspectRatio?: "square" | "video" | "portrait";
  placeholder?: string;
  disabled?:    boolean;
  className?:   string;
};

export function ImageUploader({
  folder, value, publicId, onChange,
  aspectRatio = "square", placeholder = "Klik atau seret gambar", disabled, className,
}: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, progress, previewUrl, upload, deleteUpload } = useUpload({
    folder, onSuccess: onChange,
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) upload(e.dataTransfer.files[0]);
  }, [disabled, upload]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
  }, [upload]);

  const onRemove = useCallback(async () => {
    if (publicId) await deleteUpload(publicId);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [publicId, deleteUpload, onChange]);

  const displayUrl = previewUrl ?? value;
  const aspect = { square: "aspect-square", video: "aspect-video", portrait: "aspect-[3/4]" }[aspectRatio];

  return (
    <div className={cn("relative w-full", aspect, className)} onDrop={onDrop} onDragOver={e => e.preventDefault()}>
      {displayUrl ? (
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-border">
          <Image src={displayUrl} alt="Preview" fill className="object-cover" />
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-sm font-semibold text-white">{progress}%</span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/30">
                <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {!isUploading && !disabled && (
            <button type="button" onClick={onRemove}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-500 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button type="button" disabled={disabled || isUploading} onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 transition",
            !disabled && "cursor-pointer hover:border-primary/50 hover:bg-muted/40",
            disabled  && "cursor-not-allowed opacity-50",
          )}>
          {isUploading ? (
            <><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-sm text-muted-foreground">{progress}%</span></>
          ) : (
            <><div className="rounded-full bg-primary/10 p-3"><ImageIcon className="h-6 w-6 text-primary" /></div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{placeholder}</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP · maks 5 MB</p>
            </div></>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden" onChange={onFileChange} disabled={disabled || isUploading} />
    </div>
  );
}

// ── Multi ─────────────────────────────────────────────────────────
type MultiProps = {
  folder:    CloudinaryFolder;
  values?:   string[];
  onChange:  (results: CloudinaryImage[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
};

export function MultiImageUploader({ folder, values = [], onChange, maxFiles = 5, disabled, className }: MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, results, isUploading, addFiles, uploadAll, removeItem } = useMultiUpload({
    folder, onSuccess: () => onChange(results),
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) addFiles(e.dataTransfer.files);
  }, [disabled, addFiles]);

  const totalCount = values.length + items.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Existing */}
      {values.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={url} alt={`Img ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
      {/* New previews */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {items.map(item => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={item.previewUrl} alt="preview" fill className="object-cover" />
              {item.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-xs font-bold text-white">{item.progress}%</span>
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/60">
                  <X className="h-5 w-5 text-white" />
                </div>
              )}
              {item.status !== "uploading" && (
                <button type="button" onClick={() => removeItem(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-red-500">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Drop zone */}
      {totalCount < maxFiles && (
        <div onDrop={onDrop} onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 px-4 py-6 text-center">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Seret atau{" "}
            <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-primary underline-offset-2 hover:underline">
              pilih file
            </button>
          </p>
          <p className="text-xs text-muted-foreground/60">Maks {maxFiles} gambar · 5 MB</p>
        </div>
      )}
      {items.some(i => i.status === "pending") && (
        <button type="button" disabled={isUploading} onClick={uploadAll}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload {items.filter(i => i.status === "pending").length} Gambar
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)}
        disabled={disabled || isUploading} />
    </div>
  );
}
