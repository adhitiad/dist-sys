// src/app/(dashboard)/dashboard/page.tsx
"use client";
import { useState } from "react";
import { format, subDays, startOfMonth } from "date-fns";
import { ShoppingCart, DollarSign, Clock, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { useDashboard, useLowStock } from "@/hooks/use-queries";
import { useStore } from "@/store";
import { rupiah, formatDateTime } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

export default function DashboardPage() {
  const { warehouseFilter } = useStore();
  const [range, setRange] = useState("month");

  const from = range === "today" ? format(new Date(), "yyyy-MM-dd")
    : range === "week"  ? format(subDays(new Date(), 7), "yyyy-MM-dd")
    : format(startOfMonth(new Date()), "yyyy-MM-dd");
  const to = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useDashboard({ from, to, warehouseId: warehouseFilter ?? undefined });
  const { data: lowStock }  = useLowStock(warehouseFilter ?? undefined);

  const summary = data?.orderSummary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Selamat datang kembali 👋</p>
        </div>
        <div className="flex gap-2">
          {["today","week","month"].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${range === r ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
              {r === "today" ? "Hari ini" : r === "week" ? "7 Hari" : "Bulan ini"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Pesanan"   value={summary?.totalOrders ?? 0} icon={ShoppingCart} color="blue"   sub={`${from} – ${to}`} />
        <StatCard title="Pendapatan"      value={rupiah(summary?.totalRevenue ?? 0)} icon={DollarSign} color="green" />
        <StatCard title="Order Pending"   value={summary?.pendingOrders ?? 0} icon={Clock} color="yellow" />
        <StatCard title="Stok Menipis"    value={lowStock?.length ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Order by status bar */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Status Pesanan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary?.byStatus?.map((s: { status: string; _count: { status: number } }) => ({ name: s.status.replace(/_/g," "), value: s._count.status })) ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Produk Terlaris</h2>
          <div className="space-y-3">
            {(data?.topProducts ?? []).map((p: { product?: { name: string }; _sum: { quantity: number; subtotal: number } }, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i+1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{p.product?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{p._sum.quantity} pcs</p>
                </div>
                <span className="text-xs font-semibold text-green-600">{rupiah(p._sum.subtotal ?? 0)}</span>
              </div>
            ))}
            {!data?.topProducts?.length && <p className="text-xs text-muted-foreground">Belum ada data</p>}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Pesanan Terbaru</h2>
          <div className="space-y-2">
            {(data?.recentOrders ?? []).map((o: { id: string; orderNumber: string; customerName?: string; total: number; status: string; paymentStatus: string; createdAt: string }) => (
              <div key={o.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{o.orderNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.customerName ?? "Guest"} · {formatDateTime(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold">{rupiah(o.total)}</span>
                  <div className="flex gap-1">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                </div>
              </div>
            ))}
            {!data?.recentOrders?.length && <p className="text-xs text-muted-foreground">Belum ada pesanan</p>}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Peringatan Stok Menipis</h2>
          <div className="space-y-2">
            {(lowStock ?? []).slice(0, 6).map((s: { product: { name: string; sku: string }; warehouse: { name: string }; quantity: number; minStock: number }, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{s.product.name}</p>
                  <p className="text-xs text-muted-foreground">{s.warehouse.name}</p>
                </div>
                <span className="text-xs font-bold text-red-600">{s.quantity} / {s.minStock}</span>
              </div>
            ))}
            {!lowStock?.length && (
              <div className="flex flex-col items-center py-6 text-green-600">
                <Package className="h-8 w-8" />
                <p className="mt-2 text-sm font-medium">Semua stok aman ✓</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
