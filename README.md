# 🚛 Distributor System

Sistem manajemen distribusi multi-gudang lengkap — Next.js 15, MongoDB, TypeScript, Cloudinary.

---

## ✅ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | MongoDB + Prisma 6 |
| Auth | Better Auth (Email + Google OAuth) |
| Storage | **Cloudinary** (gambar produk, avatar, dokumen) |
| Validasi | Zod |
| State | Zustand + Immer |
| Data Fetching | TanStack React Query v5 |
| HTTP | Axios |
| UI | Tailwind CSS v4 + shadcn/ui |
| Form | React Hook Form + Zod Resolver |
| Chart | Recharts |
| Log | Winston + Daily Rotate File |
| Date | date-fns |

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/          # Better Auth handler
│   │   ├── upload/                 # POST/DELETE/GET Cloudinary
│   │   ├── warehouses/             # CRUD gudang + stok
│   │   ├── products/               # CRUD produk, kategori, varian
│   │   ├── orders/                 # Pesanan + status + payment
│   │   ├── suppliers/              # Supplier
│   │   ├── purchase-orders/        # Purchase Order
│   │   ├── stock-transfers/        # Transfer stok antar gudang
│   │   ├── reports/                # Dashboard + low-stock
│   │   ├── users/                  # Manajemen pengguna
│   │   └── settings/               # Pengaturan sistem
│   ├── (auth)/
│   │   ├── login/                  # Halaman login
│   │   └── register/               # Halaman daftar pelanggan
│   └── (dashboard)/
│       ├── dashboard/              # Dashboard utama + charts
│       ├── warehouses/             # Manajemen gudang
│       ├── products/               # Manajemen produk
│       ├── orders/                 # Manajemen pesanan + POS kasir
│       ├── stock-transfers/        # Transfer stok antar gudang
│       ├── suppliers/              # Manajemen supplier
│       ├── purchase-orders/        # Purchase order
│       ├── reports/                # Laporan & analitik
│       ├── users/                  # Manajemen pengguna
│       └── settings/               # Pengaturan sistem
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx             # Navigasi sidebar
│   │   └── topbar.tsx              # Header + notifikasi
│   ├── shared/
│   │   ├── data-table.tsx          # Tabel generik sort/filter/paginate
│   │   ├── image-uploader.tsx      # Upload gambar ke Cloudinary
│   │   ├── stat-card.tsx           # Widget statistik dashboard
│   │   └── status-badge.tsx        # Badge status order/payment/transfer
│   ├── product/
│   │   └── product-form-modal.tsx  # Form tambah/edit produk
│   ├── warehouse/
│   │   └── transfer-form-modal.tsx # Form transfer stok
│   └── order/
│       └── po-form-modal.tsx       # Form purchase order
├── lib/
│   ├── auth.ts                     # Better Auth config + permissions
│   ├── auth-client.ts              # Better Auth React client
│   ├── cloudinary.ts               # Cloudinary service (upload/delete/transform)
│   ├── db.ts                       # Prisma client + code generators
│   ├── logger.ts                   # Winston logger
│   ├── axios.ts                    # Axios + interceptors
│   ├── api-helpers.ts              # withAuth HOC + response helpers
│   ├── utils.ts                    # cn, rupiah, formatDate, dll
│   └── validators/index.ts         # Zod schemas semua entitas
├── services/
│   ├── stock.service.ts            # Logika stok & transfer
│   └── order.service.ts            # Logika pesanan & payment
├── hooks/
│   ├── use-queries.ts              # TanStack Query hooks
│   └── use-upload.ts               # Upload single & multi Cloudinary
├── store/
│   └── index.ts                    # Zustand global store
└── middleware.ts                   # Auth guard + security headers
```

---

## 🚀 Setup & Instalasi

### 1. Clone & Install

```bash
git clone <repo-url> distributor-system
cd distributor-system
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Isi file `.env`:

```env
# Database
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/distributor"

# Better Auth
BETTER_AUTH_SECRET=random-string-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Cloudinary (cloudinary.com → Dashboard → API Keys)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your-secret
CLOUDINARY_FOLDER=distributor

# Browser upload (buat Upload Preset unsigned di Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=distributor-unsigned
```

### 3. Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke MongoDB
npm run db:push

# Seed data awal (akun + gudang + produk sample)
npm run db:seed
```

### 4. Jalankan

```bash
npm run dev
# Buka http://localhost:3000
```

---

## 👤 Akun Default (password: `Admin@12345`)

| Role | Email |
|---|---|
| OWNER | owner@dist.com |
| ADMIN | admin@dist.com |
| KASIR | kasir@dist.com |
| MANAJER_PENJUALAN | sales@dist.com |
| MANAJER_PEMBELIAN | purchase@dist.com |
| AKUNTAN | akuntan@dist.com |
| PENGELOLA_GUDANG | gudang@dist.com |
| PICKER | picker@dist.com |
| PACKER | packer@dist.com |
| DRIVER | driver@dist.com |
| SUPPLIER | supplier@dist.com |
| PELANGGAN | customer@dist.com |

---

## 🏭 Kategori Produk

| Kategori | Keterangan |
|---|---|
| PAKAIAN | Kaos, Kemeja, Polo, Celana, Jaket, Hoodie, Dress, dll. |
| AMDK | Air Mineral Dalam Kemasan |
| HEALTHY_WATER | Infused water, alkaline water |
| SWEET_WATER | Teh, jus, sirup, minuman rasa |
| WAFER | Semua jenis wafer |
| ROTI | Roti, bakery, biscuit |
| COKLAT | Coklat & candy |
| SNACK_GURIH | Keripik, chiki, popcorn |
| PERMEN_JELLY | Candy, jelly, marshmallow |
| MINUMAN_ENERGI | Kratingdaeng, Extra Joss, dll. |
| SUSU_DAIRY | Susu UHT, yogurt |
| KOPI_TEH | Sachet, RTD coffee/tea |
| PERAWATAN_DIRI | Sabun, sampo, pasta gigi |
| PERAWATAN_BAYI | Produk khusus bayi |
| PERALATAN_RUMAH | Ember, piring, perkakas |
| KEBUTUHAN_DAPUR | Bumbu, minyak, garam |
| LAINNYA | Produk lain |

---

## 🔄 Alur Transfer Stok

```
DRAFT → REQUESTED → APPROVED → IN_TRANSIT → RECEIVED
                  ↘ REJECTED             ↘ PARTIAL_RECEIVED
```

Setiap perpindahan dicatat di `StockMovement` untuk audit trail lengkap.

## 📦 Alur Pesanan

```
PENDING → CONFIRMED → PROCESSING → PICKING → PACKING → READY → SHIPPED → DELIVERED → COMPLETED
                                                                                     ↘ RETURNED
PENDING/CONFIRMED → CANCELLED
```

---

## ☁️ Cloudinary Storage

### Folder Struktur di Cloudinary

```
distributor/
├── products/           # Gambar produk (auto-convert WebP)
│   └── variants/       # Gambar varian produk
├── categories/         # Ikon kategori
├── suppliers/          # Logo/dokumen supplier
├── users/              # Avatar pengguna
├── warehouses/         # Foto gudang
└── documents/          # Dokumen PO, invoice
```

### Fitur Cloudinary yang Diimplementasi

- ✅ Upload dari `Buffer` (server-side, aman)
- ✅ Auto-konversi ke **WebP** + quality `auto:good`
- ✅ On-the-fly transformasi URL (thumbnail, card, detail, avatar, banner)
- ✅ Signed upload params untuk upload browser langsung
- ✅ Bulk delete
- ✅ Validasi tipe file & ukuran (maks 5 MB) di API
- ✅ Drag & drop + progress bar di komponen UI
- ✅ Multi-image upload untuk galeri produk

---

## 📊 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema ke MongoDB
npm run db:studio    # Buka Prisma Studio
npm run db:seed      # Seed data awal
```
