-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'KASIR', 'SUPPLIER', 'PENGELOLA_GUDANG', 'PICKER', 'PACKER', 'PELANGGAN', 'AKUNTAN', 'MANAJER_PENJUALAN', 'MANAJER_PEMBELIAN', 'DRIVER');

-- CreateEnum
CREATE TYPE "ProductCategoryType" AS ENUM ('PAKAIAN', 'AMDK', 'HEALTHY_WATER', 'SWEET_WATER', 'WAFER', 'ROTI', 'COKLAT', 'SNACK_GURIH', 'PERMEN_JELLY', 'MINUMAN_ENERGI', 'SUSU_DAIRY', 'KOPI_TEH', 'PERAWATAN_DIRI', 'PERAWATAN_BAYI', 'PERALATAN_RUMAH', 'KEBUTUHAN_DAPUR', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ClothingType" AS ENUM ('KAOS', 'KEMEJA', 'POLO', 'CELANA_PANJANG', 'CELANA_PENDEK', 'CELANA_DALAM', 'JAKET', 'HOODIE', 'SWEATER', 'DRESS', 'ROK', 'PAKAIAN_TIDUR', 'PAKAIAN_OLAHRAGA', 'KAOS_KAKI', 'TOPI', 'PAKAIAN_DALAM_WANITA', 'PAKAIAN_ANAK', 'PAKAIAN_BAYI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ClothingSize" AS ENUM ('FREE_SIZE', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'SIZE_28', 'SIZE_29', 'SIZE_30', 'SIZE_31', 'SIZE_32', 'SIZE_33', 'SIZE_34', 'SIZE_36', 'SIZE_38', 'SIZE_40');

-- CreateEnum
CREATE TYPE "BeveragePackaging" AS ENUM ('CUP_120ML', 'CUP_240ML', 'BOTOL_250ML', 'BOTOL_330ML', 'BOTOL_500ML', 'BOTOL_600ML', 'BOTOL_750ML', 'BOTOL_1000ML', 'BOTOL_1500ML', 'BOTOL_2000ML', 'GALON_19L', 'KARDUS', 'SACHET', 'POUCH', 'TETRA_PAK', 'KALENG_250ML', 'KALENG_330ML');

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('PCS', 'LUSIN', 'KODI', 'BOX', 'KARTON', 'PACK', 'SACHET', 'BOTOL', 'GALON', 'KG', 'GRAM', 'LITER', 'ML');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'RETURN_IN', 'RETURN_OUT', 'DAMAGED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'RECEIVED', 'PARTIAL_RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL_RECEIVED', 'RECEIVED', 'INVOICED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'OFFLINE', 'WHATSAPP', 'MARKETPLACE', 'PHONE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'PICKING', 'PACKING', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER_BANK', 'QRIS', 'COD', 'KREDIT', 'DEBIT_CARD', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED', 'VOID');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('ASSIGNED', 'PICKING', 'PICKING_DONE', 'PACKING', 'PACKING_DONE', 'READY_TO_SHIP', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'PURCHASE', 'STOCK_TRANSFER', 'REFUND', 'EXPENSE', 'ADJUSTMENT', 'PAYMENT_IN', 'PAYMENT_OUT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'MIN_PURCHASE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_NEW', 'ORDER_STATUS_CHANGE', 'STOCK_LOW', 'TRANSFER_REQUEST', 'TRANSFER_APPROVED', 'PURCHASE_ORDER_NEW', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PELANGGAN',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "companyName" TEXT,
    "npwp" TEXT,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "addresses" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "warehouse_staff" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_staff_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "_id" TEXT NOT NULL,
    "type" "ProductCategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "products" (
    "_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "images" JSONB[],
    "basePrice" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION,
    "unit" "ProductUnit" NOT NULL DEFAULT 'PCS',
    "pcsPerBox" INTEGER,
    "boxPerKarton" INTEGER,
    "weight" DOUBLE PRECISION,
    "isVariant" BOOLEAN NOT NULL DEFAULT false,
    "hasExpiry" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "clothingType" "ClothingType",
    "gender" TEXT,
    "volume" INTEGER,
    "packaging" "BeveragePackaging",
    "expiryDays" INTEGER,
    "tags" TEXT[],
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "_id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "size" "ClothingSize",
    "color" TEXT,
    "colorHex" TEXT,
    "image" JSONB,
    "attributes" JSONB,
    "priceAdj" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "price_tiers" (
    "_id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "_id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 10,
    "maxStock" INTEGER,
    "rackLocation" TEXT,
    "lastCountAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "_id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "_id" TEXT NOT NULL,
    "transferCode" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "driverId" TEXT,
    "notes" TEXT,
    "approvalNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "_id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "requestedQty" INTEGER NOT NULL,
    "transferredQty" INTEGER,
    "receivedQty" INTEGER,
    "condition" TEXT,
    "notes" TEXT,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "_id" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "npwp" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankHolder" TEXT,
    "creditDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "_id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 11,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "_id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "_id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "shippingName" TEXT,
    "shippingPhone" TEXT,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingProvince" TEXT,
    "shippingPostal" TEXT,
    "shippingCourier" TEXT,
    "trackingNumber" TEXT,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedDelivery" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountCode" TEXT,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "_id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order_fulfillments" (
    "_id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "pickerId" TEXT,
    "packerId" TEXT,
    "driverId" TEXT,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "pickedAt" TIMESTAMP(3),
    "packedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "pickingNotes" TEXT,
    "packingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_fulfillments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "order_returns" (
    "_id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnCode" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "items" JSONB[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "referenceType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minPurchase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDiscount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "_id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_userId_key" ON "customer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_customerCode_key" ON "customer_profiles"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_staff_userId_key" ON "warehouse_staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_type_key" ON "product_categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_transferCode_key" ON "stock_transfers"("transferCode");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_userId_key" ON "suppliers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_email_key" ON "suppliers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillments_orderId_key" ON "order_fulfillments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_returns_returnCode_key" ON "order_returns"("returnCode");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_staff" ADD CONSTRAINT "warehouse_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_staff" ADD CONSTRAINT "warehouse_staff_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_packerId_fkey" FOREIGN KEY ("packerId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
