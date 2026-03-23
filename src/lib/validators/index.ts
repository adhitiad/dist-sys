// src/lib/validators/index.ts
import {
  BeveragePackaging,
  ClothingSize,
  ClothingType,
  OrderChannel,
  PaymentMethod,
  ProductUnit,
  StockMovementType,
  UserRole,
} from "@/generated/prisma/enums";
import { z } from "zod";

// ── Common ───────────────────────────────────────────────────────
// UUID v4 format for PostgreSQL
export const UUID = z.string().uuid("ID tidak valid (harus UUID)");

// Backward compatibility alias
export const ObjectId = UUID;

export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ── Auth ─────────────────────────────────────────────────────────
export const SignInSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter"),
  rememberMe: z.boolean().default(false),
});

export const SignUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[0-9]/, "Harus ada angka"),
  phone: z.string().optional(),
});

// ── User ─────────────────────────────────────────────────────────
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.PELANGGAN),
  warehouseId: z.preprocess(
    (val) => val === "" ? undefined : val,
    UUID.optional()
  ),
});
export const UpdateUserSchema = CreateUserSchema.partial()
  .omit({ password: true })

// ── Customer ────────────────────────────────────────────────────────
export const CustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  npwp: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(0),
  addresses: z.array(z.object({
    label: z.string(),
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    isDefault: z.boolean().default(false),
  })).default([]),
});

export const UpdateCustomerSchema = CustomerSchema.partial()
  .extend({
    isActive: z.boolean().optional(),
  });

// ── Warehouse ────────────────────────────────────────────────────
export const CreateWarehouseSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(5).max(10),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive().optional(),
});
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();

// ── Product ──────────────────────────────────────────────────────
export const CreateProductSchemaBase = z.object({
  sku: z.string().min(3).max(50).optional(),
  barcode: z.string().optional(),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  categoryId: ObjectId,
  brand: z.string().optional(),
  images: z
    .array(
      z.object({
        publicId: z.string(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
        bytes: z.number(),
        format: z.string(),
      }),
    )
    .default([]),
  basePrice: z.number().positive("Harga pokok harus > 0"),
  sellingPrice: z.number().positive("Harga jual harus > 0"),
  minPrice: z.number().positive().optional(),
  unit: z.nativeEnum(ProductUnit).default(ProductUnit.PCS),
  pcsPerBox: z.number().int().positive().optional(),
  boxPerKarton: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  isVariant: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  // Pakaian
  clothingType: z.nativeEnum(ClothingType).optional(),
  gender: z.enum(["PRIA", "WANITA", "UNISEX", "ANAK"]).optional(),
  // Minuman
  volume: z.number().int().positive().optional(),
  packaging: z.nativeEnum(BeveragePackaging).optional(),
  // Makanan
  expiryDays: z.number().int().positive().optional(),
});

export const CreateProductSchema = CreateProductSchemaBase.refine(
  (d) => d.sellingPrice >= d.basePrice,
  "Harga jual tidak boleh < harga pokok",
);

export const UpdateProductSchema = CreateProductSchemaBase.partial();

export const CreateVariantSchema = z.object({
  productId: ObjectId,
  sku: z.string().min(3).max(50).optional(),
  size: z.nativeEnum(ClothingSize).optional(),
  color: z.string().optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  image: z.object({ publicId: z.string(), url: z.string() }).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  priceAdj: z.number().default(0),
  weight: z.number().positive().optional(),
});

export const PriceTierSchema = z.object({
  productId: ObjectId,
  tierName: z.string().min(2),
  minQty: z.number().int().positive(),
  price: z.number().positive(),
});

// ── Supplier ─────────────────────────────────────────────────────
export const CreateSupplierSchema = z.object({
  name: z.string().min(2).max(100),
  company: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().optional(),
  npwp: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
  creditDays: z.number().int().min(0).default(30),
  notes: z.string().optional(),
});
export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// ── Purchase Order ───────────────────────────────────────────────
export const CreatePurchaseOrderSchema = z.object({
  supplierId: ObjectId,
  warehouseId: ObjectId,
  expectedDate: z.coerce.date().optional(),
  taxPercent: z.number().min(0).max(100).default(11),
  discount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: ObjectId,
        variantId: z.preprocess(
          (val) => val === "" ? undefined : val,
          ObjectId.optional()
        ),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).default(0),
        expiryDate: z.coerce.date().optional(),
      }),
    )
    .min(1, "Minimal 1 item"),
});

// ── Order ────────────────────────────────────────────────────────
const AddressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(5),
});

export const CreateOrderSchema = z.object({
  customerId: ObjectId.optional(),
  channel: z.nativeEnum(OrderChannel).default(OrderChannel.ONLINE),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  shippingAddress: AddressSchema.optional(),
  shippingCourier: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  discount: z.number().min(0).default(0),
  discountCode: z.string().optional(),
  taxPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: ObjectId,
        variantId: z.preprocess(
          (val) => val === "" ? undefined : val,
          ObjectId.optional()
        ),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).default(0),
      }),
    )
    .min(1, "Minimal 1 item"),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PROCESSING",
    "PICKING",
    "PACKING",
    "READY",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ]),
  cancelReason: z.string().optional(),
  internalNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export const ProcessPaymentSchema = z.object({
  orderId: ObjectId,
  paymentMethod: z.nativeEnum(PaymentMethod),
  paidAmount: z.number().positive(),
  notes: z.string().optional(),
});

// ── Stock Transfer ───────────────────────────────────────────────
export const CreateTransferSchema = z
  .object({
    fromWarehouseId: ObjectId,
    toWarehouseId: ObjectId,
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: ObjectId,
          variantId: z.preprocess(
            (val) => val === "" ? undefined : val,
            ObjectId.optional()
          ),
          requestedQty: z.number().int().positive(),
          notes: z.string().optional(),
        }),
      )
      .min(1),
  })
  .refine(
    (d) => d.fromWarehouseId !== d.toWarehouseId,
    "Gudang asal dan tujuan tidak boleh sama",
  );

export const ReceiveTransferSchema = z.object({
  items: z.array(
    z.object({
      itemId: ObjectId,
      receivedQty: z.number().int().min(0),
      condition: z.enum(["GOOD", "DAMAGED"]).default("GOOD"),
      notes: z.string().optional(),
    }),
  ),
  notes: z.string().optional(),
});

// ── Stock Adjustment ─────────────────────────────────────────────
export const StockAdjustmentSchema = z.object({
  warehouseId: ObjectId,
  productId: ObjectId,
  variantId: z.preprocess(
    (val) => val === "" ? undefined : val,
    ObjectId.optional()
  ),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number().int(),
  notes: z.string().min(5, "Catatan wajib minimal 5 karakter"),
});

// ── Type exports ──────────────────────────────────────────────────
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<
  typeof CreatePurchaseOrderSchema
>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

