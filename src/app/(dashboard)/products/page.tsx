// src/app/(dashboard)/products/page.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus, Package, Tag, Layers } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useProducts, useCategories } from "@/hooks/use-queries";
import { rupiah } from "@/lib/utils";
import { ProductFormModal } from "@/components/product/product-form-modal";

type Product = {
  id: string; sku: string; name: string; brand?: string;
  basePrice: number; sellingPrice: number; unit: string;
  isActive: boolean; featured: boolean; isVariant: boolean;
  images: Array<{ url: string; publicId: string }>;
  category: { name: string; icon?: string };
  variants: Array<{ id: string; sku: string; size?: string; color?: string }>;
  _count: { stocks: number };
};

export default function ProductsPage() {
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string>();

  const { data, isLoading, refetch } = useProducts({ page, limit: 20, search, categoryId: catFilter || undefined });
  const { data: categories }         = useCategories();

  const rows: Product[] = data?.data ?? [];
  const total: number   = data?.meta?.total ?? 0;

  const cols: Column<Product>[] = [
    { key: "image", header: "", className: "w-14",
      cell: r => (
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-muted">
          {r.images?.[0]?.url
            ? <Image src={r.images[0].url} alt={r.name} fill className="object-cover" />
            : <Package className="h-5 w-5 text-muted-foreground m-auto mt-2.5" />}
        </div>
      )
    },
    { key: "name", header: "Produk", sortable: true,
      cell: r => (
        <div>
          <p className="font-semibold text-sm">{r.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{r.sku}{r.brand ? ` · ${r.brand}` : ""}</p>
        </div>
      )
    },
    { key: "category", header: "Kategori",
      cell: r => (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
          {r.category.icon} {r.category.name}
        </span>
      )
    },
    { key: "price", header: "Harga", sortable: true,
      cell: r => (
        <div>
          <p className="text-sm font-semibold text-green-600">{rupiah(r.sellingPrice)}</p>
          <p className="text-xs text-muted-foreground">HPP: {rupiah(r.basePrice)}</p>
        </div>
      )
    },
    { key: "unit", header: "Satuan",
      cell: r => (
        <div className="flex flex-col gap-0.5">
          <span className="rounded border border-border px-1.5 py-0.5 text-xs">{r.unit}</span>
          {r.isVariant && <span className="text-xs text-muted-foreground">{r.variants.length} varian</span>}
        </div>
      )
    },
    { key: "stock", header: "Gudang",
      cell: r => <span className="text-xs">{r._count.stocks} gudang</span>
    },
    { key: "status", header: "Status",
      cell: r => (
        <div className="flex flex-col gap-1">
          <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {r.isActive ? "Aktif" : "Nonaktif"}
          </span>
          {r.featured && <span className="w-fit rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">⭐ Unggulan</span>}
        </div>
      )
    },
    { key: "actions", header: "", className: "w-20",
      cell: r => (
        <button onClick={() => { setEditId(r.id); setShowForm(true); }}
          className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted">
          Edit
        </button>
      )
    },
  ];

  const filterBar = (
    <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
      <option value="">Semua Kategori</option>
      {(categories ?? []).map((c: { id: string; name: string; icon?: string; type: string }) => (
        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>Produk</h1>
          <p className="text-sm text-muted-foreground">{total} produk terdaftar</p>
        </div>
        <button onClick={() => { setEditId(undefined); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Tambah Produk
        </button>
      </div>

      <DataTable<Product>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={setSearch}
        searchPlaceholder="Cari produk, SKU, brand…"
        emptyText="Belum ada produk."
        actions={filterBar}
      />

      {showForm && (
        <ProductFormModal
          productId={editId}
          onClose={() => { setShowForm(false); setEditId(undefined); }}
          onSuccess={() => { refetch(); setShowForm(false); setEditId(undefined); }}
        />
      )}
    </div>
  );
}
