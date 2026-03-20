// src/app/(dashboard)/warehouses/page.tsx
"use client";
import { useState } from "react";
import { Plus, Warehouse, MapPin, Phone, Users, Package } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useWarehouses } from "@/hooks/use-queries";
import client from "@/lib/axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Q } from "@/hooks/use-queries";

type WH = {
  id: string; code: string; name: string; address: string; city: string;
  province: string; phone?: string; isActive: boolean;
  _count: { stocks: number; staff: number };
};

export default function WarehousesPage() {
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useWarehouses({ page, limit: 20, search });
  const rows: WH[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  const cols: Column<WH>[] = [
    { key: "code", header: "Kode", sortable: true, className: "w-28",
      cell: r => <span className="font-mono text-xs font-bold text-primary">{r.code}</span> },
    { key: "name", header: "Nama Gudang", sortable: true,
      cell: r => (
        <div>
          <p className="font-medium text-sm">{r.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />{r.city}, {r.province}
          </p>
        </div>
      )
    },
    { key: "address", header: "Alamat",
      cell: r => <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{r.address}</span> },
    { key: "phone", header: "Telepon",
      cell: r => r.phone ? <span className="text-xs">{r.phone}</span> : <span className="text-muted-foreground text-xs">—</span> },
    { key: "stats", header: "Statistik",
      cell: r => (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{r._count.staff} staf</span>
          <span className="flex items-center gap-1"><Package className="h-3 w-3"/>{r._count.stocks} SKU</span>
        </div>
      )
    },
    { key: "isActive", header: "Status",
      cell: r => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {r.isActive ? "Aktif" : "Nonaktif"}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="h-6 w-6 text-primary"/>Gudang</h1>
          <p className="text-sm text-muted-foreground">Kelola semua gudang distribusi</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Tambah Gudang
        </button>
      </div>

      <DataTable<WH>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={setSearch}
        searchPlaceholder="Cari gudang…"
        emptyText="Belum ada gudang."
      />

      {/* Form modal */}
      {showForm && <WarehouseFormModal onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: Q.warehouses() }); setShowForm(false); }} />}
    </div>
  );
}

function WarehouseFormModal({ onClose, onSuccess }: { onClose(): void; onSuccess(): void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", address:"", city:"", province:"", postalCode:"", phone:"" });

  const inp = (field: string) => ({
    value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await client.post("/api/warehouses", form);
      toast.success("Gudang berhasil ditambahkan.");
      onSuccess();
    } catch { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">Tambah Gudang</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Kode *</label><input {...inp("code")} placeholder="WH-005" required /></div>
            <div><label className="mb-1 block text-xs font-medium">Nama *</label><input {...inp("name")} placeholder="Gudang Pusat" required /></div>
          </div>
          <div><label className="mb-1 block text-xs font-medium">Alamat *</label><input {...inp("address")} placeholder="Jl. Industri No.1" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Kota *</label><input {...inp("city")} placeholder="Jakarta" required /></div>
            <div><label className="mb-1 block text-xs font-medium">Provinsi *</label><input {...inp("province")} placeholder="DKI Jakarta" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium">Kode Pos *</label><input {...inp("postalCode")} placeholder="14350" required /></div>
            <div><label className="mb-1 block text-xs font-medium">Telepon</label><input {...inp("phone")} placeholder="021-12345678" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-muted">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
