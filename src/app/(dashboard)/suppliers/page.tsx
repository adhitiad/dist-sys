// src/app/(dashboard)/suppliers/page.tsx
"use client";
import { useState } from "react";
import { Building2, Plus, Phone, MapPin } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useSuppliers } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import { toast } from "sonner";
import { Q } from "@/hooks/use-queries";

type Supplier = {
  id: string; code: string; name: string; company?: string; email: string;
  phone: string; city: string; province: string; creditDays: number;
  isActive: boolean; _count: { purchaseOrders: number };
};

export default function SuppliersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useSuppliers({ page, limit: 20, search });
  const rows: Supplier[] = data?.data ?? [];
  const total: number    = data?.meta?.total ?? 0;

  const cols: Column<Supplier>[] = [
    { key: "code", header: "Kode", className: "w-28",
      cell: r => <span className="font-mono text-xs font-bold text-primary">{r.code}</span>
    },
    { key: "name", header: "Nama Supplier",
      cell: r => (
        <div>
          <p className="font-semibold text-sm">{r.name}</p>
          {r.company && <p className="text-xs text-muted-foreground">{r.company}</p>}
        </div>
      )
    },
    { key: "contact", header: "Kontak",
      cell: r => (
        <div className="space-y-0.5">
          <p className="text-xs">{r.email}</p>
          <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3"/>{r.phone}</p>
        </div>
      )
    },
    { key: "location", header: "Lokasi",
      cell: r => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3"/>{r.city}, {r.province}
        </span>
      )
    },
    { key: "terms", header: "Term",
      cell: r => <span className="text-xs">{r.creditDays} hari</span>
    },
    { key: "pos", header: "Total PO",
      cell: r => <span className="text-xs font-medium">{r._count.purchaseOrders} PO</span>
    },
    { key: "status", header: "Status",
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary"/>Supplier</h1>
          <p className="text-sm text-muted-foreground">{total} supplier terdaftar</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Tambah Supplier
        </button>
      </div>

      <DataTable<Supplier>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={setSearch}
        searchPlaceholder="Cari nama, perusahaan, email…"
        emptyText="Belum ada supplier."
      />

      {showForm && (
        <SupplierFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: Q.suppliers() }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({ onClose, onSuccess }: { onClose(): void; onSuccess(): void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:"", company:"", email:"", phone:"", address:"", city:"", province:"",
    postalCode:"", npwp:"", bankName:"", bankAccount:"", bankHolder:"", creditDays: 30,
  });

  const inp = (field: string, type = "text") => ({
    type, value: String(form[field as keyof typeof form]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: type === "number" ? +e.target.value : e.target.value })),
    className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
  });
  const lbl = "mb-1 block text-xs font-medium";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await client.post("/api/suppliers", form);
      toast.success("Supplier berhasil ditambahkan."); onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-bold">Tambah Supplier</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><span className="text-lg">✕</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <form id="supp-form" onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nama *</label><input {...inp("name")} required /></div>
              <div><label className={lbl}>Perusahaan</label><input {...inp("company")} /></div>
              <div><label className={lbl}>Email *</label><input {...inp("email","email")} required /></div>
              <div><label className={lbl}>Telepon *</label><input {...inp("phone")} required /></div>
            </div>
            <div><label className={lbl}>Alamat *</label><input {...inp("address")} required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Kota *</label><input {...inp("city")} required /></div>
              <div><label className={lbl}>Provinsi *</label><input {...inp("province")} required /></div>
              <div><label className={lbl}>Kode Pos</label><input {...inp("postalCode")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>NPWP</label><input {...inp("npwp")} /></div>
              <div><label className={lbl}>Term Kredit (hari)</label><input {...inp("creditDays","number")} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Nama Bank</label><input {...inp("bankName")} /></div>
              <div><label className={lbl}>No. Rekening</label><input {...inp("bankAccount")} /></div>
              <div><label className={lbl}>Atas Nama</label><input {...inp("bankHolder")} /></div>
            </div>
          </form>
        </div>
        <div className="flex gap-3 border-t border-border p-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted">Batal</button>
          <button type="submit" form="supp-form" disabled={loading}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
