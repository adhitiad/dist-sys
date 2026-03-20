// src/components/product/product-form-modal.tsx
"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { useCategories, useProduct } from "@/hooks/use-queries";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-queries";
import { CreateProductSchema, type CreateProductInput } from "@/lib/validators";
import { toast } from "sonner";
import type { CloudinaryImage } from "@/lib/cloudinary";

type Props = { productId?: string; onClose(): void; onSuccess(): void };

const UNITS   = ["PCS","LUSIN","KODI","BOX","KARTON","PACK","SACHET","BOTOL","GALON","KG","GRAM","LITER","ML"];
const GENDERS = ["PRIA","WANITA","UNISEX","ANAK"];
const CLOTH_TYPES = ["KAOS","KEMEJA","POLO","CELANA_PANJANG","CELANA_PENDEK","CELANA_DALAM","JAKET","HOODIE","SWEATER","DRESS","ROK","PAKAIAN_TIDUR","PAKAIAN_OLAHRAGA","KAOS_KAKI","TOPI","PAKAIAN_DALAM_WANITA","PAKAIAN_ANAK","PAKAIAN_BAYI","LAINNYA"];
const PACKAGING = ["CUP_120ML","CUP_240ML","BOTOL_250ML","BOTOL_330ML","BOTOL_500ML","BOTOL_600ML","BOTOL_750ML","BOTOL_1000ML","BOTOL_1500ML","BOTOL_2000ML","GALON_19L","KARDUS","SACHET","POUCH","TETRA_PAK","KALENG_250ML","KALENG_330ML"];

export function ProductFormModal({ productId, onClose, onSuccess }: Props) {
  const isEdit = !!productId;
  const { data: categories }     = useCategories();
  const { data: existing }       = useProduct(productId ?? "");
  const createProduct            = useCreateProduct();
  const updateProduct            = useUpdateProduct(productId ?? "");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [catType, setCatType]         = useState<string>("");

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } =
    useForm({
      resolver: zodResolver(CreateProductSchema),
      defaultValues: {
        images: [],
        tags: [],
        isVariant: false,
        hasExpiry: false,
        featured: false,
        unit: "PCS" as const,
      }
    });

  const categoryId = watch("categoryId");

  useEffect(() => {
    if (existing) {
      reset({
        name:        existing.name,
        description: existing.description ?? "",
        categoryId:  existing.categoryId,
        brand:       existing.brand ?? "",
        basePrice:   existing.basePrice,
        sellingPrice:existing.sellingPrice,
        minPrice:    existing.minPrice ?? undefined,
        unit:        existing.unit,
        pcsPerBox:   existing.pcsPerBox ?? undefined,
        boxPerKarton:existing.boxPerKarton ?? undefined,
        weight:      existing.weight ?? undefined,
        isVariant:   existing.isVariant,
        hasExpiry:   existing.hasExpiry,
        featured:    existing.featured,
        clothingType:existing.clothingType ?? undefined,
        gender:      existing.gender as never ?? undefined,
        volume:      existing.volume ?? undefined,
        packaging:   existing.packaging ?? undefined,
        expiryDays:  existing.expiryDays ?? undefined,
        images:      (existing.images ?? []) as CreateProductInput["images"],
      });
      setCatType((existing as { category: { type: string } }).category.type);
    }
  }, [existing, reset]);

  useEffect(() => {
    const cat = (categories ?? []).find((c: { id: string; type: string }) => c.id === categoryId);
    if (cat) setCatType(cat.type);
  }, [categoryId, categories]);

  const isClothing  = catType === "PAKAIAN";
  const isBeverage  = ["AMDK","HEALTHY_WATER","SWEET_WATER","MINUMAN_ENERGI"].includes(catType);
  const hasExpiry   = ["ROTI","SUSU_DAIRY","WAFER","COKLAT","SNACK_GURIH","PERMEN_JELLY"].includes(catType);

  async function onSubmit(data: CreateProductInput) {
    try {
      if (isEdit) await updateProduct.mutateAsync(data);
      else        await createProduct.mutateAsync(data);
      toast.success(isEdit ? "Produk diperbarui." : "Produk ditambahkan.");
      onSuccess();
    } catch { /* interceptor handles */ }
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const errCls   = "mt-0.5 text-xs text-red-500";
  const labelCls = "mb-1 block text-xs font-medium text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-bold">{isEdit ? "Edit Produk" : "Tambah Produk"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5"/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Gambar */}
            <div>
              <label className={labelCls}>Gambar Utama</label>
              <Controller name="images" control={control} render={({ field }) => (
                <ImageUploader folder="products" aspectRatio="square" className="max-w-[180px]"
                  value={Array.isArray(field.value) && field.value[0] ? (field.value[0] as CloudinaryImage).url : undefined}
                  publicId={Array.isArray(field.value) && field.value[0] ? (field.value[0] as CloudinaryImage).publicId : undefined}
                  onChange={r => field.onChange(r ? [r] : [])}
                />
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nama */}
              <div className="col-span-2">
                <label className={labelCls}>Nama Produk *</label>
                <input {...register("name")} className={inputCls} placeholder="Aqua Botol 600ml" />
                {errors.name && <p className={errCls}>{errors.name.message}</p>}
              </div>

              {/* Kategori */}
              <div>
                <label className={labelCls}>Kategori *</label>
                <select {...register("categoryId")} className={inputCls}>
                  <option value="">Pilih kategori…</option>
                  {(categories ?? []).map((c: { id: string; name: string; icon?: string }) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className={errCls}>{errors.categoryId.message}</p>}
              </div>

              {/* Brand */}
              <div>
                <label className={labelCls}>Brand</label>
                <input {...register("brand")} className={inputCls} placeholder="Aqua, Nestlé, …" />
              </div>

              {/* Harga */}
              <div>
                <label className={labelCls}>Harga Pokok (HPP) *</label>
                <input {...register("basePrice", { valueAsNumber: true })} type="number" className={inputCls} placeholder="2500" />
                {errors.basePrice && <p className={errCls}>{errors.basePrice.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Harga Jual *</label>
                <input {...register("sellingPrice", { valueAsNumber: true })} type="number" className={inputCls} placeholder="3500" />
                {errors.sellingPrice && <p className={errCls}>{errors.sellingPrice.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Harga Min (negosiasi)</label>
                <input {...register("minPrice", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="3000" />
              </div>

              {/* Unit */}
              <div>
                <label className={labelCls}>Satuan *</label>
                <select {...register("unit")} className={inputCls}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pcs / Box</label>
                <input {...register("pcsPerBox", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="24" />
              </div>
              <div>
                <label className={labelCls}>Box / Karton</label>
                <input {...register("boxPerKarton", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="6" />
              </div>
              <div>
                <label className={labelCls}>Berat (gram/pcs)</label>
                <input {...register("weight", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="250" />
              </div>

              {/* Clothing fields */}
              {isClothing && <>
                <div>
                  <label className={labelCls}>Jenis Pakaian</label>
                  <select {...register("clothingType")} className={inputCls}>
                    <option value="">Pilih jenis…</option>
                    {CLOTH_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select {...register("gender")} className={inputCls}>
                    <option value="">Pilih…</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </>}

              {/* Beverage fields */}
              {isBeverage && <>
                <div>
                  <label className={labelCls}>Volume (ml)</label>
                  <input {...register("volume", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="600" />
                </div>
                <div>
                  <label className={labelCls}>Kemasan</label>
                  <select {...register("packaging")} className={inputCls}>
                    <option value="">Pilih kemasan…</option>
                    {PACKAGING.map(p => <option key={p} value={p}>{p.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </>}

              {/* Expiry field */}
              {hasExpiry && (
                <div>
                  <label className={labelCls}>Masa Simpan (hari)</label>
                  <input {...register("expiryDays", { valueAsNumber: true, setValueAs: v => v === "" ? undefined : Number(v) })} type="number" className={inputCls} placeholder="5" />
                </div>
              )}

              {/* Description */}
              <div className="col-span-2">
                <label className={labelCls}>Deskripsi</label>
                <textarea {...register("description")} rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Deskripsi produk…" />
              </div>

              {/* Flags */}
              <div className="col-span-2 flex flex-wrap gap-4">
                {[
                  { name: "isVariant", label: "Punya varian (ukuran/warna)" },
                  { name: "hasExpiry", label: "Ada tanggal kadaluarsa" },
                  { name: "featured",  label: "Produk unggulan" },
                ].map(f => (
                  <label key={f.name} className="flex items-center gap-2 cursor-pointer">
                    <input {...register(f.name as keyof CreateProductInput)} type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary" />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border p-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted">Batal</button>
          <button type="submit" form="product-form" disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Perbarui" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
