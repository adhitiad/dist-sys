// src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      toast.error(error.message ?? "Email atau password salah.");
      setLoading(false);
    } else {
      toast.success("Berhasil masuk.");
      router.replace(callbackUrl);
    }
  }

  async function handleGoogle() {
    setGLoading(true);
    await authClient.signIn.social({ provider: "google", callbackURL: callbackUrl });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Truck className="h-7 w-7 text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground">DistributoR</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistem Manajemen Distribusi</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold">Masuk ke Akun</h2>

          {/* Google */}
          <button onClick={handleGoogle} disabled={gLoading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition">
            {gLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Masuk dengan Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border"/><span className="text-xs text-muted-foreground">atau</span><div className="h-px flex-1 bg-border"/>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@dist.com"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-2.5 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
              Masuk
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">Daftar sebagai pelanggan</Link>
          </p>
        </div>

        {/* Dev hint */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Akun Demo (password: Admin@12345)</p>
            <div className="grid grid-cols-2 gap-x-4">
              {[["owner@dist.com","Owner"],["admin@dist.com","Admin"],["kasir@dist.com","Kasir"],["gudang@dist.com","Pengelola Gudang"]].map(([e, r]) => (
                <button key={e} onClick={() => { setEmail(e); setPassword("Admin@12345"); }}
                  className="text-left hover:text-blue-900 truncate">{r}: {e}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
