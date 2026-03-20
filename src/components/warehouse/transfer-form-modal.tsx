// src/components/warehouse/transfer-form-modal.tsx
"use client";
import { useState } from "react";
import { Plus, X, Loader2, ArrowLeftRight } from "lucide-react";
import { useWarehouses, useProducts, useCreateTransfer } from "@/hooks/use-queries";
import { toast } from "sonner";

type Item = { productId: string; variantId?: string; requestedQty: number; productName: string };
type Props = { onClose(): void; onSuccess(): void };

export function TransferFormModal({ onClose, onSuccess }: Props) {
  const [fromId, setFromId]     = useState("");
  const [toId, setToId]         = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes]       = useState("");
  const [items, setItems]       = useState<Item[]>([]);
  const [addProd, setAddProd]   = useState("");
  const [addQty, setAddQty]     = useState(1);

  const { data: whs }      = useWarehouses({ limit: 100 });
  const { data: prods }    = useProducts({ limit: 200, isActive: true });
  const createTransfer     = useCreateTransfer();

  const warehouses: Array<{ id: string; name: string; code: string }> = whs?.data ?? [];
  const products:   Array<{ id: string; name: string; sku: string; variants: Array<{ id: string; size?: string; color?: string }> }> = prods?.data ?? [];

  function addItem() {
    if (!addProd) return;
    const prod = products.find(p => p.id === addProd);
    if (!prod) return;
    if (items.find(i => i.productId === addProd)) { toast.warning("Produk sudah ada dalam list."); return; }
    setItems(prev => [...prev, { productId: addProd, requestedQty: addQty, productName: prod.name }]);
    setAddProd(""); setAddQty(1);
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }

  function updateQty(productId: string, qty: number) {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, requestedQty: qty } : i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId) { toast.error("Pilih gudang asal dan tujuan."); return; }
    if (fromId === toId)  { toast.error("Gudang asal dan tujuan tidak boleh sama."); return; }
    if (!items.length)    { toast.error("Tambahkan minimal 1 item."); return; }

    try {
      await createTransfer.mutateAsync({
        fromWarehouseId: fromId, toWarehouseId: toId, priority: priority as never,
        notes: notes || undefined,
        items: items.map(i => ({ productId: i.productId, requestedQty: i.requestedQty })),
      });
      toast.success("Transfer berhasil diajukan.");
      onSuccess();
    } catch { /* interceptor */ }
  }

  const selCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ArrowLeftRight className="h-5 w-5 text-primary"/> Buat Transfer Stok
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5"/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="transfer-form" onSubmit={submit} className="space-y-4">
            {/* Gudang */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Gudang Asal *</label>
                <select value={fromId} onChange={e => setFromId(e.target.value)} className={selCls} required>
                  <option value="">Pilih gudang…</option>
                  {warehouses.filter(w => w.id !== toId).map(w => (
                    <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Gudang Tujuan *</label>
                <select value={toId} onChange={e => setToId(e.target.value)} className={selCls} required>
                  <option value="">Pilih gudang…</option>
                  {warehouses.filter(w => w.id !== fromId).map(w => (
                    <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prioritas */}
            <div>
              <label className="mb-1 block text-xs font-medium">Prioritas</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={selCls}>
                {["LOW","NORMAL","HIGH","URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Catatan */}
            <div>
              <label className="mb-1 block text-xs font-medium">Catatan</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Catatan transfer…" />
            </div>

            {/* Tambah item */}
            <div>
              <label className="mb-1 block text-xs font-medium">Tambah Produk</label>
              <div className="flex gap-2">
                <select value={addProd} onChange={e => setAddProd(e.target.value)} className={`flex-1 ${selCls}`}>
                  <option value="">Pilih produk…</option>
                  {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                </select>
                <input type="number" value={addQty} onChange={e => setAddQty(Math.max(1, +e.target.value))} min={1}
                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {/* List items */}
            {items.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Produk</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-24">Qty</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(item => (
                      <tr key={item.productId}>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium truncate max-w-[200px]">{item.productName}</p>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={item.requestedQty} min={1}
                            onChange={e => updateQty(item.productId, Math.max(1, +e.target.value))}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-center text-xs outline-none focus:ring-1 focus:ring-ring" />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeItem(item.productId)} className="rounded p-0.5 hover:bg-red-50 hover:text-red-600">
                            <X className="h-3.5 w-3.5"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                  {items.length} produk · Total {items.reduce((s, i) => s + i.requestedQty, 0)} pcs
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border p-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted">Batal</button>
          <button type="submit" form="transfer-form" disabled={createTransfer.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {createTransfer.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
            Ajukan Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
