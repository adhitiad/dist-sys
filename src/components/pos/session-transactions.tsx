// src/components/pos/session-transactions.tsx
"use client";
import { useState } from "react";
import {
  Receipt,
  ChevronRight,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  Clock,
  X,
} from "lucide-react";
import { rupiah, formatDateTime } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
  items?: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: number;
  }>;
};

type SessionTransactionsProps = {
  orders: Order[];
  sessionCode: string;
};

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  QRIS: QrCode,
  DEBIT_CARD: CreditCard,
  TRANSFER_BANK: Building2,
  CREDIT_CARD: CreditCard,
};

export function SessionTransactions({ orders, sessionCode }: SessionTransactionsProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <Receipt className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {orders.slice(0, 5).map((order) => {
          const PaymentIcon = PAYMENT_ICONS[order.paymentMethod] || Banknote;
          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <PaymentIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-sm font-bold text-primary">{rupiah(order.total)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{order.customerName || "Walk-in"}</span>
                  <span>•</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
        {orders.length > 5 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {orders.length - 5} transaksi lainnya
          </p>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Detail Transaksi</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3 rounded-lg bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">No. Order</span>
                  <span className="font-medium">{selectedOrder.orderNumber}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Pelanggan</span>
                  <span className="font-medium">{selectedOrder.customerName || "Walk-in"}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Waktu</span>
                  <span className="font-medium">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Item</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="truncate pr-2">
                        {item.product.name} <span className="text-muted-foreground">x{item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium">{rupiah(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{rupiah(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
