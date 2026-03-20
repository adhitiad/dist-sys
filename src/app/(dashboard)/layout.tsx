// src/app/(dashboard)/layout.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useStore } from "@/store";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const { data: session, isPending } = useSession();
  const { setUser, setLoading } = useStore();

  useEffect(() => {
    if (!isPending) {
      setLoading(false);
      if (!session?.user) {
        router.replace("/login");
      } else {
        setUser({
          id:    session.user.id,
          name:  session.user.name,
          email: session.user.email,
          image: session.user.image ?? undefined,
          role:  (session.user as any).role as never,
          phone: (session.user as any).phone as string | undefined,
        });
      }
    }
  }, [session, isPending, router, setUser, setLoading]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
