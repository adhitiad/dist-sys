// src/components/layout/topbar.tsx
"use client";
import { Bell, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useStore } from "@/store";
import { useLowStock } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Topbar({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const { notifications, markAllRead, unreadCount } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: lowStock } = useLowStock();

  const totalUnread = unreadCount() + (lowStock?.length ?? 0);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(o => !o); if (!notifOpen) markAllRead(); }}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <Bell className="h-4 w-4" />
            {totalUnread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="font-semibold text-sm">Notifikasi</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {/* Low stock alerts */}
                  {(lowStock ?? []).map((item: { product: { name: string }; warehouse: { name: string }; quantity: number; minStock: number }, i: number) => (
                    <div key={i} className="flex gap-3 px-4 py-3 hover:bg-muted/30 border-b border-border/50">
                      <div className="h-2 w-2 mt-1.5 rounded-full bg-yellow-500 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">Stok Menipis: {item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.warehouse.name} — Sisa {item.quantity}/{item.minStock}</p>
                      </div>
                    </div>
                  ))}
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={cn("flex gap-3 px-4 py-3 hover:bg-muted/30 border-b border-border/50", !n.isRead && "bg-primary/5")}>
                      <div className={cn("h-2 w-2 mt-1.5 rounded-full shrink-0",
                        n.type === "success" ? "bg-green-500" : n.type === "error" ? "bg-red-500" : n.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                      )} />
                      <div>
                        <p className="text-xs font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                    </div>
                  ))}
                  {totalUnread === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
