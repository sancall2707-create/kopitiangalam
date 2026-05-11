import { useRoute, useLocation } from "wouter";
import { Home, Coffee, CheckCircle2, Clock, ChefHat, BellRing, Package } from "lucide-react";
import { useGetOrderByNumber, getGetOrderByNumberQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_STEPS = [
  { key: "pending", label: "Menunggu", icon: Clock },
  { key: "processing", label: "Diproses", icon: BellRing },
  { key: "preparing", label: "Dibuat", icon: ChefHat },
  { key: "ready", label: "Siap", icon: Package },
  { key: "completed", label: "Selesai", icon: CheckCircle2 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(35,90%,50%)",
  processing: "hsl(210,80%,55%)",
  preparing: "hsl(270,70%,55%)",
  ready: "hsl(145,65%,42%)",
  completed: "hsl(145,65%,42%)",
  cancelled: "hsl(0,84%,60%)",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Konfirmasi",
  processing: "Sedang Diproses",
  preparing: "Sedang Dibuat",
  ready: "Siap Diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default function OrderTrackingPage() {
  const [, params] = useRoute("/order/:orderNumber");
  const [, setLocation] = useLocation();
  const orderNumber = params?.orderNumber ?? "";

  const { data: order, isLoading } = useGetOrderByNumber(orderNumber, {
    query: {
      enabled: !!orderNumber,
      queryKey: getGetOrderByNumberQueryKey(orderNumber),
      refetchInterval: 10_000,
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Coffee className="w-12 h-12 mb-4" style={{ color: "hsl(35,25%,70%)" }} />
        <p className="font-semibold mb-2" style={{ color: "hsl(24,10%,20%)" }}>Pesanan tidak ditemukan</p>
        <Button onClick={() => setLocation("/")} className="mt-4">Kembali ke Beranda</Button>
      </div>
    );
  }

  const currentStatusIndex = order.status === "cancelled"
    ? -1
    : STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-8 text-center"
        style={{ background: "linear-gradient(160deg, hsl(24,35%,18%) 0%, hsl(24,35%,28%) 100%)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Coffee className="w-5 h-5" style={{ color: "hsl(35,90%,50%)" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(35,45%,70%)" }}>Kopi Tiang Alam</span>
        </div>
        <p className="text-xs mb-1" style={{ color: "hsl(35,30%,60%)" }}>Nomor Pesanan</p>
        <h1 className="text-2xl font-bold tracking-widest mb-3" style={{ color: "hsl(40,33%,98%)" }}>
          {order.orderNumber}
        </h1>
        <Badge
          className="text-sm px-4 py-1.5 font-semibold rounded-full"
          style={{
            background: STATUS_COLORS[order.status] || "hsl(35,25%,60%)",
            color: "white",
          }}
          data-testid="badge-order-status"
        >
          {STATUS_LABELS[order.status] || order.status}
        </Badge>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Customer info */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs mb-1" style={{ color: "hsl(24,10%,50%)" }}>Nama</p>
              <p className="font-semibold" style={{ color: "hsl(24,10%,10%)" }}>{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "hsl(24,10%,50%)" }}>Tipe</p>
              <p className="font-semibold" style={{ color: "hsl(24,10%,10%)" }}>
                {order.orderType === "dine_in" ? `Dine In${order.tableNumber ? ` — Meja ${order.tableNumber}` : ""}` : "Takeaway"}
              </p>
            </div>
          </div>
        </div>

        {/* Status stepper */}
        {order.status !== "cancelled" ? (
          <div className="rounded-2xl border p-4" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: "hsl(24,10%,20%)" }}>Status Pesanan</h2>
            <div className="space-y-3">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentStatusIndex;
                const isDone = i < currentStatusIndex;
                const isFuture = i > currentStatusIndex;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: isDone
                          ? "hsl(145,65%,42%)"
                          : isActive
                          ? "hsl(35,90%,50%)"
                          : "hsl(35,25%,88%)",
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{
                          color: isDone || isActive ? "white" : "hsl(24,10%,50%)",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: isFuture ? "hsl(24,10%,60%)" : "hsl(24,10%,10%)",
                        }}
                      >
                        {step.label}
                      </p>
                    </div>
                    {isActive && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}>
                        Sekarang
                      </span>
                    )}
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(145,65%,42%)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "hsl(0,84%,85%)", background: "hsl(0,84%,97%)" }}>
            <p className="font-semibold" style={{ color: "hsl(0,84%,45%)" }}>Pesanan Dibatalkan</p>
            <p className="text-sm mt-1" style={{ color: "hsl(0,50%,55%)" }}>Pesanan ini telah dibatalkan</p>
          </div>
        )}

        {/* Order items */}
        <div className="rounded-2xl border p-4" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "hsl(24,10%,20%)" }}>Detail Pesanan</h2>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span style={{ color: "hsl(24,10%,30%)" }}>
                  {item.productName} x{item.quantity}
                </span>
                <span className="font-medium" style={{ color: "hsl(24,10%,10%)" }}>
                  Rp {item.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
          {order.notes && (
            <>
              <Separator className="my-2" />
              <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>
                Catatan: {order.notes}
              </p>
            </>
          )}
          <Separator className="my-3" />
          <div className="flex justify-between font-bold">
            <span style={{ color: "hsl(24,10%,10%)" }}>Total</span>
            <span style={{ color: "hsl(35,90%,40%)" }}>
              Rp {order.totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "hsl(24,10%,60%)" }}>
          Halaman ini diperbarui otomatis setiap 10 detik
        </p>

        <Button
          data-testid="button-back-home"
          variant="outline"
          onClick={() => setLocation("/")}
          className="w-full rounded-xl"
        >
          <Home className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
