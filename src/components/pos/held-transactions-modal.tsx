// src/components/pos/held-transactions-modal.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import {
  X,
  Clock,
  Trash2,
  Play,
  Package,
  ShoppingCart,
} from "lucide-react";
import { rupiah, formatDateTime } from "@/lib/utils";
import { useStore, type HeldTransaction } from "@/store";

type HeldTransactionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onResume: (held: HeldTransaction) => void;
};

export function HeldTransactionsModal({
  isOpen,
  onClose,
  onResume,
}: HeldTransactionsModalProps) {
  const { heldTransactions, deleteHeldTransaction } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteHeldTransaction(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleResume = (held: HeldTransaction) => {
    onResume(held);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Transaksi Tertahan</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {heldTransactions.length}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {heldTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">Tidak ada transaksi tertahan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldTransactions.map((held) => {
                const total = held.items.reduce(
                  (sum, item) => sum + (item.unitPrice - item.discount) * item.quantity,
                  0
                ) - held.discountAmount;

                return (
                  <div
                    key={held.id}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {held.customerName || "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(held.heldAt)}
                        </p>
                        {held.notes && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {held.notes}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-primary">
                        {rupiah(total)}
                      </p>
                    </div>

                    {/* Items preview */}
                    <div className="mb-3 flex flex-wrap gap-1">
                      {held.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {item.image?.url ? (
                            <div className="relative h-4 w-4 overflow-hidden rounded">
                              <Image
                                src={item.image.url}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <Package className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[80px]">{item.name}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                      ))}
                      {held.items.length > 3 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          +{held.items.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResume(held)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Lanjutkan
                      </button>
                      <button
                        onClick={() => handleDelete(held.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                          confirmDelete === held.id
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "border border-border text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmDelete === held.id ? "Yakin?" : "Hapus"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
