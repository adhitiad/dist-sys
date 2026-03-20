// src/components/order/po-form-modal.tsx
"use client";
import { useState } from "react";
import { Plus, X, Loader2, FileText } from "lucide-react";
import { useSuppliers, useWarehouses, useProducts } from "@/hooks/use-queries";
import client from "@/lib/axios";
import { toast } from "sonner";
import { rupiah } from "@/lib/utils";

type POItem = { productId: string; variantId?: string; quantity: number; unitPrice: number; discount: number; productName: string; sku: string };
type Props  = { onClose(): void; onSuccess(): void };

export function POFormModal({ onClose, onSuccess }: Props) {
  const [suppId, setSuppId]     = useState("");
  const [whId, setWhId]         = useState("");
  const [taxPct, setTaxPct]     = useState(11);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes]       = useState("");
  const [expectedDate, setExp]  = useState("");
  const [items, setItems]       = useState<POItem[]>([]);
  const [addProd, setAddProd]   = useState("");
  const [addPrice, setAddPrice] = useState(0);
  const [addQty, setAddQty]     = useState(1);
  const [loading, setLoading]   = useState(false);

  const { data: supps } = useSuppliers({ limit: 200 });
  const { data: whs   } = useWarehouses({ limit: 100 });
  const { data: prods } = useProducts({ limit: 300, isActive: true });

  const suppliers: Array<{ id: string; name: string; company?: string; code: string }> = supps?.data ?? [];
  const warehouses: Array<{ id: string; name: string; code: string }> = whs?.data ?? [];
  const products: Array<{ id: string; name: string; sku: string; basePrice: number }> = prods?.data ?? [];

  const subtotal = items.reduce((s, i) => s + (i.unitPrice - i.discount) * i.quantity, 0);
  const tax      = (subtotal - discount) * (taxPct / 100);
  const total    = subtotal - discount + tax + shipping;

  function handleSelectProd(id: string) {
    setAddProd(id);
    const prod = products.find(p => p.id === id);
    if (prod) setAddPrice(prod.basePrice);
  }

  function addItem() {
    if (!addProd || addPrice <= 0 || addQty < 1) { toast.warning("Lengkapi data produk."); return; }
    if (items.find(i => i.productId === addProd)) { toast.warning("Produk sudah ditambahkan."); return; }
    const prod = products.find(p => p.id === addProd)!;
    setItems(prev => [...prev, { productId: addProd, quantity: addQty, unitPrice: addPrice, discount: 0, productName: prod.name, sku: prod.sku }]);
    setAddProd(""); setAddPrice(0); setAddQty(1);
  }

  function updateItem(productId: string, field: "quantity"|"unitPrice"|"discount", val: number) {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: val } : i));
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!suppId || !whId)    { toast.error("Pilih supplier dan gudang."); return; }
    if (!items.length)       { toast.error("Tambahkan minimal 1 item."); return; }
    setLoading(true);
    try {
      await client.post("/api/purchase-orders", {
        supplierId: suppId, warehouseId: whId, taxPercent: taxPct,
        discount, shippingCost: shipping, notes: notes || undefined,
        expectedDate: expectedDate || undefined,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      });
      toast.success("Purchase Order berhasil dibuat."); onSuccess();
    } finally { setLoading(false); }
  }

  const selCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const numCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-primary"/>Buat Purchase Order</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5"/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="po-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Supplier *</label>
                <select value={suppId} onChange={e => setSuppId(e.target.value)} className={selCls} required>
                  <option value="">Pilih supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}{s.company ? ` — ${s.company}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Gudang Tujuan *</label>
                <select value={whId} onChange={e => setWhId(e.target.value)} className={selCls} required>
                  <option value="">Pilih gudang…</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tgl. Estimasi Tiba</label>
                <input type="date" value={expectedDate} onChange={e => setExp(e.target.value)} className={selCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">PPN (%)</label>
                <input type="number" value={taxPct} onChange={e => setTaxPct(+e.target.value)} min={0} max={100} className={numCls} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Catatan</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Catatan untuk supplier…" />
            </div>

            {/* Add product */}
            <div>
              <label className="mb-1 block text-xs font-medium">Tambah Produk</label>
              <div className="flex gap-2 flex-wrap">
                <select value={addProd} onChange={e => handleSelectProd(e.target.value)} className={`flex-1 min-w-0 ${selCls}`}>
                  <option value="">Pilih produk…</option>
                  {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                </select>
                <input type="number" value={addPrice || ""} onChange={e => setAddPrice(+e.target.value)} min={0} placeholder="Harga"
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <input type="number" value={addQty} onChange={e => setAddQty(Math.max(1,+e.target.value))} min={1} placeholder="Qty"
                  className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Produk</th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-20">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground w-28">Harga</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground w-24">Diskon</th>
                      <th className="px-3 py-2 text-right font-semibold text-muted-foreground w-28">Subtotal</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(item => {
                      const sub = (item.unitPrice - item.discount) * item.quantity;
                      return (
                        <tr key={item.productId}>
                          <td className="px-3 py-2">
                            <p className="font-medium truncate max-w-[160px]">{item.productName}</p>
                            <p className="text-muted-foreground font-mono">{item.sku}</p>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.quantity} min={1} onChange={e => updateItem(item.productId,"quantity",Math.max(1,+e.target.value))}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-center outline-none focus:ring-1 focus:ring-ring" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.unitPrice} min={0} onChange={e => updateItem(item.productId,"unitPrice",+e.target.value)}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-right outline-none focus:ring-1 focus:ring-ring" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.discount} min={0} onChange={e => updateItem(item.productId,"discount",+e.target.value)}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-right outline-none focus:ring-1 focus:ring-ring" />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{rupiah(sub)}</td>
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => removeItem(item.productId)} className="rounded p-0.5 hover:text-red-600">
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            {items.length > 0 && (
              <div className="rounded-xl bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{rupiah(subtotal)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Diskon</span>
                  <input type="number" value={discount} onChange={e => setDiscount(+e.target.value)} min={0}
                    className="w-28 rounded border border-border bg-background px-2 py-1 text-right text-xs outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">PPN ({taxPct}%)</span><span>{rupiah(tax)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ongkos Kirim</span>
                  <input type="number" value={shipping} onChange={e => setShipping(+e.target.value)} min={0}
                    className="w-28 rounded border border-border bg-background px-2 py-1 text-right text-xs outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                  <span>Total</span><span className="text-primary">{rupiah(total)}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border p-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted">Batal</button>
          <button type="submit" form="po-form" disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
            Buat PO
          </button>
        </div>
      </div>
    </div>
  );
}
