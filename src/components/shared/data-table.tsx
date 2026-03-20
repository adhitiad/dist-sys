// src/components/shared/data-table.tsx
"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key:       string;
  header:    string;
  sortable?: boolean;
  className?: string;
  cell:      (row: T, idx: number) => React.ReactNode;
};

type Props<T> = {
  data:        T[];
  columns:     Column<T>[];
  keyField:    keyof T;
  isLoading?:  boolean;
  total?:      number;
  page?:       number;
  limit?:      number;
  onPageChange?:(page: number) => void;
  onSearch?:   (q: string) => void;
  searchPlaceholder?: string;
  onSort?:     (key: string, order: "asc" | "desc") => void;
  emptyText?:  string;
  actions?:    React.ReactNode;
};

export function DataTable<T>({
  data, columns, keyField, isLoading, total = 0, page = 1, limit = 20,
  onPageChange, onSearch, searchPlaceholder = "Cari…", onSort, emptyText = "Tidak ada data.", actions,
}: Props<T>) {
  const [sortKey, setSortKey]     = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch]       = useState("");

  const totalPages = Math.ceil(total / limit);

  function handleSort(key: string) {
    const order = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key); setSortOrder(order);
    onSort?.(key, order);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); onSearch?.(search);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {onSearch && (
          <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            />
          </form>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {columns.map(col => (
                  <th key={col.key}
                    className={cn("px-4 py-3 text-left font-semibold text-muted-foreground", col.className,
                      col.sortable && "cursor-pointer select-none hover:text-foreground")}
                    onClick={() => col.sortable && handleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        sortKey === col.key
                          ? sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={columns.length} className="py-16 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Memuat data…</p>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">{emptyText}</td></tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={String(row[keyField])} className="hover:bg-muted/30 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className={cn("px-4 py-3", col.className)}>
                        {col.cell(row, idx)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} dari {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}
                className="rounded-md border border-border p-1.5 hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => onPageChange?.(p)}
                    className={cn("rounded-md border px-2.5 py-1 text-xs font-medium",
                      p === page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}
                className="rounded-md border border-border p-1.5 hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
