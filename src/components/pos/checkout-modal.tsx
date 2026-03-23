// src/components/pos/checkout-modal.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import {
  X,
  Banknote,
  QrCode,
  Building2,
  CreditCard,
  Loader2,
  Printer,
  Check,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { rupiah, formatDateTime } from "@/lib/utils";
import { usePOSCheckout } from "@/hooks/use-queries";
import type { CartItem } from "@/store";
import { PaymentMethod } from "@/generated/prisma/enums";

type POSSession = {
  id: string;
  sessionCode: string;
  warehouseId: string;
  warehouse: { id: string; name: string; code: string };
  user: { id: string; name: string };
  openedAt: string;
};

type CheckoutModalProps = {
  session: POSSession;
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  cartTotal: number;
  onClose: () => void;
  onSuccess: () => void;
};

const PAYMENT_METHODS: { method: PaymentMethod; icon: React.ElementType; label: string }[] = [
  { method: PaymentMethod.CASH, icon: Banknote, label: "Tunai" },
  { method: PaymentMethod.QRIS, icon: QrCode, label: "QRIS" },
  { method: PaymentMethod.DEBIT_CARD, icon: CreditCard, label: "Debit" },
  { method: PaymentMethod.TRANSFER_BANK, icon: Building2, label: "Transfer" },
];

export function CheckoutModal({
  session,
  cart,
  customerName,
  customerPhone,
  cartTotal,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState(cartTotal);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paidAmount: number;
    change: number;
    paymentMethod: string;
    createdAt: string;
    customerName: string;
  } | null>(null);

  const checkout = usePOSCheckout();

  const total = cartTotal - discount;
  const change = paidAmount - total;

  const handleCheckout = async () => {
    if (paidAmount < total) {
      toast.error("Jumlah bayar kurang dari total.");
      return;
    }

    try {
      const result = await checkout.mutateAsync({
        warehouseId: session.warehouseId,
        customerName,
        customerPhone,
        paymentMethod,
        paidAmount,
        discount,
        notes,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      });

      setCompletedOrder({
        orderNumber: result.order.orderNumber,
        items: result.order.items.map((i: { product: { name: string }; quantity: number; unitPrice: number; subtotal: number }) => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal: result.order.subtotal,
        discount: result.order.discount,
        total: result.order.total,
        paidAmount: result.order.paidAmount,
        change: result.change,
        paymentMethod: paymentMethod,
        createdAt: result.order.createdAt,
        customerName: customerName || "Walk-in Customer",
      });

      toast.success("Transaksi berhasil!");
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  // Receipt view
  if (completedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white">
        <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl print:shadow-none">
          {/* Receipt Header */}
          <div className="border-b border-border p-4 text-center print:block">
            <h2 className="text-lg font-bold">DistributoR</h2>
            <p className="text-xs text-muted-foreground">{session.warehouse.name}</p>
            <p className="mt-2 text-sm font-medium">{completedOrder.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(completedOrder.createdAt)}</p>
          </div>

          {/* Receipt Body */}
          <div className="p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Kasir: {session.user.name} • Pelanggan: {completedOrder.customerName}
            </p>

            <div className="mb-3 border-b border-border pb-3">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="mb-1 flex justify-between text-sm">
                  <span className="truncate pr-2">
                    {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium">{rupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{rupiah(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Diskon</span>
                  <span>-{rupiah(completedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                <span>Total</span>
                <span>{rupiah(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{completedOrder.paymentMethod}</span>
                <span>{rupiah(completedOrder.paidAmount)}</span>
              </div>
              {completedOrder.change > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Kembalian</span>
                  <span>{rupiah(completedOrder.change)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-border p-4 print:hidden">
            <button
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm hover:bg-muted"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </button>
            <button
              onClick={() => {
                onSuccess();
                setCompletedOrder(null);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              Selesai
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">Pembayaran</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Order Summary */}
          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-border p-3">
            {cart.map((item, idx) => (
              <div key={idx} className="mb-1 flex items-center gap-2 text-sm last:mb-0">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                  {item.image?.url ? (
                    <Image src={item.image.url} alt={item.name} fill className="object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground/50 m-auto mt-2" />
                  )}
                </div>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
                <span className="font-medium">{rupiah(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">Diskon</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium">Metode Pembayaran</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.method}
                  onClick={() => setPaymentMethod(pm.method)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition ${
                    paymentMethod === pm.method
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <pm.icon className="h-5 w-5" />
                  <span className="text-xs">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">Jumlah Bayar</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {paymentMethod === PaymentMethod.CASH && (
              <div className="mt-2 flex gap-2">
                {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPaidAmount(amt)}
                    className="flex-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    {rupiah(amt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium">Catatan</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Opsional"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{rupiah(cartTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span>-{rupiah(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
              <span>Total</span>
              <span>{rupiah(total)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Kembalian</span>
              <span>{rupiah(Math.max(0, change))}</span>
            </div>
          </div>

          {/* Error */}
          {paidAmount < total && (
            <p className="mt-2 text-center text-xs text-red-500">
              Jumlah bayar kurang {rupiah(total - paidAmount)}
            </p>
          )}
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
            onClick={handleCheckout}
            disabled={checkout.isPending || paidAmount < total}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {checkout.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Proses
          </button>
        </div>
      </div>
    </div>
  );
}
