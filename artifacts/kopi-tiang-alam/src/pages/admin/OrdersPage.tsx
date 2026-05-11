import { useState } from "react";
import {
  useListAdminOrders,
  useUpdateOrderStatus,
  getListAdminOrdersQueryKey,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";

type Order = NonNullable<ReturnType<typeof useListAdminOrders>["data"]>[number];

const ALL_STATUSES = ["", "pending", "processing", "preparing", "ready", "completed", "cancelled"] as const;
const STATUS_LABELS: Record<string, string> = {
  "": "Semua",
  pending: "Menunggu",
  processing: "Diproses",
  preparing: "Dibuat",
  ready: "Siap",
  completed: "Selesai",
  cancelled: "Batal",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "hsl(35,90%,90%)", text: "hsl(35,80%,35%)" },
  processing: { bg: "hsl(210,80%,90%)", text: "hsl(210,70%,40%)" },
  preparing: { bg: "hsl(270,70%,90%)", text: "hsl(270,60%,40%)" },
  ready: { bg: "hsl(145,65%,85%)", text: "hsl(145,55%,30%)" },
  completed: { bg: "hsl(145,65%,85%)", text: "hsl(145,55%,30%)" },
  cancelled: { bg: "hsl(0,84%,90%)", text: "hsl(0,70%,40%)" },
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useListAdminOrders(
    statusFilter ? { status: statusFilter } : {},
    { query: { queryKey: getListAdminOrdersQueryKey(statusFilter ? { status: statusFilter } : {}) } }
  );

  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  function handleStatusChange(orderId: number, status: string) {
    updateStatus.mutate(
      { id: orderId, data: { status: status as Order["status"] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey({ status: statusFilter }) });
          if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev) => prev ? { ...prev, status: status as Order["status"] } : null);
          }
        },
      }
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>Manajemen Pesanan</h1>
          <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Kelola semua pesanan masuk</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              data-testid={`filter-${s || "all"}`}
              onClick={() => setStatusFilter(s)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: statusFilter === s ? "hsl(24,35%,25%)" : "white",
                color: statusFilter === s ? "hsl(40,33%,98%)" : "hsl(24,10%,40%)",
                border: "1px solid",
                borderColor: statusFilter === s ? "transparent" : "hsl(35,25%,85%)",
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : !orders?.length ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Tidak ada pesanan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const colors = STATUS_COLORS[order.status] || { bg: "hsl(35,25%,88%)", text: "hsl(24,10%,40%)" };
              return (
                <div
                  key={order.id}
                  data-testid={`card-order-${order.id}`}
                  className="rounded-2xl border p-4"
                  style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>
                          {order.orderNumber}
                        </p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: "hsl(24,10%,45%)" }}>
                        {order.customerName}
                        {order.tableNumber ? ` — Meja ${order.tableNumber}` : " — Takeaway"}
                        {" · "}
                        {order.items?.length ?? 0} item
                      </p>
                      <p className="text-sm font-bold" style={{ color: "hsl(35,90%,40%)" }}>
                        Rp {order.totalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        data-testid={`button-detail-${order.id}`}
                        onClick={() => setSelectedOrder(order)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{ borderColor: "hsl(35,25%,85%)" }}
                      >
                        <Eye className="w-4 h-4" style={{ color: "hsl(24,10%,40%)" }} />
                      </button>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs rounded-lg" data-testid={`select-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["pending","processing","preparing","ready","completed","cancelled"] as const).map((v) => (
                            <SelectItem key={v} value={v}>{STATUS_LABELS[v]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Nomor</p>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Status</p>
                  <p className="font-semibold">{STATUS_LABELS[selectedOrder.status]}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Nama</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Tipe</p>
                  <p className="font-semibold">
                    {selectedOrder.orderType === "dine_in" ? `Dine In${selectedOrder.tableNumber ? ` (Meja ${selectedOrder.tableNumber})` : ""}` : "Takeaway"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.productName} x{item.quantity}</span>
                    <span className="font-medium">Rp {item.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              {selectedOrder.notes && (
                <>
                  <Separator />
                  <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Catatan: {selectedOrder.notes}</p>
                </>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span style={{ color: "hsl(35,90%,40%)" }}>Rp {selectedOrder.totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
