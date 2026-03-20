// src/hooks/use-queries.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { CreateOrderInput, CreateTransferInput } from "@/lib/validators";

// ── Keys ──────────────────────────────────────────────────────────
export const Q = {
  session:        ()          => ["session"],
  warehouses:     (p?: object)=> ["warehouses", p],
  warehouse:      (id: string)=> ["warehouse", id],
  warehouseStock: (id: string, p?: object) => ["w-stock", id, p],
  products:       (p?: object)=> ["products", p],
  product:        (id: string)=> ["product", id],
  categories:     ()          => ["categories"],
  suppliers:      (p?: object)=> ["suppliers", p],
  supplier:       (id: string)=> ["supplier", id],
  purchaseOrders: (p?: object)=> ["pos", p],
  purchaseOrder:  (id: string)=> ["po", id],
  orders:         (p?: object)=> ["orders", p],
  order:          (id: string)=> ["order", id],
  transfers:      (p?: object)=> ["transfers", p],
  transfer:       (id: string)=> ["transfer", id],
  dashboard:      (p?: object)=> ["dashboard", p],
  lowStock:       (wid?: string) => ["low-stock", wid],
  movements:      (wid: string, p?: object) => ["movements", wid, p],
};

// ── Warehouses ────────────────────────────────────────────────────
export const useWarehouses = (p?: object) => useQuery({
  queryKey: Q.warehouses(p),
  queryFn:  () => client.get("/api/warehouses", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const useWarehouse = (id: string) => useQuery({
  queryKey: Q.warehouse(id), enabled: !!id,
  queryFn:  () => client.get(`/api/warehouses/${id}`).then(r => r.data.data),
});

export const useWarehouseStock = (warehouseId: string, p?: object) => useQuery({
  queryKey: Q.warehouseStock(warehouseId, p), enabled: !!warehouseId,
  queryFn:  () => client.get(`/api/warehouses/${warehouseId}/stock`, { params: p }).then(r => r.data.data),
  refetchInterval: 30_000,
});

// ── Products ──────────────────────────────────────────────────────
export const useProducts = (p?: object) => useQuery({
  queryKey: Q.products(p),
  queryFn:  () => client.get("/api/products", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const useProduct = (id: string) => useQuery({
  queryKey: Q.product(id), enabled: !!id,
  queryFn:  () => client.get(`/api/products/${id}`).then(r => r.data.data),
});

export const useCategories = () => useQuery({
  queryKey: Q.categories(),
  queryFn:  () => client.get("/api/products/categories").then(r => r.data.data),
  staleTime: 1000 * 60 * 10,
});

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => client.post("/api/products", data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useUpdateProduct = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => client.patch(`/api/products/${id}`, data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: Q.product(id) }); qc.invalidateQueries({ queryKey: ["products"] }); },
  });
};

// ── Suppliers ─────────────────────────────────────────────────────
export const useSuppliers = (p?: object) => useQuery({
  queryKey: Q.suppliers(p),
  queryFn:  () => client.get("/api/suppliers", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const useSupplier = (id: string) => useQuery({
  queryKey: Q.supplier(id), enabled: !!id,
  queryFn:  () => client.get(`/api/suppliers/${id}`).then(r => r.data.data),
});

// ── Purchase Orders ───────────────────────────────────────────────
export const usePurchaseOrders = (p?: object) => useQuery({
  queryKey: Q.purchaseOrders(p),
  queryFn:  () => client.get("/api/purchase-orders", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const usePurchaseOrder = (id: string) => useQuery({
  queryKey: Q.purchaseOrder(id), enabled: !!id,
  queryFn:  () => client.get(`/api/purchase-orders/${id}`).then(r => r.data.data),
});

// ── Orders ────────────────────────────────────────────────────────
export const useOrders = (p?: object) => useQuery({
  queryKey: Q.orders(p),
  queryFn:  () => client.get("/api/orders", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const useOrder = (id: string) => useQuery({
  queryKey: Q.order(id), enabled: !!id,
  queryFn:  () => client.get(`/api/orders/${id}`).then(r => r.data.data),
});

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) => client.post("/api/orders", data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: string; status: string; cancelReason?: string; trackingNumber?: string }) =>
      client.patch(`/api/orders/${id}/status`, rest).then(r => r.data),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: Q.order(v.id) }); qc.invalidateQueries({ queryKey: ["orders"] }); },
  });
};

export const useProcessPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: string; paidAmount: number; paymentMethod: string }) =>
      client.post(`/api/orders/${id}/payment`, rest).then(r => r.data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: Q.order(v.id) }),
  });
};

// ── Stock Transfers ───────────────────────────────────────────────
export const useTransfers = (p?: object) => useQuery({
  queryKey: Q.transfers(p),
  queryFn:  () => client.get("/api/stock-transfers", { params: p }).then(r => r.data),
  placeholderData: keepPreviousData,
});

export const useTransfer = (id: string) => useQuery({
  queryKey: Q.transfer(id), enabled: !!id,
  queryFn:  () => client.get(`/api/stock-transfers/${id}`).then(r => r.data.data),
});

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferInput) => client.post("/api/stock-transfers", data).then(r => r.data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["transfers"] }); qc.invalidateQueries({ queryKey: ["w-stock"] }); },
  });
};

export const useApproveTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      client.post(`/api/stock-transfers/${id}/approve`, { approved, notes }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
};

export const useDispatchTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.post(`/api/stock-transfers/${id}/dispatch`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); qc.invalidateQueries({ queryKey: ["w-stock"] }); },
  });
};

export const useReceiveTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: Array<{ itemId: string; receivedQty: number; condition: string; notes?: string }> }) =>
      client.post(`/api/stock-transfers/${id}/receive`, { items }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); qc.invalidateQueries({ queryKey: ["w-stock"] }); },
  });
};

// ── Reports ───────────────────────────────────────────────────────
export const useDashboard = (p: { from: string; to: string; warehouseId?: string }) => useQuery({
  queryKey: Q.dashboard(p),
  queryFn:  () => client.get("/api/reports/dashboard", { params: p }).then(r => r.data.data),
  refetchInterval: 5 * 60_000,
});

export const useLowStock = (warehouseId?: string) => useQuery({
  queryKey: Q.lowStock(warehouseId),
  queryFn:  () => client.get("/api/reports/low-stock", { params: { warehouseId } }).then(r => r.data.data),
  refetchInterval: 60_000,
});

// ── Upload ────────────────────────────────────────────────────────
export const useDeleteUpload = () => useMutation({
  mutationFn: (publicId: string) => client.delete("/api/upload", { data: { publicId } }).then(r => r.data),
});
