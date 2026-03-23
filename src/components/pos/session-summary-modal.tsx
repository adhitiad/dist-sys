// src/components/pos/session-summary-modal.tsx
"use client";
import { useState } from "react";
import {
  X,
  LogOut,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Package,
  Banknote,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { rupiah, formatDateTime } from "@/lib/utils";
import { useClosePOSSession } from "@/hooks/use-queries";

type SessionOrder = {
  id: string;
  orderNumber: string;
  total: number;
  createdAt: string;
  paymentMethod: string;
};

type POSSession = {
  id: string;
  sessionCode: string;
  warehouseId: string;
  openingBalance: number;
  openedAt: string;
  warehouse: { id: string; name: string; code: string };
  user: { id: string; name: string };
  orders?: SessionOrder[];
  _count?: { orders: number };
};

type SessionSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  session: POSSession;
  onSuccess: () => void;
};

export function SessionSummaryModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: SessionSummaryModalProps) {
  const [closingBalance, setClosingBalance] = useState(session.openingBalance);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"summary" | "confirm">("summary");

  const closeSession = useClosePOSSession();

  // Calculate totals
  const totalSales = session.orders?.filter(o => o).reduce((sum, o) => sum + o.total, 0) ?? 0;
  const transactionCount = session.orders?.length ?? 0;
  const expectedBalance = session.openingBalance + totalSales;
  const difference = closingBalance - expectedBalance;

  const handleCloseSession = async () => {
    try {
      await closeSession.mutateAsync({
        closingBalance,
        notes: notes || undefined,
      });
      toast.success("Sesi POS berhasil ditutup.");
      onSuccess();
    } catch {}
  };

  if (!isOpen) return null;

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  session.orders?.forEach((order) => {
    const method = order.paymentMethod || "CASH";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + order.total;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold">Tutup Sesi POS</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "summary" ? (
          <>
            {/* Summary Body */}
            <div className="space-y-4 p-4">
              {/* Session Info */}
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kode Sesi</span>
                  <span className="font-medium">{session.sessionCode}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gudang</span>
                  <span className="font-medium">{session.warehouse.name}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dibuka</span>
                  <span className="font-medium">{formatDateTime(session.openedAt)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">Transaksi</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{transactionCount}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Total Penjualan</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-green-600">{rupiah(totalSales)}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              {Object.keys(paymentBreakdown).length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Rincian per Metode</p>
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{method.replace(/_/g, " ").toLowerCase()}</span>
                      <span className="font-medium">{rupiah(amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Balance Summary */}
              <div className="rounded-xl bg-primary/5 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo Awal</span>
                    <span>{rupiah(session.openingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>+ Penjualan</span>
                    <span>{rupiah(totalSales)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span>Saldo Seharusnya</span>
                    <span>{rupiah(expectedBalance)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-border p-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
              >
                Batal
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
              >
                <LogOut className="h-4 w-4" />
                Lanjutkan
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirm Body */}
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Saldo Akhir Kas</label>
                <input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>

              {/* Difference indicator */}
              <div className={`rounded-lg p-3 ${
                difference === 0 ? "bg-green-50 text-green-700" :
                difference > 0 ? "bg-blue-50 text-blue-700" :
                "bg-red-50 text-red-700"
              }`}>
                <div className="flex items-center gap-2">
                  {difference !== 0 && <AlertTriangle className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {difference === 0
                      ? "Saldo sesuai!"
                      : difference > 0
                      ? `Selisih lebih: ${rupiah(difference)}`
                      : `Selisih kurang: ${rupiah(Math.abs(difference))}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Catatan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  rows={2}
                  placeholder="Catatan saat tutup sesi..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-border p-4">
              <button
                onClick={() => setStep("summary")}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
              >
                Kembali
              </button>
              <button
                onClick={handleCloseSession}
                disabled={closeSession.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {closeSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Tutup Sesi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
