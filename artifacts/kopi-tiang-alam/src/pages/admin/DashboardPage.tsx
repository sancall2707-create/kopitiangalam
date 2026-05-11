import { useGetAdminDashboard, useListAdminOrders, useUpdateOrderStatus, getListAdminOrdersQueryKey, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { ShoppingBag, TrendingUp, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  preparing: "Dibuat",
  ready: "Siap",
  completed: "Selesai",
  cancelled: "Batal",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(35,90%,50%)",
  processing: "hsl(210,80%,55%)",
  preparing: "hsl(270,70%,55%)",
  ready: "hsl(145,65%,42%)",
  completed: "hsl(145,65%,42%)",
  cancelled: "hsl(0,84%,60%)",
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>, label: string, value: string | number, color: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: "hsl(24,10%,10%)" }}>{value}</p>
      <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetAdminDashboard();
  const { data: activeOrders } = useListAdminOrders(
    { status: "pending" },
    { query: { queryKey: getListAdminOrdersQueryKey({ status: "pending" }) } }
  );
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  function handleStatusChange(orderId: number, status: string) {
    updateStatus.mutate(
      { id: orderId, data: { status: status as "pending" | "processing" | "preparing" | "ready" | "completed" | "cancelled" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey({ status: "pending" }) });
        },
      }
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>Dashboard</h1>
          <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Ringkasan aktivitas hari ini</p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard icon={ShoppingBag} label="Total Pesanan" value={stats?.totalOrders ?? 0} color="hsl(210,80%,55%)" />
            <StatCard icon={Activity} label="Pesanan Aktif" value={stats?.activeOrders ?? 0} color="hsl(35,90%,50%)" />
            <StatCard icon={TrendingUp} label="Penjualan Hari Ini" value={`Rp ${(stats?.dailySales ?? 0).toLocaleString("id-ID")}`} color="hsl(145,65%,42%)" />
          </div>
        )}

        {/* Chart */}
        {stats?.ordersByStatus && stats.ordersByStatus.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: "hsl(24,10%,15%)" }}>Pesanan per Status</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.ordersByStatus.map((s) => ({ ...s, label: STATUS_LABELS[s.status] || s.status }))}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(24,10%,50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(24,10%,50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(35,25%,85%)", fontSize: 12 }}
                />
                <Bar dataKey="count" fill="hsl(24,35%,25%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active orders */}
        <div className="rounded-2xl border p-4" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "hsl(24,10%,15%)" }}>Pesanan Menunggu</h2>
            {activeOrders && activeOrders.length > 0 && (
              <Badge style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}>
                {activeOrders.length}
              </Badge>
            )}
          </div>
          {!activeOrders || activeOrders.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(35,25%,70%)" }} />
                <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Tidak ada pesanan menunggu</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`card-order-${order.id}`}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border"
                  style={{ borderColor: "hsl(35,25%,90%)", background: "hsl(35,20%,98%)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>{order.orderNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(24,10%,50%)" }}>
                      {order.customerName} {order.tableNumber ? `— Meja ${order.tableNumber}` : "— Takeaway"}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: "hsl(35,90%,40%)" }}>
                      Rp {order.totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Select
                    defaultValue={order.status}
                    onValueChange={(v) => handleStatusChange(order.id, v)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs rounded-lg" data-testid={`select-status-${order.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
