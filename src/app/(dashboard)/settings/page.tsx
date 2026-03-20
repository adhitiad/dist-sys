// src/app/(dashboard)/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Building2, FileText, Package, Bell } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import client from "@/lib/axios";
import { toast } from "sonner";

type Setting = { key: string; value: unknown; group: string };

const GROUPS = [
  { id: "company", label: "Perusahaan",  icon: Building2 },
  { id: "invoice", label: "Invoice",     icon: FileText  },
  { id: "tax",     label: "Pajak",       icon: Package   },
  { id: "order",   label: "Pesanan",     icon: Settings  },
  { id: "stock",   label: "Stok",        icon: Bell      },
];

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState("company");
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});

  const { data: settings, refetch } = useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: () => client.get("/api/settings").then(r => r.data.data),
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string | number | boolean> = {};
      settings.forEach(s => { map[s.key] = s.value as string | number | boolean; });
      setValues(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => client.post("/api/settings", data),
    onSuccess: () => { toast.success("Pengaturan disimpan."); refetch(); },
  });

  function handleChange(key: string, val: string | number | boolean) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    const group  = activeGroup;
    const subset = Object.fromEntries(Object.entries(values).filter(([k]) => k.startsWith(group)));
    saveMutation.mutate(subset);
  }

  const groupSettings = (settings ?? []).filter(s => s.group === activeGroup);

  function renderInput(s: Setting) {
    const val = values[s.key] ?? s.value;
    if (typeof s.value === "boolean") {
      return (
        <label key={s.key} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
          <span className="text-sm font-medium">{labelFor(s.key)}</span>
          <button type="button" onClick={() => handleChange(s.key, !val)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${val ? "bg-primary" : "bg-muted"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${val ? "translate-x-6" : "translate-x-1"}`}/>
          </button>
        </label>
      );
    }
    if (typeof s.value === "number") {
      return (
        <div key={s.key} className="rounded-xl border border-border bg-background p-4">
          <label className="mb-1.5 block text-sm font-medium">{labelFor(s.key)}</label>
          <input type="number" value={Number(val)} onChange={e => handleChange(s.key, +e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
      );
    }
    return (
      <div key={s.key} className="rounded-xl border border-border bg-background p-4">
        <label className="mb-1.5 block text-sm font-medium">{labelFor(s.key)}</label>
        <input type="text" value={String(val)} onChange={e => handleChange(s.key, e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary"/>Pengaturan Sistem</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi sistem distribusi</p>
      </div>

      <div className="flex gap-4">
        {/* Sidebar group nav */}
        <div className="w-48 shrink-0 space-y-1">
          {GROUPS.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeGroup === g.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <g.icon className="h-4 w-4"/> {g.label}
            </button>
          ))}
        </div>

        {/* Settings panel */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupSettings.map(s => renderInput(s))}
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelFor(key: string) {
  const map: Record<string, string> = {
    "company.name":       "Nama Perusahaan",
    "company.phone":      "Telepon",
    "company.email":      "Email",
    "company.address":    "Alamat",
    "company.npwp":       "NPWP",
    "tax.percent":        "PPN (%)",
    "order.auto_confirm": "Auto Konfirmasi Pesanan",
    "stock.low_alert":    "Notifikasi Stok Menipis",
    "invoice.prefix":     "Prefix Invoice",
    "invoice.footer":     "Footer Invoice",
  };
  return map[key] ?? key.split(".").pop()?.replace(/_/g," ") ?? key;
}
