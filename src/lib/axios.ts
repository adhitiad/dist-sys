// src/lib/axios.ts
import axios from "axios";
import { toast } from "sonner";

const client = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  timeout:         30_000,
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  (config as typeof config & { _t?: number })._t = Date.now();
  return config;
});

client.interceptors.response.use(
  (res) => {
    if (process.env.NODE_ENV === "development") {
      const ms = Date.now() - ((res.config as typeof res.config & { _t?: number })._t ?? 0);
      console.debug(`[API] ${res.config.method?.toUpperCase()} ${res.config.url} ${res.status} (${ms}ms)`);
    }
    return res;
  },
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error ?? "Terjadi kesalahan.";

    if (status === 401) { toast.error("Sesi berakhir. Silakan login ulang."); window.location.href = "/login"; }
    else if (status === 403) toast.error("Anda tidak memiliki izin.");
    else if (status === 422) toast.error(`Validasi gagal: ${message}`);
    else if (status >= 500) toast.error("Kesalahan server. Hubungi administrator.");

    return Promise.reject(error);
  }
);

export default client;
