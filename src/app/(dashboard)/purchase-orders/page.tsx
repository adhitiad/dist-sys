// src/app/(dashboard)/purchase-orders/page.tsx
"use client";
import { useState } from "react";
import { FileText, Plus, ChevronDown } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { POStatusBadge } from "@/components/shared/status-badge";
import { usePurchaseOrders, useSuppliers, useWarehouses } from "@/hooks/use-queries";
import { rupiah, formatDate } from "@/lib/utils";
import { POFormModal } from "@/components/order/po-form-modal";

type PO = {
  id: string; poNumber: string; status: string;
  orderDate: string; expectedDate?: string; receivedDate?: string;
  subtotal: number; tax: number; total: number; paidAmount: number;
  supplier: { name: string; company?: string; code: string };
  warehouse: { name: string; code: string };
  items: Array<{ id: string; quantity: number; receivedQty: number; unitPrice: number; subtotal: number; product: { name: string; sku: string } }>;
};

const STATUS_OPTS = ["","DRAFT","SENT","CONFIRMED","PARTIAL_RECEIVED","RECEIVED","INVOICED","PAID","CANCELLED"];

export default function PurchaseOrdersPage() {
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, refetch } = usePurchaseOrders({ page, limit: 20, status: status || undefined });
  const rows: PO[]  = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  const cols: Column<PO>[] = [
    { key: "poNumber", header: "No. PO", sortable: true, className: "w-44",
      cell: r => (
        <div>
          <p className="font-mono text-xs font-bold text-primary">{r.poNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(r.orderDate)}</p>
        </div>
      )
    },
    { key: "supplier", header: "Supplier",
      cell: r => (
        <div>
          <p className="font-medium text-sm">{r.supplier.name}</p>
          {r.supplier.company && <p className="text-xs text-muted-foreground">{r.supplier.company}</p>}
        </div>
      )
    },
    { key: "warehouse", header: "Gudang",
      cell: r => <span className="text-xs">[{r.warehouse.code}] {r.warehouse.name}</span>
    },
    { key: "items", header: "Item",
      cell: r => <span className="text-xs">{r.items.length} produk</span>
    },
    { key: "total", header: "Total", sortable: true,
      cell: r => (
        <div>
          <p className="font-semibold text-sm">{rupiah(r.total)}</p>
          <p className="text-xs text-muted-foreground">Bayar: {rupiah(r.paidAmount)}</p>
        </div>
      )
    },
    { key: "status", header: "Status",
      cell: r => <POStatusBadge status={r.status} />
    },
    { key: "expected", header: "Tgl. Estimasi",
      cell: r => <span className="text-xs text-muted-foreground">{r.expectedDate ? formatDate(r.expectedDate) : "—"}</span>
    },
    { key: "expand", header: "", className: "w-8",
      cell: r => (
        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
          className="rounded p-1 hover:bg-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded === r.id ? "rotate-180" : ""}`}/>
        </button>
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/>Purchase Order</h1>
          <p className="text-sm text-muted-foreground">{total} PO terdaftar</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4"/> Buat PO
        </button>
      </div>

      {/* Table with expandable rows */}
      <div className="space-y-3">
        <DataTable<PO>
          data={rows} columns={cols} keyField="id" isLoading={isLoading}
          total={total} page={page} limit={20}
          onPageChange={setPage} onSearch={() => {}}
          emptyText="Belum ada purchase order."
          actions={filters}
        />

        {/* Expanded detail */}
        {expanded && (() => {
          const po = rows.find(r => r.id === expanded);
          if (!po) return null;
          return (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-semibold">Detail Item — {po.poNumber}</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border">
                  <th className="pb-2 text-left text-muted-foreground">Produk</th>
                  <th className="pb-2 text-center text-muted-foreground">Order</th>
                  <th className="pb-2 text-center text-muted-foreground">Diterima</th>
                  <th className="pb-2 text-right text-muted-foreground">Harga Satuan</th>
                  <th className="pb-2 text-right text-muted-foreground">Subtotal</th>
                </tr></thead>
                <tbody>
                  {po.items.map(item => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground font-mono">{item.product.sku}</p>
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-center">
                        <span className={item.receivedQty >= item.quantity ? "text-green-600 font-medium" : "text-yellow-600"}>
                          {item.receivedQty}
                        </span>
                      </td>
                      <td className="py-2 text-right">{rupiah(item.unitPrice)}</td>
                      <td className="py-2 text-right font-medium">{rupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan={4} className="pt-2 text-right font-semibold">Total:</td>
                  <td className="pt-2 text-right font-bold text-primary">{rupiah(po.total)}</td>
                </tr></tfoot>
              </table>
            </div>
          );
        })()}
      </div>

      {showForm && (
        <POFormModal onClose={() => setShowForm(false)} onSuccess={() => { refetch(); setShowForm(false); }} />
      )}
    </div>
  );
}
