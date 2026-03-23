// src/store/index.ts
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { UserRole } from "@/generated/prisma/client";
import type { CloudinaryImage } from "@/lib/cloudinary";

// ── Types ─────────────────────────────────────────────────────────

export type AuthUser = { id: string; name: string; email: string; image?: string; role: UserRole; phone?: string };

export type CartItem = {
  productId: string; variantId?: string;
  name: string; sku: string;
  image?: CloudinaryImage;
  size?: string; color?: string;
  quantity: number; unitPrice: number; discount: number;
};

export type HeldTransaction = {
  id: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  discountCode: string;
  discountAmount: number;
  heldAt: Date;
  notes?: string;
};

export type AppNotif = {
  id: string; type: "success"|"error"|"warning"|"info";
  title: string; message: string; link?: string;
  isRead: boolean; createdAt: Date;
};

// ── Store ─────────────────────────────────────────────────────────

type Store = {
  // Auth
  user:       AuthUser | null;
  isLoading:  boolean;
  setUser:    (u: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  clearAuth:  () => void;

  // Cart (POS kasir / toko online)
  cart:           CartItem[];
  discountCode:   string;
  discountAmount: number;
  addToCart:      (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQty:  (productId: string, variantId: string|undefined, qty: number) => void;
  clearCart:      () => void;
  setDiscount:    (code: string, amount: number) => void;
  cartSubtotal:   () => number;
  cartTotal:      () => number;
  cartCount:      () => number;

  // Held Transactions (Transaksi tertahan)
  heldTransactions: HeldTransaction[];
  holdTransaction:  (customerName: string, customerPhone: string, notes?: string) => void;
  resumeTransaction: (id: string) => void;
  deleteHeldTransaction: (id: string) => void;
  heldCount: () => number;

  // UI
  sidebarOpen:       boolean;
  toggleSidebar:     () => void;
  setSidebarOpen:    (v: boolean) => void;
  notifications:     AppNotif[];
  addNotif:          (n: Omit<AppNotif,"id"|"isRead"|"createdAt">) => void;
  removeNotif:       (id: string) => void;
  markAllRead:       () => void;
  unreadCount:       () => number;

  // Dashboard filters
  warehouseFilter:   string | null;
  dateRange:         { from: Date; to: Date };
  setWarehouseFilter:(id: string|null) => void;
  setDateRange:      (r: { from: Date; to: Date }) => void;
};

export const useStore = create<Store>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // ── Auth ────────────────────────────────────────────
          user: null, isLoading: true,
          setUser:    (u) => set(s => { s.user = u; }),
          setLoading: (v) => set(s => { s.isLoading = v; }),
          clearAuth:  ()  => set(s => { s.user = null; }),

          // ── Cart ────────────────────────────────────────────
          cart: [], discountCode: "", discountAmount: 0,
          addToCart: (item) => set(s => {
            const idx = s.cart.findIndex(i => i.productId === item.productId && i.variantId === item.variantId);
            if (idx >= 0) s.cart[idx].quantity += item.quantity;
            else s.cart.push(item);
          }),
          removeFromCart: (pid, vid) => set(s => {
            s.cart = s.cart.filter(i => !(i.productId === pid && i.variantId === vid));
          }),
          updateCartQty: (pid, vid, qty) => set(s => {
            const idx = s.cart.findIndex(i => i.productId === pid && i.variantId === vid);
            if (idx < 0) return;
            if (qty <= 0) s.cart.splice(idx, 1);
            else s.cart[idx].quantity = qty;
          }),
          clearCart: () => set(s => { s.cart = []; s.discountCode = ""; s.discountAmount = 0; }),
          setDiscount: (code, amount) => set(s => { s.discountCode = code; s.discountAmount = amount; }),
          cartSubtotal: () => get().cart.reduce((sum, i) => sum + (i.unitPrice - i.discount) * i.quantity, 0),
          cartTotal:    () => get().cartSubtotal() - get().discountAmount,
          cartCount:    () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

          // ── Held Transactions ────────────────────────────────
          heldTransactions: [],
          holdTransaction: (customerName, customerPhone, notes) => set(s => {
            if (s.cart.length === 0) return;
            const held: HeldTransaction = {
              id: Math.random().toString(36).slice(2),
              items: [...s.cart],
              customerName,
              customerPhone,
              discountCode: s.discountCode,
              discountAmount: s.discountAmount,
              heldAt: new Date(),
              notes,
            };
            s.heldTransactions.unshift(held);
            // Keep max 10 held transactions
            if (s.heldTransactions.length > 10) s.heldTransactions.pop();
            // Clear cart after holding
            s.cart = [];
            s.discountCode = "";
            s.discountAmount = 0;
          }),
          resumeTransaction: (id) => set(s => {
            const held = s.heldTransactions.find(h => h.id === id);
            if (!held) return;
            s.cart = [...held.items];
            s.discountCode = held.discountCode;
            s.discountAmount = held.discountAmount;
            s.heldTransactions = s.heldTransactions.filter(h => h.id !== id);
          }),
          deleteHeldTransaction: (id) => set(s => {
            s.heldTransactions = s.heldTransactions.filter(h => h.id !== id);
          }),
          heldCount: () => get().heldTransactions.length,

          // ── UI ──────────────────────────────────────────────
          sidebarOpen: true,
          toggleSidebar:  () => set(s => { s.sidebarOpen = !s.sidebarOpen; }),
          setSidebarOpen: (v) => set(s => { s.sidebarOpen = v; }),
          notifications: [],
          addNotif: (n) => set(s => {
            s.notifications.unshift({ ...n, id: Math.random().toString(36).slice(2), isRead: false, createdAt: new Date() });
            if (s.notifications.length > 50) s.notifications.pop();
          }),
          removeNotif: (id) => set(s => { s.notifications = s.notifications.filter(n => n.id !== id); }),
          markAllRead: ()  => set(s => { s.notifications.forEach(n => { n.isRead = true; }); }),
          unreadCount: ()  => get().notifications.filter(n => !n.isRead).length,

          // ── Dashboard ────────────────────────────────────────
          warehouseFilter: null,
          dateRange: { from: new Date(new Date().setDate(1)), to: new Date() },
          setWarehouseFilter: (id) => set(s => { s.warehouseFilter = id; }),
          setDateRange:       (r)  => set(s => { s.dateRange = r; }),
        }))
      ),
      {
        name: "distributor-store",
        partialize: (s) => ({ 
          cart: s.cart, 
          discountCode: s.discountCode, 
          discountAmount: s.discountAmount, 
          sidebarOpen: s.sidebarOpen, 
          warehouseFilter: s.warehouseFilter,
          heldTransactions: s.heldTransactions,
        }),
      }
    )
  )
);

// Selector helpers
export const sel = {
  user:       (s: Store) => s.user,
  cart:       (s: Store) => s.cart,
  cartCount:  (s: Store) => s.cartCount(),
  cartTotal:  (s: Store) => s.cartTotal(),
  unread:     (s: Store) => s.unreadCount(),
  sidebar:    (s: Store) => s.sidebarOpen,
};
