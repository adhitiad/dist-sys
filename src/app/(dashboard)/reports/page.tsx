// src/app/(dashboard)/reports/page.tsx
"use client";
import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { useDashboard, useLowStock, useOrders } from "@/hooks/use-queries";
import { useStore } from "@/store";
import { rupiah, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"];

const RANGES = [
  { label: "Hari Ini",    from: () => format(new Date(),"yyyy-MM-dd"),          to: () => format(new Date(),"yyyy-MM-dd") },
  { label: "7 Hari",     from: () => format(subDays(new Date(),6),"yyyy-MM-dd"), to: () => format(new Date(),"yyyy-MM-dd") },
  { label: "Bulan Ini",  from: () => format(startOfMonth(new Date()),"yyyy-MM-dd"), to: () => format(endOfMonth(new Date()),"yyyy-MM-dd") },
  { label: "Bulan Lalu", from: () => format(startOfMonth(subMonths(new Date(),1)),"yyyy-MM-dd"), to: () => format(endOfMonth(subMonths(new Date(),1)),"yyyy-MM-dd") },
];

export default function ReportsPage() {
  const [rangeIdx, setRangeIdx]   = useState(2);
  const { warehouseFilter }       = useStore();
  const from = RANGES[rangeIdx].from();
  const to   = RANGES[rangeIdx].to();

  const { data, isLoading, refetch } = useDashboard({ from, to, warehouseId: warehouseFilter ?? undefined });
  const { data: lowStock }  = useLowStock(warehouseFilter ?? undefined);
  const { data: ordersData } = useOrders({ limit: 100, dateFrom: from, dateTo: to });

  const summary  = data?.orderSummary;
  const orders: Array<{ total: number; paymentStatus: string; status: string; createdAt: string; orderNumber: string; customerName?: string }> = ordersData?.data ?? [];

  // Group orders by day for trend chart
  const trendMap: Record<string, number> = {};
  orders.forEach(o => {
    if (o.paymentStatus !== "PAID") return;
    const day = o.createdAt.slice(0, 10);
    trendMap[day] = (trendMap[day] ?? 0) + o.total;
  });
  const trendData = Object.entries(trendMap).sort(([a],[b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date: formatDate(date,"dd/MM"), revenue }));

  // Status breakdown pie
  const pieData = (summary?.byStatus ?? []).map((s: { status: string; _count: { status: number } }) => ({
    name: s.status, value: s._count.status,
  }));

  // Channel breakdown
  const channelMap: Record<string, number> = {};
  orders.forEach(o => {
    const chan = (o as unknown as { channel: string }).channel ?? "ONLINE";
    channelMap[chan] = (channelMap[chan] ?? 0) + 1;
  });
  const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary"/>Laporan</h1>
          <p className="text-sm text-muted-foreground">{from} s/d {to}</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r, i) => (
            <button key={i} onClick={() => setRangeIdx(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${rangeIdx === i ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
              {r.label}
            </button>
          ))}
          <button onClick={() => refetch()} className="rounded-lg border border-border p-2 hover:bg-muted">
            <RefreshCw className="h-4 w-4"/>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Pesanan",  value: summary?.totalOrders ?? 0,                        color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Pendapatan",     value: rupiah(summary?.totalRevenue ?? 0),                color: "text-green-600",  bg: "bg-green-50" },
          { label: "Pending",        value: summary?.pendingOrders ?? 0,                       color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Stok Menipis",   value: lowStock?.length ?? 0,                             color: "text-red-600",    bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-border p-5 ${s.bg}`}>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Tren Pendapatan</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="date" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(1)}jt`}/>
                <Tooltip formatter={(v) => rupiah(v as number)}/>
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data pendapatan</div>
          )}
        </div>

        {/* Status pie */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Status Pesanan</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Top 5 Produk Terlaris</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(data?.topProducts ?? []).map((p: { product?: { name: string }; _sum: { quantity: number } }) => ({ name: p.product?.name?.slice(0,15) ?? "—", qty: p._sum.quantity }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Bar dataKey="qty" fill="#10b981" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Pesanan per Channel</h2>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis type="number" tick={{ fontSize: 11 }}/>
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80}/>
                <Tooltip/>
                <Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data channel</div>
          )}
        </div>
      </div>

      {/* Low stock table */}
      {(lowStock?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-red-600">⚠️ Produk dengan Stok Menipis ({lowStock?.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="pb-2 text-left font-semibold text-muted-foreground">Produk</th>
                <th className="pb-2 text-left font-semibold text-muted-foreground">Gudang</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Stok</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Min. Stok</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">%</th>
              </tr></thead>
              <tbody>
                {(lowStock ?? []).map((s: { product: { name: string; sku: string }; variant?: { size?: string; color?: string }; warehouse: { name: string }; quantity: number; minStock: number }, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2">
                      <p className="font-medium">{s.product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.product.sku}{s.variant?.size ? ` · ${s.variant.size}` : ""}</p>
                    </td>
                    <td className="py-2 text-muted-foreground">{s.warehouse.name}</td>
                    <td className="py-2 text-center font-bold text-red-600">{s.quantity}</td>
                    <td className="py-2 text-center text-muted-foreground">{s.minStock}</td>
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (s.quantity / s.minStock) * 100)}%` }}/>
                        </div>
                        <span className="text-xs text-red-600">{Math.round((s.quantity / s.minStock) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
