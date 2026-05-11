import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Coffee } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tableNumber = params.get("table");

  const { items, updateQuantity, removeFromCart, total } = useCart();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b shadow-sm"
        style={{ background: "hsl(40,33%,98%)", borderColor: "hsl(35,25%,85%)" }}>
        <button
          data-testid="button-back"
          onClick={() => setLocation(`/menu${tableNumber ? `?table=${tableNumber}` : ""}`)}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "hsl(24,10%,20%)" }} />
        </button>
        <h1 className="font-bold text-lg" style={{ color: "hsl(24,10%,10%)" }}>Keranjang</h1>
        {items.length > 0 && (
          <span className="ml-auto text-sm" style={{ color: "hsl(24,10%,50%)" }}>
            {items.reduce((s, i) => s + i.quantity, 0)} item
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: "hsl(35,35%,90%)" }}>
            <Coffee className="w-10 h-10" style={{ color: "hsl(24,35%,50%)" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(24,10%,15%)" }}>Keranjang kosong</h2>
          <p className="text-sm mb-8" style={{ color: "hsl(24,10%,50%)" }}>
            Belum ada item yang ditambahkan
          </p>
          <Button
            data-testid="button-browse-menu"
            onClick={() => setLocation(`/menu${tableNumber ? `?table=${tableNumber}` : ""}`)}
            className="rounded-xl font-semibold"
            style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Lihat Menu
          </Button>
        </div>
      ) : (
        <>
          <div className="px-4 py-4 space-y-3 pb-48">
            {items.map((item) => (
              <div
                key={item.product.id}
                data-testid={`card-cart-item-${item.product.id}`}
                className="rounded-2xl p-4 flex gap-4 border"
                style={{ background: "hsl(40,33%,98%)", borderColor: "hsl(35,25%,85%)" }}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ background: "hsl(35,35%,88%)" }}>
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="w-7 h-7" style={{ color: "hsl(24,35%,50%)" }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug mb-1 truncate" style={{ color: "hsl(24,10%,10%)" }}>
                    {item.product.name}
                  </p>
                  <p className="text-sm font-bold mb-3" style={{ color: "hsl(35,90%,40%)" }}>
                    Rp {item.product.price.toLocaleString("id-ID")}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`button-decrease-${item.product.id}`}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border"
                        style={{ borderColor: "hsl(35,25%,80%)" }}
                      >
                        <Minus className="w-3 h-3" style={{ color: "hsl(24,10%,30%)" }} />
                      </button>
                      <span
                        data-testid={`text-qty-${item.product.id}`}
                        className="w-7 text-center font-bold text-sm"
                        style={{ color: "hsl(24,10%,10%)" }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        data-testid={`button-increase-${item.product.id}`}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(24,35%,25%)", color: "white" }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-sm font-bold" style={{ color: "hsl(24,10%,10%)" }}>
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <button
                  data-testid={`button-remove-${item.product.id}`}
                  onClick={() => removeFromCart(item.product.id)}
                  className="self-start p-1"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "hsl(0,84%,60%)" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Sticky checkout bar */}
          <div className="fixed bottom-0 left-0 right-0 border-t shadow-2xl px-4 py-5"
            style={{ background: "hsl(40,33%,98%)", borderColor: "hsl(35,25%,85%)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium" style={{ color: "hsl(24,10%,40%)" }}>Total</span>
              <span className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
            <Button
              data-testid="button-checkout"
              onClick={() => setLocation(`/checkout${tableNumber ? `?table=${tableNumber}` : ""}`)}
              className="w-full h-13 rounded-xl font-semibold text-base"
              style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
            >
              Lanjut ke Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
