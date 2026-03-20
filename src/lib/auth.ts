// src/lib/auth.ts
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true di produksi
    sendResetPassword: async ({ user, url }) => {
      console.log(`[DEV] Reset password ${user.email}: ${url}`);
      // TODO: kirim via Resend
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: UserRole.PELANGGAN, input: false },
      phone: { type: "string", required: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // refresh harian
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  rateLimit: { window: 60, max: 100 },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],

  callbacks: {
    signIn: {
      before: async ({
        user,
      }: {
        user: {
          id: string;
          email: string;
          name?: string | null;
          image?: string | null;
        };
      }) => {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser && !dbUser.isActive) {
          throw new Error(
            "Akun Anda telah dinonaktifkan. Hubungi administrator.",
          );
        }
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;

// ── Role → Permission map ─────────────────────────────────────────
const P = (perms: string[]) => perms;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: P(["*"]),
  [UserRole.ADMIN]: P([
    "user:*",
    "warehouse:*",
    "product:*",
    "order:*",
    "supplier:*",
    "purchase_order:*",
    "stock:*",
    "report:*",
    "setting:read",
    "promotion:*",
  ]),
  [UserRole.MANAJER_PENJUALAN]: P([
    "order:*",
    "product:read",
    "customer:*",
    "report:sales",
    "promotion:*",
  ]),
  [UserRole.MANAJER_PEMBELIAN]: P([
    "supplier:*",
    "purchase_order:*",
    "product:read",
    "product:create",
    "product:update",
    "stock:read",
    "report:purchase",
  ]),
  [UserRole.AKUNTAN]: P([
    "transaction:*",
    "report:*",
    "order:read",
    "purchase_order:read",
  ]),
  [UserRole.KASIR]: P([
    "order:create",
    "order:read",
    "order:update",
    "product:read",
    "stock:read",
    "transaction:create",
    "transaction:read",
  ]),
  [UserRole.PENGELOLA_GUDANG]: P([
    "warehouse:read",
    "stock:*",
    "stock_transfer:*",
    "order:read",
    "purchase_order:read",
  ]),
  [UserRole.PICKER]: P(["order:read", "stock:read", "fulfillment:picking"]),
  [UserRole.PACKER]: P(["order:read", "stock:read", "fulfillment:packing"]),
  [UserRole.DRIVER]: P(["order:read", "fulfillment:dispatch"]),
  [UserRole.SUPPLIER]: P(["purchase_order:read", "product:read"]),
  [UserRole.PELANGGAN]: P([
    "order:create",
    "order:read",
    "product:read",
    "profile:update",
  ]),
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(":");
  return perms.includes(`${resource}:*`);
}

export const DASHBOARD_ROLES: UserRole[] = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.KASIR,
  UserRole.PENGELOLA_GUDANG,
  UserRole.PICKER,
  UserRole.PACKER,
  UserRole.DRIVER,
  UserRole.AKUNTAN,
  UserRole.MANAJER_PENJUALAN,
  UserRole.MANAJER_PEMBELIAN,
];
