// src/app/(dashboard)/orders/page.tsx
"use client";
import { useState } from "react";
import { ShoppingCart, Plus, Eye, CreditCard } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { useOrders, useUpdateOrderStatus, useProcessPayment } from "@/hooks/use-queries";
import { rupiah, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string; orderNumber: string; channel: string;
  customerName?: string; customerPhone?: string;
  total: number; subtotal: number; shippingCost: number;
  status: string; paymentStatus: string; paymentMethod?: string;
  paidAmount: number; createdAt: string;
  fulfillment?: { warehouse: { name: string } };
};

const STATUS_OPTS = ["","PENDING","CONFIRMED","PROCESSING","PICKING","PACKING","READY","SHIPPED","DELIVERED","COMPLETED","CANCELLED"];
const CHANNEL_OPTS = ["","ONLINE","OFFLINE","WHATSAPP","MARKETPLACE","PHONE"];

export default function OrdersPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [payModal, setPayModal] = useState<Order | null>(null);

  const { data, isLoading, refetch } = useOrders({ page, limit: 20, search, status: status || undefined, channel: channel || undefined });
  const updateStatus   = useUpdateOrderStatus();
  const processPayment = useProcessPayment();

  const rows: Order[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  async function changeStatus(id: string, newStatus: string) {
    await updateStatus.mutateAsync({ id, status: newStatus });
    toast.success(`Status diubah ke ${newStatus}`);
    refetch();
  }

  const cols: Column<Order>[] = [
    { key: "orderNumber", header: "No. Order", sortable: true, className: "w-40",
      cell: r => (
        <div>
          <p className="font-mono text-xs font-bold text-primary">{r.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{r.channel}</p>
        </div>
      )
    },
    { key: "customer", header: "Pelanggan",
      cell: r => (
        <div>
          <p className="text-sm font-medium">{r.customerName ?? "Guest"}</p>
          <p className="text-xs text-muted-foreground">{r.customerPhone ?? "—"}</p>
        </div>
      )
    },
    { key: "total", header: "Total", sortable: true,
      cell: r => (
        <div>
          <p className="font-semibold text-sm">{rupiah(r.total)}</p>
          <p className="text-xs text-muted-foreground">+ongkir {rupiah(r.shippingCost)}</p>
        </div>
      )
    },
    { key: "status", header: "Status Pesanan",
      cell: r => (
        <div className="flex flex-col gap-1">
          <OrderStatusBadge status={r.status} />
          <select defaultValue="" onChange={e => e.target.value && changeStatus(r.id, e.target.value)}
            className="text-xs border border-border rounded px-1 py-0.5 bg-background outline-none" onClick={e => e.stopPropagation()}>
            <option value="" disabled>Ubah…</option>
            {STATUS_OPTS.filter(s => s && s !== r.status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )
    },
    { key: "payment", header: "Pembayaran",
      cell: r => (
        <div className="flex flex-col gap-1">
          <PaymentStatusBadge status={r.paymentStatus} />
          {r.paymentStatus !== "PAID" && (
            <button onClick={() => setPayModal(r)}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <CreditCard className="h-3 w-3"/> Bayar
            </button>
          )}
        </div>
      )
    },
    { key: "warehouse", header: "Gudang",
      cell: r => <span className="text-xs">{r.fulfillment?.warehouse.name ?? "—"}</span>
    },
    { key: "createdAt", header: "Tanggal", sortable: true,
      cell: r => <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
    },
    { key: "actions", header: "", className: "w-10",
      cell: r => (
        <button onClick={() => setSelected(r)} className="rounded p-1 hover:bg-muted">
          <Eye className="h-4 w-4 text-muted-foreground"/>
        </button>
      )
    },
  ];

  const filters = (
    <div className="flex gap-2">
      <select value={status} onChange={e => setStatus(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
        {STATUS_OPTS.map(s => <option key={s} value={s}>{s || "Semua Status"}</option>)}
      </select>
      <select value={channel} onChange={e => setChannel(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
        {CHANNEL_OPTS.map(c => <option key={c} value={c}>{c || "Semua Channel"}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary"/>Pesanan</h1>
          <p className="text-sm text-muted-foreground">{total} pesanan</p>
        </div>
      </div>

      <DataTable<Order>
        data={rows} columns={cols} keyField="id" isLoading={isLoading}
        total={total} page={page} limit={20}
        onPageChange={setPage} onSearch={setSearch}
        searchPlaceholder="Cari no. order, nama, telepon…"
        emptyText="Belum ada pesanan."
        actions={filters}
      />

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-muted">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span>{selected.customerName ?? "Guest"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span>{selected.channel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{rupiah(selected.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{rupiah(selected.shippingCost)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{rupiah(selected.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dibayar</span><span>{rupiah(selected.paidAmount)}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><OrderStatusBadge status={selected.status}/></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Pembayaran</span><PaymentStatusBadge status={selected.paymentStatus}/></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gudang</span><span>{selected.fulfillment?.warehouse.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{formatDateTime(selected.createdAt)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <PaymentModal order={payModal} onClose={() => setPayModal(null)}
          onSuccess={() => { refetch(); setPayModal(null); toast.success("Pembayaran dicatat."); }}
        />
      )}
    </div>
  );
}

function PaymentModal({ order, onClose, onSuccess }: { order: Order; onClose(): void; onSuccess(): void }) {
  const [amount, setAmount]   = useState(order.total - order.paidAmount);
  const [method, setMethod]   = useState("CASH");
  const [loading, setLoading] = useState(false);
  const processPayment = useProcessPayment();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await processPayment.mutateAsync({ id: order.id, paidAmount: amount, paymentMethod: method });
      onSuccess();
    } finally { setLoading(false); }
  }

  const remaining = order.total - order.paidAmount;
  const change    = amount > remaining ? amount - remaining : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="mb-4 font-bold text-lg">Proses Pembayaran</h2>
        <p className="text-sm text-muted-foreground mb-1">Order: <span className="font-mono font-bold text-primary">{order.orderNumber}</span></p>
        <p className="text-sm mb-4">Sisa tagihan: <span className="font-bold text-red-600">{rupiah(remaining)}</span></p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Metode Pembayaran</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              {["CASH","TRANSFER_BANK","QRIS","COD","KREDIT","DEBIT_CARD","CREDIT_CARD"].map(m =>
                <option key={m} value={m}>{m.replace(/_/g," ")}</option>
              )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Jumlah Bayar</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={1}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {change > 0 && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm">
              Kembalian: <span className="font-bold text-green-700">{rupiah(change)}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm hover:bg-muted">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Memproses…" : "Bayar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
