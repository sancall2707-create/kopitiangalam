import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateOrder } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerName: z.string().min(1, "Nama wajib diisi"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tableNumber = params.get("table");

  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    if (items.length === 0) {
      toast({ title: "Keranjang kosong", variant: "destructive" });
      return;
    }

    createOrder.mutate(
      {
        data: {
          customerName: values.customerName,
          tableNumber: tableNumber ?? null,
          orderType: tableNumber ? "dine_in" : "takeaway",
          notes: values.notes ?? null,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          setLocation(`/order/${order.orderNumber}`);
        },
        onError: () => {
          toast({ title: "Gagal membuat pesanan", description: "Silakan coba lagi", variant: "destructive" });
        },
      }
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p style={{ color: "hsl(24,10%,40%)" }}>Keranjang kosong</p>
        <Button className="mt-4" onClick={() => setLocation("/menu")}>Ke Menu</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b shadow-sm"
        style={{ background: "hsl(40,33%,98%)", borderColor: "hsl(35,25%,85%)" }}>
        <button
          data-testid="button-back"
          onClick={() => setLocation(`/cart${tableNumber ? `?table=${tableNumber}` : ""}`)}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "hsl(24,10%,20%)" }} />
        </button>
        <h1 className="font-bold text-lg" style={{ color: "hsl(24,10%,10%)" }}>Checkout</h1>
      </div>

      <div className="px-4 py-5 pb-32">
        {/* Order info */}
        <div className="rounded-2xl border p-4 mb-5"
          style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
          <h2 className="font-semibold text-base mb-3" style={{ color: "hsl(24,10%,10%)" }}>
            Info Pesanan
          </h2>
          <div className="flex gap-3 text-sm">
            <div className="flex-1 rounded-xl p-3 text-center"
              style={{ background: tableNumber ? "hsl(24,35%,25%)" : "hsl(35,35%,90%)" }}>
              <p className="font-bold" style={{ color: tableNumber ? "hsl(40,33%,98%)" : "hsl(24,10%,50%)" }}>
                {tableNumber ? `Meja ${tableNumber}` : "Dine In"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: tableNumber ? "hsl(35,45%,70%)" : "hsl(24,10%,60%)" }}>
                {tableNumber ? "Dine In" : "-"}
              </p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center"
              style={{ background: !tableNumber ? "hsl(24,35%,25%)" : "hsl(35,35%,90%)" }}>
              <p className="font-bold" style={{ color: !tableNumber ? "hsl(40,33%,98%)" : "hsl(24,10%,50%)" }}>
                Takeaway
              </p>
              <p className="text-xs mt-0.5" style={{ color: !tableNumber ? "hsl(35,45%,70%)" : "hsl(24,10%,60%)" }}>
                {!tableNumber ? "Aktif" : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-2xl border p-4" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
              <h2 className="font-semibold text-base mb-4" style={{ color: "hsl(24,10%,10%)" }}>Detail Pemesan</h2>
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "hsl(24,10%,30%)" }}>Nama</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-customer-name"
                        placeholder="Masukkan nama Anda"
                        className="rounded-xl h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel style={{ color: "hsl(24,10%,30%)" }}>Catatan (opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="input-notes"
                        placeholder="Contoh: tanpa gula, extra shot..."
                        className="rounded-xl resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Order summary */}
            <div className="rounded-2xl border p-4" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
              <h2 className="font-semibold text-base mb-3" style={{ color: "hsl(24,10%,10%)" }}>Ringkasan Pesanan</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span style={{ color: "hsl(24,10%,30%)" }}>
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium" style={{ color: "hsl(24,10%,10%)" }}>
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold">
                <span style={{ color: "hsl(24,10%,10%)" }}>Total</span>
                <span style={{ color: "hsl(35,90%,40%)" }}>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                data-testid="button-submit-order"
                type="submit"
                disabled={createOrder.isPending}
                className="w-full h-13 rounded-xl font-semibold text-base"
                style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
              >
                {createOrder.isPending ? "Memproses..." : "Buat Pesanan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
