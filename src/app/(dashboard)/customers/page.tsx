// src/app/(dashboard)/customers/page.tsx
"use client";
import { DataTable, type Column } from "@/components/shared/data-table";
import client from "@/lib/axios";
import { formatDateTime, rupiah } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {Input} from "@/components/ui/input"
import {
  Ban,
  CheckCircle,
  CreditCard,
  Edit,
  MapPin,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  customerProfile?: {
    id: string;
    customerCode: string;
    companyName?: string;
    npwp?: string;
    creditLimit?: number;
    paymentTerms?: string;
    loyaltyPoints?: number;
    addresses?: any[];
  };
  orders?: any[];
  stats?: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
  };
};

type Address = {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"list" | "detail">(
    selectedCustomer ? "detail" : "list",
  );
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () =>
      client
        .get("/api/customers", { params: { page, limit: 20, search } })
        .then((r) => r.data),
  });

  const toggleBlock = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      client.patch(`/api/users/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Status pelanggan diperbarui.");
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => client.delete(`/api/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Pelanggan dihapus.");
      setSelectedCustomer(null);
      setActiveTab("list");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus pelanggan");
    },
  });

  const rows: Customer[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  const cols: Column<Customer>[] = [
    {
      key: "name",
      header: "Pelanggan",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.customerProfile?.customerCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Kontak",
      cell: (r) => (
        <div className="text-xs">
          <p>{r.email}</p>
          <p className="text-muted-foreground">{r.phone || "—"}</p>
        </div>
      ),
    },
    {
      key: "company",
      header: "Perusahaan",
      cell: (r) => (
        <span className="text-sm">{r.customerProfile?.companyName || "—"}</span>
      ),
    },
    {
      key: "stats",
      header: "Pesanan",
      cell: (r) => (
        <div className="text-xs">
          <p className="font-medium">
            {r.customerProfile?.loyaltyPoints || 0} poin
          </p>
          <p className="text-muted-foreground">
            {r.stats?.totalOrders || 0} pesanan
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
        >
          {r.isActive ? "Aktif" : "Diblokir"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Bergabung",
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "w-32",
      cell: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setSelectedCustomer(r);
              setActiveTab("detail");
            }}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-primary"
            title="Lihat Detail"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              toggleBlock.mutate({ id: r.id, isActive: !r.isActive })
            }
            className={`rounded-lg p-1.5 transition ${r.isActive ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-500"}`}
            title={r.isActive ? "Blokir" : "Aktifkan"}
          >
            {r.isActive ? (
              <Ban className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => deleteCustomer.mutate(r.id)}
            className="rounded-lg p-1.5 hover:bg-red-50 text-red-500"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} pelanggan terdaftar
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tambah Pelanggan
        </button>
      </div>

      {activeTab === "list" ? (
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
          searchPlaceholder="Cari nama, email, perusahaan…"
          emptyText="Belum ada pelanggan."
        />
      ) : (
        <CustomerDetail
          customer={selectedCustomer!}
          onBack={() => {
            setSelectedCustomer(null);
            setActiveTab("list");
          }}
          onUpdate={() => {
            qc.invalidateQueries({ queryKey: ["customers"] });
          }}
        />
      )}

      {showForm && (
        <CustomerFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["customers"] });
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function CustomerDetail({
  customer,
  onBack,
  onUpdate,
}: {
  customer: Customer;
  onBack(): void;
  onUpdate(): void;
}) {
  const [activeTab, setActiveTab] = useState<
    "info" | "orders" | "credit" | "addresses"
  >("info");
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["customer", customer.id],
    queryFn: () =>
      client.get(`/api/customers/${customer.id}`).then((r) => r.data.data),
    enabled: !!customer.id,
  });

  const customerDetail = detailData || {
    ...customer,
    orders: customer.orders || [],
    stats: customer.stats || {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalSpent: 0,
    },
  };

  const tabs = [
    { id: "info", label: "Informasi", icon: User },
    { id: "orders", label: "Riwayat Pesanan", icon: ShoppingBag },
    { id: "credit", label: "Kredit & Poin", icon: CreditCard },
    { id: "addresses", label: "Alamat", icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke daftar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">
              {customer.customerProfile?.customerCode}
            </p>
            {customer.customerProfile?.companyName && (
              <p className="text-sm mt-1">
                {customer.customerProfile.companyName}
              </p>
            )}
          </div>
          <div className="text-right">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${customer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            >
              {customer.isActive ? "Aktif" : "Diblokir"}
            </span>
            <p className="text-xs text-muted-foreground mt-2">
              Bergabung {formatDateTime(customer.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-border bg-card p-6">
        {activeTab === "info" && <InfoTab customer={customerDetail} />}
        {activeTab === "orders" && (
          <OrdersTab customer={customerDetail} isLoading={isLoading} />
        )}
        {activeTab === "credit" && <CreditTab customer={customerDetail} />}
        {activeTab === "addresses" && (
          <AddressesTab customer={customerDetail} />
        )}
      </div>

      {showEditForm && (
        <CustomerFormModal
          customer={customerDetail}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            onUpdate();
            setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
}

function InfoTab({ customer }: { customer: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Data Diri</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span>{customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{customer.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telepon</span>
            <span>{customer.phone || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NPWP</span>
            <span>{customer.customerProfile?.npwp || "—"}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Perusahaan</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama Perusahaan</span>
            <span>{customer.customerProfile?.companyName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kode Pelanggan</span>
            <span>{customer.customerProfile?.customerCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terms Pembayaran</span>
            <span>{customer.customerProfile?.paymentTerms || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({
  customer,
  isLoading,
}: {
  customer: any;
  isLoading: boolean;
}) {
  const orders = customer.orders || [];

  if (isLoading)
    return (
      <div className="text-center py-8 text-muted-foreground">Memuat...</div>
    );
  if (orders.length === 0)
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada pesanan
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-2xl font-bold">
            {customer.stats?.totalOrders || 0}
          </p>
          <p className="text-xs text-muted-foreground">Total Pesanan</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {customer.stats?.completedOrders || 0}
          </p>
          <p className="text-xs text-green-600">Selesai</p>
        </div>
        <div className="rounded-xl bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {customer.stats?.pendingOrders || 0}
          </p>
          <p className="text-xs text-yellow-600">Menunggu</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {rupiah(customer.stats?.totalSpent || 0)}
          </p>
          <p className="text-xs text-blue-600">Total Belanja</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">No. Pesanan</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Pembayaran</th>
              <th className="pb-2 font-medium text-right">Total</th>
              <th className="pb-2 font-medium text-right">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-b">
                <td className="py-3 font-medium">{order.orderNumber}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      order.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      order.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-700"
                        : order.paymentStatus === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="py-3 text-right font-medium">
                  {rupiah(order.total || 0)}
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreditTab({ customer }: { customer: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
        <p className="text-sm opacity-80">Batas Kredit</p>
        <p className="text-3xl font-bold mt-1">
          {rupiah(customer.customerProfile?.creditLimit || 0)}
        </p>
        <p className="text-sm mt-4 opacity-80">
          Terms: {customer.customerProfile?.paymentTerms || "—"}
        </p>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
        <p className="text-sm opacity-80">Poin Loyalitas</p>
        <p className="text-3xl font-bold mt-1">
          {customer.customerProfile?.loyaltyPoints || 0}
        </p>
        <p className="text-sm mt-4 opacity-80">
          Terakumulasi dari {customer.stats?.totalOrders || 0} pesanan
        </p>
      </div>
    </div>
  );
}

function AddressesTab({ customer }: { customer: any }) {
  const addresses: Address[] = customer.customerProfile?.addresses || [];

  if (addresses.length === 0)
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada alamat
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((addr, idx) => (
        <div
          key={idx}
          className={`rounded-xl border p-4 ${addr.isDefault ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{addr.label}</p>
              <p className="text-sm mt-1">{addr.recipient}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
            </div>
            {addr.isDefault && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Utama
              </span>
            )}
          </div>
          <p className="text-sm mt-3 text-muted-foreground">{addr.address}</p>
          <p className="text-sm text-muted-foreground">
            {addr.city}, {addr.province} {addr.postalCode}
          </p>
        </div>
      ))}
    </div>
  );
}

function CustomerFormModal({
  onClose,
  onSuccess,
  customer,
}: {
  onClose(): void;
  onSuccess(): void;
  customer?: any;
}) {
  const [form, setForm] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    password: "",
    companyName: customer?.customerProfile?.companyName || "",
    npwp: customer?.customerProfile?.npwp || "",
    creditLimit: customer?.customerProfile?.creditLimit || 0,
    paymentTerms: customer?.customerProfile?.paymentTerms || "NET30",
  });
  const [loading, setLoad] = useState(false);

  const inp = (field: string, type = "text") => ({
    type,
    value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value })),
    className:
      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoad(true);
    try {
      if (customer) {
        await client.patch(`/api/customers/${customer.id}`, form);
        toast.success("Pelanggan berhasil diperbarui.");
      } else {
        await client.post("/api/customers", form);
        toast.success("Pelanggan berhasil dibuat.");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoad(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {customer ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-xs font-medium">Nama *</Label>
              <Input {...inp("name")} required />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium">Email *</Label>
              <Input {...inp("email", "email")} required={!customer} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-xs font-medium">Telepon</Label>
              <Input {...inp("phone", "tel")} />
            </div>
            {!customer && (
              <div>
                <Label className="mb-1 block text-xs font-medium">
                  Password *
                </Label>
                <Input {...inp("password", "password")} required={!customer} />
              </div>
            )}
          </div>
          <hr className="my-2" />
          <h3 className="font-medium text-sm text-muted-foreground">
            Informasi Perusahaan
          </h3>
          <div>
            <Label className="mb-1 block text-xs font-medium">
              Nama Perusahaan
            </Label>
            <Input {...inp("companyName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-xs font-medium">NPWP</Label>
              <Input {...inp("npwp")} placeholder="00.000.000.0-000.000" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium">
                Batas Kredit
              </Label>
              <Input {...inp("creditLimit", "number")} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium">
              Terms Pembayaran
            </Label>
            <select
              value={form.paymentTerms}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentTerms: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="NET7">NET 7 Hari</option>
              <option value="NET14">NET 14 Hari</option>
              <option value="NET30">NET 30 Hari</option>
              <option value="NET60">NET 60 Hari</option>
              <option value="COD">COD</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
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
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
