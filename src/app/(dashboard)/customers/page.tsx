// src/app/(dashboard)/customers/page.tsx
"use client";
import { useState } from "react";
import {
  Users,
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  X,
  Eye,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, rupiah } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";

// ── Types ──────────────────────────────────────────────────────────
type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  customerProfile?: {
    id: string;
    customerCode: string;
    companyName?: string;
    npwp?: string;
    creditLimit: number;
    paymentTerms: number;
    loyaltyPoints: number;
    addresses: Array<{
      id: string;
      label: string;
      name: string;
      phone: string;
      address: string;
      city: string;
      province: string;
      postalCode: string;
      isDefault: boolean;
    }>;
  };
  _count?: {
    orders: number;
  };
  orders?: Order[];
};

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  items?: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: number;
  }>;
};

type TabType = "all" | "detail";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "orders" | "addresses">("profile");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const qc = useQueryClient();

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search, statusFilter],
    queryFn: () => client.get("/api/users", {
      params: { page, limit: 20, search, role: "PELANGGAN", isActive: statusFilter || undefined },
    }).then(r => r.data),
  });

  // Fetch customer detail
  const { data: customerDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["customer", selectedCustomer?.id],
    queryFn: () => client.get(`/api/users/${selectedCustomer?.id}`).then(r => r.data.data),
    enabled: !!selectedCustomer,
  });

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      client.patch(`/api/users/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(variables.isActive ? "Pelanggan diaktifkan." : "Pelanggan diblokir.");
    },
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: (id: string) => client.delete(`/api/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Pelanggan dihapus.");
      setSelectedCustomer(null);
      setActiveTab("all");
    },
  });

  const rows: Customer[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  // Columns for customer table
  const cols: Column<Customer>[] = [
    {
      key: "customer",
      header: "Pelanggan",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {r.name?.slice(0, 2).toUpperCase() || "NA"}
          </div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
            {r.customerProfile?.companyName && (
              <p className="text-xs text-blue-600">{r.customerProfile.companyName}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Kode",
      cell: (r) => (
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
          {r.customerProfile?.customerCode || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Telepon",
      cell: (r) => <span className="text-xs">{r.phone || "—"}</span>,
    },
    {
      key: "orders",
      header: "Pesanan",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{r._count?.orders ?? 0}</span>
        </div>
      ),
    },
    {
      key: "loyalty",
      header: "Poin",
      cell: (r) => (
        <span className="text-xs font-medium text-amber-600">
          {r.customerProfile?.loyaltyPoints?.toLocaleString() ?? 0} pts
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <div className="flex flex-col gap-1">
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
              r.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {r.isActive ? "Aktif" : "Diblokir"}
          </span>
          {r.emailVerified && (
            <span className="w-fit rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              ✓ Terverifikasi
            </span>
          )}
        </div>
      ),
    },
    {
      key: "joined",
      header: "Bergabung",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedCustomer(r);
              setActiveTab("detail");
              setDetailTab("profile");
            }}
            className="rounded-lg p-1.5 hover:bg-muted"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() =>
              toggleActive.mutate({ id: r.id, isActive: !r.isActive })
            }
            className={`rounded-lg p-1.5 ${
              r.isActive
                ? "text-red-500 hover:bg-red-50"
                : "text-green-500 hover:bg-green-50"
            }`}
            title={r.isActive ? "Blokir" : "Aktifkan"}
          >
            {r.isActive ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              if (confirm("Yakin ingin menghapus pelanggan ini?")) {
                deleteCustomer.mutate(r.id);
              }
            }}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const filters = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
    >
      <option value="">Semua Status</option>
      <option value="true">Aktif</option>
      <option value="false">Diblokir</option>
    </select>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} pelanggan terdaftar
          </p>
        </div>
      </div>

      {/* Customer List Tab */}
      {activeTab === "all" && (
        <DataTable<Customer>
          data={rows}
          columns={cols}
          keyField="id"
          isLoading={isLoading}
          total={total}
          page={page}
          limit={20}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Cari nama, email, telepon…"
          emptyText="Belum ada pelanggan."
          actions={filters}
        />
      )}

      {/* Customer Detail Tab */}
      {activeTab === "detail" && customerDetail && (
        <CustomerDetailPanel
          customer={customerDetail}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          onBack={() => {
            setActiveTab("all");
            setSelectedCustomer(null);
          }}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["customer", selectedCustomer?.id] })}
          onToggleActive={() => toggleActive.mutate({ id: customerDetail.id, isActive: !customerDetail.isActive })}
          onDelete={() => {
            if (confirm("Yakin ingin menghapus pelanggan ini?")) {
              deleteCustomer.mutate(customerDetail.id);
            }
          }}
        />
      )}
    </div>
  );
}

// ── Customer Detail Panel Component ────────────────────────────────
function CustomerDetailPanel({
  customer,
  detailTab,
  setDetailTab,
  onBack,
  onRefresh,
  onToggleActive,
  onDelete,
}: {
  customer: Customer;
  detailTab: "profile" | "orders" | "addresses";
  setDetailTab: (t: "profile" | "orders" | "addresses") => void;
  onBack: () => void;
  onRefresh: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    companyName: customer.customerProfile?.companyName || "",
    npwp: customer.customerProfile?.npwp || "",
    creditLimit: customer.customerProfile?.creditLimit || 0,
    paymentTerms: customer.customerProfile?.paymentTerms || 0,
  });

  const updateCustomer = useMutation({
    mutationFn: (data: typeof form) =>
      client.patch(`/api/users/${customer.id}`, {
        name: data.name,
        phone: data.phone,
      }),
    onSuccess: () => {
      onRefresh();
      setEditMode(false);
      toast.success("Data pelanggan diperbarui.");
    },
  });

  const TABS = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "orders" as const, label: "Pesanan", icon: ShoppingBag },
    { id: "addresses" as const, label: "Alamat", icon: MapPin },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Kembali
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleActive}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              customer.isActive
                ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {customer.isActive ? (
              <>
                <Ban className="h-4 w-4" /> Blokir
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" /> Aktifkan
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" /> Hapus
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {customer.name?.slice(0, 2).toUpperCase() || "NA"}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{customer.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                    {customer.customerProfile?.customerCode || "—"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      customer.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {customer.isActive ? "Aktif" : "Diblokir"}
                  </span>
                  {customer.customerProfile?.companyName && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {customer.customerProfile.companyName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                {editMode ? "Batal" : "Edit"}
              </button>
            </div>

            {/* Contact info */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Bergabung {formatDateTime(customer.createdAt)}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-muted/50 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {customer._count?.orders ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Pesanan</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {customer.customerProfile?.loyaltyPoints?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Poin</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {rupiah(customer.customerProfile?.creditLimit ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Limit Kredit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDetailTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              detailTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {detailTab === "profile" && (
        <ProfileTab
          customer={customer}
          editMode={editMode}
          form={form}
          setForm={setForm}
          onSave={() => updateCustomer.mutate(form)}
          loading={updateCustomer.isPending}
        />
      )}

      {detailTab === "orders" && <OrdersTab customer={customer} />}

      {detailTab === "addresses" && (
        <AddressesTab
          customer={customer}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// ── Profile Tab ─────────────────────────────────────────────────────
type ProfileForm = {
  name: string;
  phone: string;
  email: string;
  companyName: string;
  npwp: string;
  creditLimit: number;
  paymentTerms: number;
};

function ProfileTab({
  customer,
  editMode,
  form,
  setForm,
  onSave,
  loading,
}: {
  customer: Customer;
  editMode: boolean;
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  onSave: () => void;
  loading: boolean;
}) {
  const input = (field: string, label: string, type = "text") => (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {editMode ? (
        <input
          type={type}
          value={form[field as keyof ProfileForm] as string | number}
          onChange={(e) =>
            setForm((f: ProfileForm) => ({
              ...f,
              [field]: type === "number" ? Number(e.target.value) : e.target.value,
            }))
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          {String((customer as Record<string, unknown>)[field] ||
            (customer.customerProfile as Record<string, unknown>)?.[field as string] ||
            "—")}
        </p>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold">Informasi Akun</h3>
      <div className="grid grid-cols-2 gap-4">
        {input("name", "Nama Lengkap")}
        {input("email", "Email", "email")}
        {input("phone", "Telepon", "tel")}
        {input("companyName", "Nama Perusahaan")}
        {input("npwp", "NPWP")}
        {input("creditLimit", "Limit Kredit", "number")}
        {input("paymentTerms", "Termin Pembayaran (hari)", "number")}
      </div>
      {editMode && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Simpan Perubahan
          </button>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ──────────────────────────────────────────────────────
function OrdersTab({ customer }: { customer: Customer }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const orders = customer.orders || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">Belum ada pesanan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => setSelectedOrder(order)}
          className="w-full rounded-xl border border-border bg-card p-4 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm font-bold text-primary">
                {order.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold">{rupiah(order.total)}</p>
              <div className="flex gap-1">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>
        </button>
      ))}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Pembayaran</span>
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span>{selectedOrder.paymentMethod || "—"}</span>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Item</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.product.name}{" "}
                        <span className="text-muted-foreground">
                          x{item.quantity}
                        </span>
                      </span>
                      <span>{rupiah(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{rupiah(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Addresses Tab ────────────────────────────────────────────────────
function AddressesTab({
  customer,
  onRefresh,
}: {
  customer: Customer;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  } | null>(null);

  const addresses = customer.customerProfile?.addresses || [];

  const saveAddress = useMutation({
    mutationFn: (addr: typeof editingAddress) =>
      client.patch(`/api/users/${customer.id}/addresses`, addr),
    onSuccess: () => {
      onRefresh();
      setShowForm(false);
      setEditingAddress(null);
      toast.success("Alamat disimpan.");
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (addressId: string) =>
      client.delete(`/api/users/${customer.id}/addresses/${addressId}`),
    onSuccess: () => {
      onRefresh();
      toast.success("Alamat dihapus.");
    },
  });

  const setDefault = useMutation({
    mutationFn: (addressId: string) =>
      client.patch(`/api/users/${customer.id}/addresses/${addressId}/default`),
    onSuccess: () => {
      onRefresh();
      toast.success("Alamat utama diubah.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Alamat Tersimpan</h3>
        <button
          onClick={() => {
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tambah Alamat
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12">
          <MapPin className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Belum ada alamat tersimpan
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-xl border p-4 ${
                addr.isDefault
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{addr.name}</p>
                  <p className="text-xs text-muted-foreground">{addr.phone}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.address}, {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefault.mutate(addr.id)}
                      className="rounded p-1 text-xs text-primary hover:bg-primary/10"
                      title="Jadikan Utama"
                    >
                      Utama
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingAddress(addr);
                      setShowForm(true);
                    }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Hapus alamat ini?")) {
                        deleteAddress.mutate(addr.id);
                      }
                    }}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <AddressFormModal
          address={editingAddress}
          onClose={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          onSave={(data) => saveAddress.mutate(data)}
          loading={saveAddress.isPending}
        />
      )}
    </div>
  );
}

// ── Address Form Modal ───────────────────────────────────────────────
function AddressFormModal({
  address,
  onClose,
  onSave,
  loading,
}: {
  address: {
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  } | null;
  onClose: () => void;
  onSave: (data: typeof address) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(
    address || {
      id: "",
      label: "Rumah",
      name: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      isDefault: false,
    }
  );

  const LABELS = ["Rumah", "Kantor", "Gudang", "Lainnya"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">
            {address ? "Edit Alamat" : "Tambah Alamat"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium">Label</label>
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    form.label === l
                      ? "bg-primary text-white"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Nama</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Telepon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Alamat</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Kota</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Provinsi</label>
              <input
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Kode Pos</label>
              <input
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2 text-sm hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
