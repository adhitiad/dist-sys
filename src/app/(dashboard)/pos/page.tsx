// src/app/(dashboard)/pos/page.tsx
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calculator,
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  User,
  Phone,
  X,
  Loader2,
  Store,
  LogOut,
  Clock,
  Pause,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { rupiah, formatDateTime } from "@/lib/utils";
import {
  usePOSSession,
  usePOSProducts,
  useOpenPOSSession,
  useWarehouses,
  useCategories,
} from "@/hooks/use-queries";
import { useStore, type CartItem, type HeldTransaction } from "@/store";
import { CheckoutModal } from "@/components/pos/checkout-modal";
import { HeldTransactionsModal } from "@/components/pos/held-transactions-modal";
import { SessionSummaryModal } from "@/components/pos/session-summary-modal";
import { SessionTransactions } from "@/components/pos/session-transactions";
import { PaymentMethod } from "@/generated/prisma/enums";

type POSProduct = {
  stockId: string;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  category: { name: string; icon?: string };
  images: Array<{ url: string; publicId: string; width?: number; height?: number; bytes?: number; format?: string }>;
  sellingPrice: number;
  available: number;
  variant?: { id: string; size?: string; color?: string; priceAdj: number; sku?: string };
  variants?: Array<{ id: string; sku: string; size?: string; color?: string; priceAdj: number }>;
};

type SessionOrder = {
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

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showHeldTransactions, setShowHeldTransactions] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const { data: session, isLoading: sessionLoading } = usePOSSession();
  const { data: warehouses } = useWarehouses();
  const { data: categories } = useCategories();
  const { data: products, isLoading: productsLoading } = usePOSProducts(
    session?.warehouseId ?? selectedWarehouseId,
    { search: search || undefined, categoryId: categoryId || undefined }
  );

  const openSession = useOpenPOSSession();

  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartSubtotal,
    cartCount,
    holdTransaction,
    resumeTransaction,
    heldCount,
  } = useStore();

  // Set default warehouse from session
  useEffect(() => {
    if (session?.warehouseId) {
      setSelectedWarehouseId(session.warehouseId);
    }
  }, [session]);

  const handleOpenSession = async () => {
    if (!selectedWarehouseId) {
      toast.error("Pilih gudang terlebih dahulu.");
      return;
    }
    try {
      await openSession.mutateAsync({
        warehouseId: selectedWarehouseId,
        openingBalance,
      });
      toast.success("Sesi POS berhasil dibuka.");
      setOpeningBalance(0);
    } catch {}
  };

  const handleAddToCart = (product: POSProduct, variantId?: string) => {
    const selectedVariant = variantId
      ? product.variants?.find((v) => v.id === variantId)
      : product.variant;

    const price = product.sellingPrice + (selectedVariant?.priceAdj ?? 0);
    const available = product.available;

    // Check if already in cart
    const existingItem = cart.find(
      (item) =>
        item.productId === product.productId &&
        item.variantId === (selectedVariant?.id ?? null)
    );

    if (existingItem && existingItem.quantity >= available) {
      toast.error("Stok tidak mencukupi.");
      return;
    }

    const img = product.images?.[0];
    addToCart({
      productId: product.productId,
      variantId: selectedVariant?.id,
      name: product.name,
      sku: selectedVariant?.sku ?? product.sku,
      image: img ? { publicId: img.publicId, url: img.url, width: img.width ?? 0, height: img.height ?? 0, bytes: img.bytes ?? 0, format: img.format ?? 'webp' } : undefined,
      size: selectedVariant?.size,
      color: selectedVariant?.color,
      quantity: 1,
      unitPrice: price,
      discount: 0,
    });
  };

  const handleUpdateQty = (productId: string, variantId: string | undefined, delta: number) => {
    const item = cart.find(
      (i) => i.productId === productId && i.variantId === variantId
    );
    if (!item) return;
    updateCartQty(productId, variantId, item.quantity + delta);
  };

  const handleHoldTransaction = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong.");
      return;
    }
    holdTransaction(customerName || "Walk-in Customer", customerPhone);
    setCustomerName("");
    setCustomerPhone("");
    toast.success("Transaksi ditahan.");
  };

  const handleResumeTransaction = (held: HeldTransaction) => {
    // Check if cart is not empty
    if (cart.length > 0) {
      if (!confirm("Keranjang saat ini akan dikosongkan. Lanjutkan?")) {
        return;
      }
    }
    resumeTransaction(held.id);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    toast.success("Transaksi dilanjutkan.");
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Yakin ingin mengosongkan keranjang?")) {
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  const cartTotal = cartSubtotal();
  const heldTxCount = heldCount();

  // Show open session dialog if no active session
  if (!sessionLoading && !session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Buka Sesi POS</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Anda belum memiliki sesi POS yang aktif. Pilih gudang dan buka sesi untuk mulai bertransaksi.
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-left text-xs font-medium">Pilih Gudang *</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Pilih gudang…</option>
                {warehouses?.data?.map((wh: { id: string; name: string; code: string }) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-left text-xs font-medium">Saldo Awal Kas</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="0"
              />
            </div>
            <button
              onClick={handleOpenSession}
              disabled={!selectedWarehouseId || openSession.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {openSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              Buka Sesi POS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">POS / Kasir</h1>
            {session && (
              <p className="text-xs text-muted-foreground">
                {session.sessionCode} • {session.warehouse?.name} • Dibuka: {formatDateTime(session.openedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Held transactions button */}
          <button
            onClick={() => setShowHeldTransactions(true)}
            className="relative flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Pause className="h-4 w-4" />
            Tertahan
            {heldTxCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {heldTxCount}
              </span>
            )}
          </button>
          {/* Session transactions toggle */}
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              showTransactions
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Transaksi ({session?.orders?.length ?? 0})
            {showTransactions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {/* Close session button */}
          {session && (
            <button
              onClick={() => setShowCloseSession(true)}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Tutup Sesi
            </button>
          )}
        </div>
      </div>

      {/* Session Transactions Panel */}
      {showTransactions && session?.orders && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Transaksi dalam Sesi</span>
          </div>
          <SessionTransactions orders={session.orders} sessionCode={session.sessionCode} />
        </div>
      )}

      {/* Main Content */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Products Grid */}
        <div className="flex flex-col rounded-xl border border-border bg-card lg:col-span-2">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk atau scan barcode…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua Kategori</option>
              {categories?.map((c: { id: string; name: string; icon?: string }) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Products */}
          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : products?.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                <Package className="mb-2 h-10 w-10 opacity-50" />
                <p className="text-sm">Tidak ada produk ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {products?.map((product: POSProduct) => (
                  <button
                    key={`${product.productId}-${product.variantId ?? "base"}`}
                    onClick={() => handleAddToCart(product)}
                    className="group rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary hover:shadow-md"
                  >
                    <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-muted">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground/50 m-auto mt-[35%]" />
                      )}
                      {product.available <= 5 && (
                        <span className="absolute right-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Sisa {product.available}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
                    {product.variant && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {product.variant.size} {product.variant.color && `• ${product.variant.color}`}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold text-primary">
                      {rupiah(product.sellingPrice)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="flex flex-col rounded-xl border border-border bg-card">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="font-semibold">Keranjang</span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                {cartCount()}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-red-500 hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Customer Info */}
          <div className="border-b border-border p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-xs"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="No. HP"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="mb-2 h-10 w-10 opacity-50" />
                <p className="text-sm">Keranjang kosong</p>
                <p className="text-xs">Klik produk untuk menambahkan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    className="flex items-center gap-2 rounded-lg border border-border p-2"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                      {item.image?.url ? (
                        <Image src={item.image.url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/50 m-auto mt-3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.size && `${item.size}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                      <p className="text-xs font-semibold text-primary">{rupiah(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.variantId, -1)}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.variantId, 1)}
                        className="rounded p-1 hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{rupiah(cartTotal)}</span>
            </div>
            
            {/* Action buttons */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={handleHoldTransaction}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                <Pause className="h-3.5 w-3.5" />
                Tahan
              </button>
              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Bayar
              </button>
            </div>

            {/* Quick amount buttons */}
            {cart.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="w-full text-[10px] text-muted-foreground mb-1">Cepat:</span>
                {[50000, 100000, 150000, 200000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      if (cartTotal <= amt) {
                        // Direct checkout with this amount
                        setShowCheckout(true);
                      }
                    }}
                    className="rounded border border-border px-2 py-1 text-[10px] hover:bg-muted"
                  >
                    {rupiah(amt)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && session && (
        <CheckoutModal
          session={session}
          cart={cart}
          customerName={customerName || "Walk-in Customer"}
          customerPhone={customerPhone}
          cartTotal={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            clearCart();
            setCustomerName("");
            setCustomerPhone("");
            setShowCheckout(false);
          }}
        />
      )}

      {/* Held Transactions Modal */}
      <HeldTransactionsModal
        isOpen={showHeldTransactions}
        onClose={() => setShowHeldTransactions(false)}
        onResume={handleResumeTransaction}
      />

      {/* Close Session Modal */}
      {showCloseSession && session && (
        <SessionSummaryModal
          isOpen={showCloseSession}
          onClose={() => setShowCloseSession(false)}
          session={session}
          onSuccess={() => {
            setShowCloseSession(false);
            clearCart();
          }}
        />
      )}
    </div>
  );
}
