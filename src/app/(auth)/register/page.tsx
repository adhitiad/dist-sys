// src/app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name:"", email:"", password:"", phone:"" });
  const [showPass, setShow] = useState(false);
  const [loading, setLoad]  = useState(false);

  const f = (field: string) => ({
    value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value })),
    className: "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8)  { toast.error("Password minimal 8 karakter."); return; }
    if (!/[A-Z]/.test(form.password)) { toast.error("Password harus ada huruf kapital."); return; }
    if (!/[0-9]/.test(form.password)) { toast.error("Password harus ada angka."); return; }

    setLoad(true);
    const { error } = await authClient.signUp.email({
      name: form.name, email: form.email, password: form.password,
    });
    if (error) { toast.error(error.message ?? "Registrasi gagal."); setLoad(false); }
    else { toast.success("Akun berhasil dibuat! Silakan masuk."); router.replace("/login"); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Truck className="h-7 w-7 text-white"/>
          </div>
          <h1 className="text-2xl font-bold">Buat Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daftar sebagai pelanggan</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap *</label>
              <input {...f("name")} placeholder="Budi Santoso" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email *</label>
              <input {...f("email")} type="email" placeholder="budi@email.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nomor HP</label>
              <input {...f("phone")} type="tel" placeholder="08123456789" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password *</label>
              <div className="relative">
                <input {...f("password")} type={showPass ? "text" : "password"} placeholder="Min 8 karakter, huruf kapital & angka" required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-2.5 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Min 8 karakter, 1 huruf kapital, 1 angka</p>
            </div>

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
              Daftar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
