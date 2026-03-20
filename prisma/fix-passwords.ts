// prisma/fix-passwords.ts
// Script untuk memperbaiki password hash yang invalid
// Run dengan: npx tsx prisma/fix-passwords.ts

import "dotenv/config";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function fixPasswords() {
  console.log("🔧 Memeriksa dan memperbaiki password hash...\n");

  // Password default untuk semua akun
  const DEFAULT_PASSWORD = "Admin@12345";
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Cari semua akun dengan provider "credential"
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "credential",
    },
    include: {
      user: true,
    },
  });

  console.log(`📋 Ditemukan ${accounts.length} akun dengan credential provider\n`);

  if (accounts.length === 0) {
    console.log("❌ Tidak ada akun credential ditemukan!");
    console.log("💡 Jalankan seed terlebih dahulu: npm run db:seed");
    return;
  }

  // Perbaiki setiap akun
  for (const account of accounts) {
    console.log(`  Processing: ${account.user.email}...`);
    
    // Update password dengan hash yang valid
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hash },
    });
    
    console.log(`  ✅ Password diperbaiki untuk ${account.user.email}`);
  }

  console.log("\n✨ Semua password telah diperbaiki!");
  console.log(`📝 Password default: ${DEFAULT_PASSWORD}`);
}

fixPasswords()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
