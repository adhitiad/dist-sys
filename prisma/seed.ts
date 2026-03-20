import "dotenv/config";
import { prisma } from "@/lib/db";
// prisma/seed.ts
import {
  ClothingSize,
  ClothingType,
  ProductCategoryType,
  ProductUnit,
  UserRole,
} from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...\n");

  const PASSWORD = await bcrypt.hash("Admin@12345", 12);

  // ── 1. Users ─────────────────────────────────────────────────────
  const users = [
    { name: "Owner", email: "owner@dist.com", role: UserRole.OWNER },
    { name: "Admin", email: "admin@dist.com", role: UserRole.ADMIN },
    { name: "Kasir 1", email: "kasir@dist.com", role: UserRole.KASIR },
    {
      name: "Mgr Penjualan",
      email: "sales@dist.com",
      role: UserRole.MANAJER_PENJUALAN,
    },
    {
      name: "Mgr Pembelian",
      email: "purchase@dist.com",
      role: UserRole.MANAJER_PEMBELIAN,
    },
    { name: "Akuntan", email: "akuntan@dist.com", role: UserRole.AKUNTAN },
    {
      name: "Pengelola Gudang",
      email: "gudang@dist.com",
      role: UserRole.PENGELOLA_GUDANG,
    },
    { name: "Picker 1", email: "picker@dist.com", role: UserRole.PICKER },
    { name: "Packer 1", email: "packer@dist.com", role: UserRole.PACKER },
    { name: "Driver 1", email: "driver@dist.com", role: UserRole.DRIVER },
    {
      name: "Supplier Demo",
      email: "supplier@dist.com",
      role: UserRole.SUPPLIER,
    },
    {
      name: "Pelanggan Demo",
      email: "customer@dist.com",
      role: UserRole.PELANGGAN,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        emailVerified: true,
        accounts: {
          create: {
            accountId: u.email,
            providerId: "credential",
            password: PASSWORD,
          },
        },
      },
    });
    createdUsers[u.role] = user.id;
    console.log(`  ✅ ${u.role.padEnd(20)} ${u.email}`);
  }

  // ── 2. Product Categories ───────────────────────────────────────
  const categories = [
    {
      type: ProductCategoryType.PAKAIAN,
      name: "Pakaian",
      icon: "👕",
      sortOrder: 1,
    },
    { type: ProductCategoryType.AMDK, name: "AMDK", icon: "💧", sortOrder: 2 },
    {
      type: ProductCategoryType.HEALTHY_WATER,
      name: "Healthy Water",
      icon: "🌿",
      sortOrder: 3,
    },
    {
      type: ProductCategoryType.SWEET_WATER,
      name: "Minuman Manis",
      icon: "🧃",
      sortOrder: 4,
    },
    {
      type: ProductCategoryType.WAFER,
      name: "Wafer",
      icon: "🍫",
      sortOrder: 5,
    },
    {
      type: ProductCategoryType.ROTI,
      name: "Roti & Bakery",
      icon: "🍞",
      sortOrder: 6,
    },
    {
      type: ProductCategoryType.COKLAT,
      name: "Coklat",
      icon: "🍬",
      sortOrder: 7,
    },
    {
      type: ProductCategoryType.SNACK_GURIH,
      name: "Snack Gurih",
      icon: "🍿",
      sortOrder: 8,
    },
    {
      type: ProductCategoryType.PERMEN_JELLY,
      name: "Permen & Jelly",
      icon: "🍭",
      sortOrder: 9,
    },
    {
      type: ProductCategoryType.MINUMAN_ENERGI,
      name: "Minuman Energi",
      icon: "⚡",
      sortOrder: 10,
    },
    {
      type: ProductCategoryType.SUSU_DAIRY,
      name: "Susu & Dairy",
      icon: "🥛",
      sortOrder: 11,
    },
    {
      type: ProductCategoryType.KOPI_TEH,
      name: "Kopi & Teh",
      icon: "☕",
      sortOrder: 12,
    },
    {
      type: ProductCategoryType.PERAWATAN_DIRI,
      name: "Perawatan Diri",
      icon: "🧴",
      sortOrder: 13,
    },
    {
      type: ProductCategoryType.PERAWATAN_BAYI,
      name: "Perawatan Bayi",
      icon: "👶",
      sortOrder: 14,
    },
    {
      type: ProductCategoryType.PERALATAN_RUMAH,
      name: "Peralatan Rumah",
      icon: "🏠",
      sortOrder: 15,
    },
    {
      type: ProductCategoryType.KEBUTUHAN_DAPUR,
      name: "Kebutuhan Dapur",
      icon: "🍳",
      sortOrder: 16,
    },
    {
      type: ProductCategoryType.LAINNYA,
      name: "Lainnya",
      icon: "📦",
      sortOrder: 99,
    },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.productCategory.upsert({
      where: { type: c.type },
      update: {},
      create: c,
    });
    catMap[c.type] = cat.id;
  }
  console.log(`\n  ✅ ${categories.length} kategori produk`);

  // ── 3. Warehouses ─────────────────────────────────────────────────
  const warehouses = [
    {
      code: "WH-001",
      name: "Gudang Pusat Jakarta",
      city: "Jakarta",
      province: "DKI Jakarta",
      address: "Jl. Raya Industri No.1",
      postalCode: "14350",
    },
    {
      code: "WH-002",
      name: "Gudang Cabang Bandung",
      city: "Bandung",
      province: "Jawa Barat",
      address: "Jl. Soekarno-Hatta No.50",
      postalCode: "40235",
    },
    {
      code: "WH-003",
      name: "Gudang Cabang Surabaya",
      city: "Surabaya",
      province: "Jawa Timur",
      address: "Jl. Rungkut Industri No.25",
      postalCode: "60293",
    },
    {
      code: "WH-004",
      name: "Gudang Cabang Medan",
      city: "Medan",
      province: "Sumatera Utara",
      address: "Jl. Gagak Hitam No.10",
      postalCode: "20218",
    },
  ];

  const whMap: Record<string, string> = {};
  for (const wh of warehouses) {
    const w = await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {},
      create: wh,
    });
    whMap[wh.code] = w.id;
  }
  console.log(`  ✅ ${warehouses.length} gudang`);

  // Assign pengelola gudang ke WH-001
  await prisma.warehouseStaff.upsert({
    where: { userId: createdUsers[UserRole.PENGELOLA_GUDANG] },
    update: {},
    create: {
      userId: createdUsers[UserRole.PENGELOLA_GUDANG],
      warehouseId: whMap["WH-001"],
    },
  });
  await prisma.warehouseStaff.upsert({
    where: { userId: createdUsers[UserRole.PICKER] },
    update: {},
    create: {
      userId: createdUsers[UserRole.PICKER],
      warehouseId: whMap["WH-001"],
    },
  });
  await prisma.warehouseStaff.upsert({
    where: { userId: createdUsers[UserRole.PACKER] },
    update: {},
    create: {
      userId: createdUsers[UserRole.PACKER],
      warehouseId: whMap["WH-001"],
    },
  });

  // ── 4. Supplier ───────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { code: "SUP-0001" },
    update: {},
    create: {
      code: "SUP-0001",
      name: "Budi Santoso",
      company: "PT. Sumber Berkah Nusantara",
      email: "supplier@dist.com",
      phone: "08123456789",
      address: "Jl. Industri Raya No.88",
      city: "Tangerang",
      province: "Banten",
      postalCode: "15000",
      creditDays: 30,
      userId: createdUsers[UserRole.SUPPLIER],
    },
  });
  console.log(`  ✅ Supplier: ${supplier.company}`);

  // ── 5. Sample Products ──────────────────────────────────────────────
  const products = [
    {
      sku: "AMK-000001",
      name: "Aqua Botol 600ml",
      slug: "aqua-botol-600ml",
      categoryId: catMap[ProductCategoryType.AMDK],
      brand: "Aqua",
      basePrice: 2500,
      sellingPrice: 3500,
      unit: ProductUnit.PCS,
      pcsPerBox: 24,
      weight: 620,
      volume: 600,
    },
    {
      sku: "AMK-000002",
      name: "Le Minerale 330ml",
      slug: "le-minerale-330ml",
      categoryId: catMap[ProductCategoryType.AMDK],
      brand: "Le Minerale",
      basePrice: 1800,
      sellingPrice: 2500,
      unit: ProductUnit.PCS,
      pcsPerBox: 24,
      weight: 350,
      volume: 330,
    },
    {
      sku: "WAF-000001",
      name: "Tango Wafer Coklat",
      slug: "tango-wafer-coklat",
      categoryId: catMap[ProductCategoryType.WAFER],
      brand: "Tango",
      basePrice: 4500,
      sellingPrice: 6000,
      unit: ProductUnit.PCS,
      pcsPerBox: 12,
      weight: 100,
    },
    {
      sku: "ROT-000001",
      name: "Sari Roti Tawar",
      slug: "sari-roti-tawar",
      categoryId: catMap[ProductCategoryType.ROTI],
      brand: "Sari Roti",
      basePrice: 10000,
      sellingPrice: 13000,
      unit: ProductUnit.PCS,
      weight: 220,
      hasExpiry: true,
      expiryDays: 5,
    },
    {
      sku: "SNK-000001",
      name: "Chitato Sapi Panggang",
      slug: "chitato-sapi-panggang",
      categoryId: catMap[ProductCategoryType.SNACK_GURIH],
      brand: "Chitato",
      basePrice: 7000,
      sellingPrice: 9500,
      unit: ProductUnit.PCS,
      pcsPerBox: 20,
      weight: 68,
    },
    {
      sku: "CKL-000001",
      name: "SilverQueen Cashew",
      slug: "silverqueen-cashew",
      categoryId: catMap[ProductCategoryType.COKLAT],
      brand: "SilverQueen",
      basePrice: 11000,
      sellingPrice: 14000,
      unit: ProductUnit.PCS,
      pcsPerBox: 24,
      weight: 65,
    },
    {
      sku: "PKN-000001",
      name: "Kaos Polos Cotton Combed 30s",
      slug: "kaos-polos-cotton-combed-30s",
      categoryId: catMap[ProductCategoryType.PAKAIAN],
      brand: "Generic",
      basePrice: 35000,
      sellingPrice: 55000,
      unit: ProductUnit.PCS,
      weight: 180,
      isVariant: true,
      clothingType: "KAOS" as ClothingType,
      gender: "UNISEX",
    },
  ];

  const prodMap: Record<string, string> = {};
  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    prodMap[p.sku] = prod.id;
  }
  console.log(`  ✅ ${products.length} produk`);

  // Varian kaos
  const kaosVariants = [
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-S-WHT",
      size: "S" as ClothingSize,
      color: "Putih",
      colorHex: "#FFFFFF",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-M-WHT",
      size: "M" as ClothingSize,
      color: "Putih",
      colorHex: "#FFFFFF",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-L-WHT",
      size: "L" as ClothingSize,
      color: "Putih",
      colorHex: "#FFFFFF",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-XL-WHT",
      size: "XL" as ClothingSize,
      color: "Putih",
      colorHex: "#FFFFFF",
      priceAdj: 2000,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-S-BLK",
      size: "S" as ClothingSize,
      color: "Hitam",
      colorHex: "#000000",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-M-BLK",
      size: "M" as ClothingSize,
      color: "Hitam",
      colorHex: "#000000",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-L-BLK",
      size: "L" as ClothingSize,
      color: "Hitam",
      colorHex: "#000000",
      priceAdj: 0,
    },
    {
      productId: prodMap["PKN-000001"],
      sku: "PKN-000001-XL-BLK",
      size: "XL" as ClothingSize,
      color: "Hitam",
      colorHex: "#000000",
      priceAdj: 2000,
    },
  ];
  for (const v of kaosVariants) {
    await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: {},
      create: v,
    });
  }
  console.log(`  ✅ ${kaosVariants.length} varian kaos`);

  // ── 6. Initial Stock ─────────────────────────────────────────────
  const stockData = [
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["AMK-000001"],
      quantity: 1000,
      minStock: 100,
    },
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["AMK-000002"],
      quantity: 800,
      minStock: 100,
    },
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["WAF-000001"],
      quantity: 500,
      minStock: 50,
    },
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["ROT-000001"],
      quantity: 200,
      minStock: 30,
    },
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["SNK-000001"],
      quantity: 600,
      minStock: 60,
    },
    {
      warehouseId: whMap["WH-001"],
      productId: prodMap["CKL-000001"],
      quantity: 300,
      minStock: 50,
    },
    {
      warehouseId: whMap["WH-002"],
      productId: prodMap["AMK-000001"],
      quantity: 500,
      minStock: 50,
    },
    {
      warehouseId: whMap["WH-002"],
      productId: prodMap["WAF-000001"],
      quantity: 200,
      minStock: 30,
    },
    {
      warehouseId: whMap["WH-003"],
      productId: prodMap["AMK-000001"],
      quantity: 400,
      minStock: 50,
    },
    {
      warehouseId: whMap["WH-003"],
      productId: prodMap["SNK-000001"],
      quantity: 250,
      minStock: 40,
    },
  ];

  for (const s of stockData) {
    await prisma.stock.create({
      data: { ...s, variantId: undefined },
    });
  }
  console.log(`  ✅ ${stockData.length} stok awal`);

  // ── 7. Default Settings ────────────────────────────────────────────
  const settings = [
    {
      key: "company.name",
      value: "PT. Distributor Jaya Nusantara",
      group: "company",
    },
    { key: "company.phone", value: "021-12345678", group: "company" },
    { key: "company.email", value: "info@distributor.com", group: "company" },
    {
      key: "company.address",
      value: "Jl. Raya Industri No.1, Jakarta",
      group: "company",
    },
    { key: "company.npwp", value: "00.000.000.0-000.000", group: "company" },
    { key: "tax.percent", value: 11, group: "tax" },
    { key: "order.auto_confirm", value: false, group: "order" },
    { key: "stock.low_alert", value: true, group: "stock" },
    { key: "invoice.prefix", value: "INV", group: "invoice" },
    { key: "po.prefix", value: "PO", group: "po" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✅ ${settings.length} pengaturan default`);

  // ── 8. Customer Profile ───────────────────────────────────────────
  const custUser = await prisma.user.findUnique({
    where: { email: "customer@dist.com" },
  });
  if (custUser) {
    await prisma.customerProfile.upsert({
      where: { userId: custUser.id },
      update: {},
      create: {
        userId: custUser.id,
        customerCode: "CUST-000001",
        addresses: [
          {
            name: "Rumah",
            address: "Jl. Makmur No.10",
            city: "Bekasi",
            province: "Jawa Barat",
            postalCode: "17111",
            isDefault: true,
          },
        ],
      },
    });
    console.log(`  ✅ Customer profile`);
  }

  console.log("\n🎉 Seeding selesai!\n");
  console.log("══════════════════════════════════════════════");
  console.log("  Akun default — password: Admin@12345");
  console.log("══════════════════════════════════════════════");
  users.forEach((u) => console.log(`  ${u.role.padEnd(22)} ${u.email}`));
  console.log("══════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
