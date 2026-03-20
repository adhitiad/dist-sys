// src/components/shared/status-badge.tsx
import { cn } from "@/lib/utils";

type BadgeProps = { status: string; className?: string };

const ORDER: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED:  "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  PICKING:    "bg-purple-100 text-purple-800 border-purple-200",
  PACKING:    "bg-violet-100 text-violet-800 border-violet-200",
  READY:      "bg-cyan-100 text-cyan-800 border-cyan-200",
  SHIPPED:    "bg-sky-100 text-sky-800 border-sky-200",
  DELIVERED:  "bg-teal-100 text-teal-800 border-teal-200",
  COMPLETED:  "bg-green-100 text-green-800 border-green-200",
  CANCELLED:  "bg-red-100 text-red-800 border-red-200",
  RETURNED:   "bg-orange-100 text-orange-800 border-orange-200",
};

const PAYMENT: Record<string, string> = {
  UNPAID:   "bg-red-100 text-red-800 border-red-200",
  PARTIAL:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID:     "bg-green-100 text-green-800 border-green-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
  VOID:     "bg-gray-100 text-gray-500 border-gray-200",
};

const TRANSFER: Record<string, string> = {
  DRAFT:            "bg-gray-100 text-gray-700 border-gray-200",
  REQUESTED:        "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED:         "bg-blue-100 text-blue-800 border-blue-200",
  REJECTED:         "bg-red-100 text-red-800 border-red-200",
  IN_TRANSIT:       "bg-orange-100 text-orange-800 border-orange-200",
  RECEIVED:         "bg-green-100 text-green-800 border-green-200",
  PARTIAL_RECEIVED: "bg-teal-100 text-teal-800 border-teal-200",
  CANCELLED:        "bg-red-100 text-red-800 border-red-200",
};

const PO: Record<string, string> = {
  DRAFT:            "bg-gray-100 text-gray-700 border-gray-200",
  SENT:             "bg-blue-100 text-blue-800 border-blue-200",
  CONFIRMED:        "bg-indigo-100 text-indigo-800 border-indigo-200",
  PARTIAL_RECEIVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  RECEIVED:         "bg-green-100 text-green-800 border-green-200",
  INVOICED:         "bg-purple-100 text-purple-800 border-purple-200",
  PAID:             "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED:        "bg-red-100 text-red-800 border-red-200",
};

const LABEL: Record<string, string> = {
  // order
  PENDING:"Menunggu", CONFIRMED:"Dikonfirmasi", PROCESSING:"Diproses",
  PICKING:"Picking", PACKING:"Packing", READY:"Siap Kirim",
  SHIPPED:"Dikirim", DELIVERED:"Diterima", COMPLETED:"Selesai",
  CANCELLED:"Dibatalkan", RETURNED:"Dikembalikan",
  // payment
  UNPAID:"Belum Bayar", PARTIAL:"Bayar Sebagian", PAID:"Lunas",
  REFUNDED:"Dikembalikan", VOID:"Batal",
  // transfer
  DRAFT:"Draft", REQUESTED:"Diajukan", APPROVED:"Disetujui",
  REJECTED:"Ditolak", IN_TRANSIT:"Dalam Pengiriman",
  RECEIVED:"Diterima", PARTIAL_RECEIVED:"Sebagian Diterima",
  // PO
  SENT:"Terkirim", INVOICED:"Invoice",
};

function badge(map: Record<string, string>, status: string, cls?: string) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      map[status] ?? "bg-gray-100 text-gray-700 border-gray-200", cls
    )}>
      {LABEL[status] ?? status}
    </span>
  );
}

export const OrderStatusBadge   = ({ status, className }: BadgeProps) => badge(ORDER, status, className);
export const PaymentStatusBadge = ({ status, className }: BadgeProps) => badge(PAYMENT, status, className);
export const TransferStatusBadge= ({ status, className }: BadgeProps) => badge(TRANSFER, status, className);
export const POStatusBadge      = ({ status, className }: BadgeProps) => badge(PO, status, className);
