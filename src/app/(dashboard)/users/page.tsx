// src/app/(dashboard)/users/page.tsx
"use client";
import { useState } from "react";
import { Users, Plus, Shield } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

type User = {
  id: string; name: string; email: string; role: string;
  phone?: string; isActive: boolean; emailVerified: boolean; createdAt: string;
  warehouseStaff?: { warehouse: { name: string; code: string } };
};

const ALL_ROLES = ["OWNER","ADMIN","KASIR","MANAJER_PENJUALAN","MANAJER_PEMBELIAN","AKUNTAN","PENGELOLA_GUDANG","PICKER","PACKER","DRIVER","SUPPLIER","PELANGGAN"];
const ROLE_COLOR: Record<string, string> = {
  OWNER:"bg-purple-100 text-purple-800", ADMIN:"bg-blue-100 text-blue-800",
  KASIR:"bg-cyan-100 text-cyan-800", MANAJER_PENJUALAN:"bg-green-100 text-green-800",
  MANAJER_PEMBELIAN:"bg-teal-100 text-teal-800", AKUNTAN:"bg-indigo-100 text-indigo-800",
  PENGELOLA_GUDANG:"bg-orange-100 text-orange-800", PICKER:"bg-yellow-100 text-yellow-800",
  PACKER:"bg-amber-100 text-amber-800", DRIVER:"bg-rose-100 text-rose-800",
  SUPPLIER:"bg-slate-100 text-slate-800", PELANGGAN:"bg-gray-100 text-gray-700",
};

export default function UsersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, roleFilter],
    queryFn: () => client.get("/api/users", { params: { page, limit: 20, search, role: roleFilter || undefined } }).then(r => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      client.patch(`/api/users/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Status pengguna diperbarui."); },
  });

  const rows: User[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  const cols: Column<User>[] = [
    { key: "name", header: "Pengguna", sortable: true,
      cell: r => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {r.name.slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      )
    },
    { key: "role", header: "Role",
      cell: r => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[r.role] ?? "bg-gray-100 text-gray-700"}`}>
          {r.role.replace(/_/g," ")}
        </span>
      )
    },
    { key: "warehouse", header: "Gudang",
      cell: r => r.warehouseStaff
        ? <span className="text-xs">[{r.warehouseStaff.warehouse.code}] {r.warehouseStaff.warehouse.name}</span>
        : <span className="text-xs text-muted-foreground">—</span>
    },
    { key: "status", header: "Status",
      cell: r => (
        <div className="flex flex-col gap-1">
          <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {r.isActive ? "Aktif" : "Nonaktif"}
          </span>
          {r.emailVerified && <span className="w-fit rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">✓ Email terverifikasi</span>}
        </div>
      )
    },
    { key: "createdAt", header: "Bergabung", sortable: true,
      cell: r => <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
    },
    { key: "actions", header: "Aksi", className: "w-24",
      cell: r => (
        <button
          onClick={() => toggleActive.mutate({ id: r.id, isActive: !r.isActive })}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${r.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
          {r.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      )
    },
  ];

  const filters = (
    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
      <option value="">Semua Role</option>
      {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Pengguna</h1>
          <p className="text-sm text-muted-foreground">{total} pengguna terdaftar</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Tambah Pengguna
        </button>
      </div>

      <DataTable<User>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={setSearch}
        searchPlaceholder="Cari nama, email…"
        emptyText="Belum ada pengguna."
        actions={filters}
      />

      {showForm && (
        <UserFormModal onClose={() => setShowForm(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["users"] }); setShowForm(false); }} />
      )}
    </div>
  );
}

function UserFormModal({ onClose, onSuccess }: { onClose(): void; onSuccess(): void }) {
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", role:"PELANGGAN", warehouseId:"" });
  const [loading, setLoad] = useState(false);
  const { data: whs } = useQuery({ queryKey: ["warehouses-mini"], queryFn: () => client.get("/api/warehouses", { params: { limit: 100 } }).then(r => r.data.data) });
  const warehouses: Array<{ id: string; name: string; code: string }> = whs ?? [];

  const WAREHOUSE_ROLES = ["PENGELOLA_GUDANG","PICKER","PACKER","DRIVER"];
  const needsWarehouse  = WAREHOUSE_ROLES.includes(form.role);

  const inp = (field: string, type = "text") => ({
    type, value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoad(true);
    try {
      await client.post("/api/users", form);
      toast.success("Pengguna berhasil dibuat."); onSuccess();
    } finally { setLoad(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Tambah Pengguna</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="mb-1 block text-xs font-medium">Nama *</label><input {...inp("name")} required /></div>
          <div><label className="mb-1 block text-xs font-medium">Email *</label><input {...inp("email","email")} required /></div>
          <div><label className="mb-1 block text-xs font-medium">Password *</label><input {...inp("password","password")} required /></div>
          <div><label className="mb-1 block text-xs font-medium">Telepon</label><input {...inp("phone","tel")} /></div>
          <div>
            <label className="mb-1 block text-xs font-medium">Role *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, warehouseId: "" }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
            </select>
          </div>
          {needsWarehouse && (
            <div>
              <label className="mb-1 block text-xs font-medium">Gudang *</label>
              <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required>
                <option value="">Pilih gudang…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm hover:bg-muted">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
