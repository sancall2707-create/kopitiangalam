import { useState } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart, Coffee } from "lucide-react";
import { useGetProduct } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tableNumber = searchParams.get("table");

  const id = parseInt(params?.id ?? "", 10);
  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: ["getProduct", id] },
  });

  const { addToCart, items: cartItems } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  function handleAdd() {
    if (!product) return;
    addToCart(product, qty);
    toast({ title: "Ditambahkan ke keranjang", description: `${product.name} x${qty}` });
    setQty(1);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-square" />
        <div className="p-6">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-1/3 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "hsl(24,10%,40%)" }}>Produk tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Image */}
      <div className="relative" style={{ background: "hsl(35,35%,88%)" }}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
        ) : (
          <div className="aspect-square flex items-center justify-center">
            <Coffee className="w-20 h-20" style={{ color: "hsl(24,35%,50%)" }} />
          </div>
        )}
        {/* Back button overlay */}
        <button
          data-testid="button-back"
          onClick={() => setLocation(`/menu${tableNumber ? `?table=${tableNumber}` : ""}`)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "hsl(24,35%,25%)" }} />
        </button>
        {/* Cart button */}
        <button
          data-testid="button-cart-header"
          onClick={() => setLocation(`/cart${tableNumber ? `?table=${tableNumber}` : ""}`)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-md relative"
          style={{ background: "rgba(255,255,255,0.9)" }}
        >
          <ShoppingCart className="w-5 h-5" style={{ color: "hsl(24,35%,25%)" }} />
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 pb-32">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "hsl(24,10%,10%)" }}>
            {product.name}
          </h1>
          {product.categoryName && (
            <Badge variant="secondary" className="shrink-0 mt-1">{product.categoryName}</Badge>
          )}
        </div>

        <p className="text-2xl font-bold mb-4" style={{ color: "hsl(35,90%,40%)" }}>
          Rp {product.price.toLocaleString("id-ID")}
        </p>

        {product.description && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(24,10%,40%)" }}>
            {product.description}
          </p>
        )}

        {(product.stock ?? 0) === 0 && (
          <div className="rounded-xl p-3 mb-4 text-sm font-medium" style={{ background: "hsl(0,84%,95%)", color: "hsl(0,84%,45%)" }}>
            Stok habis — tidak tersedia saat ini
          </div>
        )}

        {(product.stock ?? 0) > 0 && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "hsl(35,45%,93%)", color: "hsl(24,10%,40%)" }}>
            Stok tersedia: {product.stock}
          </div>
        )}
      </div>

      {/* Add to cart bar */}
      {(product.stock ?? 0) > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t shadow-2xl" style={{ background: "hsl(40,33%,98%)", borderColor: "hsl(35,25%,85%)" }}>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm font-medium" style={{ color: "hsl(24,10%,30%)" }}>Jumlah</span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                data-testid="button-decrease-qty"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center border"
                style={{ borderColor: "hsl(35,25%,80%)" }}
              >
                <Minus className="w-4 h-4" style={{ color: "hsl(24,10%,30%)" }} />
              </button>
              <span className="w-8 text-center font-bold text-lg" data-testid="text-qty" style={{ color: "hsl(24,10%,10%)" }}>
                {qty}
              </span>
              <button
                data-testid="button-increase-qty"
                onClick={() => setQty((q) => Math.min(product.stock ?? 0, q + 1))}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "hsl(24,35%,25%)", color: "white" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button
            data-testid="button-add-to-cart"
            onClick={handleAdd}
            className="w-full h-13 rounded-xl font-semibold text-base"
            style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Tambah — Rp {(product.price * qty).toLocaleString("id-ID")}
          </Button>
        </div>
      )}
    </div>
  );
}
