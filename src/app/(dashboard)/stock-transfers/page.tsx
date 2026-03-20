// src/app/(dashboard)/stock-transfers/page.tsx
"use client";
import { useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TransferStatusBadge } from "@/components/shared/status-badge";
import { useTransfers, useApproveTransfer, useDispatchTransfer, useWarehouses } from "@/hooks/use-queries";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { TransferFormModal } from "@/components/warehouse/transfer-form-modal";

type Transfer = {
  id: string; transferCode: string; priority: string; status: string;
  fromWarehouse: { name: string; code: string; city: string };
  toWarehouse:   { name: string; code: string; city: string };
  requestedBy:   { name: string };
  approvedBy?:   { name: string };
  items: Array<{ id: string; requestedQty: number; receivedQty?: number; product: { name: string }; variant?: { size?: string; color?: string } }>;
  requestedAt: string; approvedAt?: string; receivedAt?: string; notes?: string;
};

const STATUS_OPTS = ["","DRAFT","REQUESTED","APPROVED","REJECTED","IN_TRANSIT","RECEIVED","PARTIAL_RECEIVED","CANCELLED"];
const PRIORITY_COLOR: Record<string, string> = {
  LOW:"bg-gray-100 text-gray-600", NORMAL:"bg-blue-100 text-blue-700",
  HIGH:"bg-orange-100 text-orange-700", URGENT:"bg-red-100 text-red-700",
};

export default function StockTransfersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const { data, isLoading, refetch } = useTransfers({ page, limit: 20, status: status || undefined });
  const approveTransfer = useApproveTransfer();
  const dispatchTransfer = useDispatchTransfer();

  const rows: Transfer[] = data?.data ?? [];
  const total: number    = data?.meta?.total ?? 0;

  async function handleApprove(id: string, approved: boolean) {
    await approveTransfer.mutateAsync({ id, approved });
    toast.success(approved ? "Transfer disetujui." : "Transfer ditolak.");
    refetch();
  }
  async function handleDispatch(id: string) {
    await dispatchTransfer.mutateAsync(id);
    toast.success("Barang dalam perjalanan."); refetch();
  }

  const cols: Column<Transfer>[] = [
    { key: "code", header: "Kode", className: "w-36",
      cell: r => (
        <div>
          <p className="font-mono text-xs font-bold text-primary">{r.transferCode}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</span>
        </div>
      )
    },
    { key: "route", header: "Rute",
      cell: r => (
        <div className="flex items-center gap-2 text-sm">
          <div className="text-center"><p className="font-medium">{r.fromWarehouse.code}</p><p className="text-xs text-muted-foreground">{r.fromWarehouse.city}</p></div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0"/>
          <div className="text-center"><p className="font-medium">{r.toWarehouse.code}</p><p className="text-xs text-muted-foreground">{r.toWarehouse.city}</p></div>
        </div>
      )
    },
    { key: "items", header: "Item",
      cell: r => (
        <div className="space-y-0.5">
          {r.items.slice(0, 2).map((item, i) => (
            <p key={i} className="text-xs truncate max-w-[180px]">
              {item.product.name} {item.variant?.size ? `(${item.variant.size})` : ""} — {item.requestedQty} pcs
            </p>
          ))}
          {r.items.length > 2 && <p className="text-xs text-muted-foreground">+{r.items.length - 2} item lainnya</p>}
        </div>
      )
    },
    { key: "status", header: "Status",
      cell: r => <TransferStatusBadge status={r.status} />
    },
    { key: "requestedBy", header: "Diajukan oleh",
      cell: r => (
        <div>
          <p className="text-xs font-medium">{r.requestedBy.name}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(r.requestedAt)}</p>
        </div>
      )
    },
    { key: "actions", header: "Aksi", className: "w-40",
      cell: r => (
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setSelected(r)} className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted">Detail</button>
          {r.status === "REQUESTED" && <>
            <button onClick={() => handleApprove(r.id, true)}  className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 hover:bg-green-200">Setuju</button>
            <button onClick={() => handleApprove(r.id, false)} className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200">Tolak</button>
          </>}
          {r.status === "APPROVED" && (
            <button onClick={() => handleDispatch(r.id)} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200">Kirim</button>
          )}
          {r.status === "IN_TRANSIT" && (
            <button onClick={() => setSelected(r)} className="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700 hover:bg-teal-200">Terima</button>
          )}
        </div>
      )
    },
  ];

  const filters = (
    <select value={status} onChange={e => setStatus(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
      {STATUS_OPTS.map(s => <option key={s} value={s}>{s || "Semua Status"}</option>)}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowLeftRight className="h-6 w-6 text-primary"/>Transfer Stok</h1>
          <p className="text-sm text-muted-foreground">Kelola perpindahan barang antar gudang</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Buat Transfer
        </button>
      </div>

      <DataTable<Transfer>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={() => {}}
        emptyText="Belum ada transfer stok."
        actions={filters}
      />

      {showForm && (
        <TransferFormModal onClose={() => setShowForm(false)} onSuccess={() => { refetch(); setShowForm(false); }} />
      )}
    </div>
  );
}
