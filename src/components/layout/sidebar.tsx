// src/components/layout/sidebar.tsx
"use client";
import { UserRole } from "@/generated/prisma/browser";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.KASIR,
      UserRole.MANAJER_PENJUALAN,
      UserRole.MANAJER_PEMBELIAN,
      UserRole.AKUNTAN,
    ],
  },
  {
    href: "/warehouses",
    label: "Gudang",
    icon: Warehouse,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.PENGELOLA_GUDANG,
      UserRole.MANAJER_PEMBELIAN,
    ],
  },
  {
    href: "/products",
    label: "Produk",
    icon: Package,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.KASIR,
      UserRole.MANAJER_PENJUALAN,
      UserRole.MANAJER_PEMBELIAN,
    ],
  },
  {
    href: "/orders",
    label: "Pesanan",
    icon: ShoppingCart,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.KASIR,
      UserRole.MANAJER_PENJUALAN,
      UserRole.PICKER,
      UserRole.PACKER,
      UserRole.DRIVER,
    ],
  },
  {
    href: "/customers",
    label: "Pelanggan",
    icon: User,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.KASIR,
      UserRole.MANAJER_PENJUALAN,
    ],
  },
  {
    href: "/stock-transfers",
    label: "Transfer Stok",
    icon: ArrowLeftRight,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.PENGELOLA_GUDANG,
      UserRole.PICKER,
      UserRole.PACKER,
      UserRole.DRIVER,
    ],
  },
  {
    href: "/suppliers",
    label: "Supplier",
    icon: Building2,
    roles: [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAJER_PEMBELIAN],
  },
  {
    href: "/purchase-orders",
    label: "Purchase Order",
    icon: FileText,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.MANAJER_PEMBELIAN,
      UserRole.AKUNTAN,
    ],
  },
  {
    href: "/reports",
    label: "Laporan",
    icon: BarChart3,
    roles: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.AKUNTAN,
      UserRole.MANAJER_PENJUALAN,
      UserRole.MANAJER_PEMBELIAN,
    ],
  },
  {
    href: "/users",
    label: "Pengguna",
    icon: Users,
    roles: [UserRole.OWNER, UserRole.ADMIN],
  },
  {
    href: "/settings",
    label: "Pengaturan",
    icon: Settings,
    roles: [UserRole.OWNER, UserRole.ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, user } = useStore();

  const visible = NAV.filter(
    (n) => !user || n.roles.includes(user.role as UserRole),
  );

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          sidebarOpen ? "justify-between" : "justify-center",
        )}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">
              DistributoR
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 hover:bg-muted transition"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visible.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !sidebarOpen && "justify-center px-0",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.badge ? (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "border-t border-border p-3",
          !sidebarOpen && "flex justify-center",
        )}
      >
        {sidebarOpen && user ? (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(user.name ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{user.name ?? "Unknown"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {(user.role ?? "USER").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        ) : null}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-red-600 transition",
            !sidebarOpen && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {sidebarOpen && "Keluar"}
        </button>
      </div>
    </aside>
  );
}
