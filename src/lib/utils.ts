// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: Date | string, fmt = "dd MMM yyyy") {
  return format(new Date(date), fmt, { locale: idLocale });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: idLocale });
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale });
}

export function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

export function truncate(str: string, maxLen = 50) {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// Status badge color map
export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-800",
  CONFIRMED:  "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  PICKING:    "bg-purple-100 text-purple-800",
  PACKING:    "bg-violet-100 text-violet-800",
  READY:      "bg-cyan-100 text-cyan-800",
  SHIPPED:    "bg-sky-100 text-sky-800",
  DELIVERED:  "bg-teal-100 text-teal-800",
  COMPLETED:  "bg-green-100 text-green-800",
  CANCELLED:  "bg-red-100 text-red-800",
  RETURNED:   "bg-orange-100 text-orange-800",
};

export const TRANSFER_STATUS_COLOR: Record<string, string> = {
  DRAFT:            "bg-gray-100 text-gray-700",
  REQUESTED:        "bg-yellow-100 text-yellow-800",
  APPROVED:         "bg-blue-100 text-blue-800",
  REJECTED:         "bg-red-100 text-red-800",
  IN_TRANSIT:       "bg-orange-100 text-orange-800",
  RECEIVED:         "bg-green-100 text-green-800",
  PARTIAL_RECEIVED: "bg-teal-100 text-teal-800",
  CANCELLED:        "bg-red-100 text-red-800",
};
