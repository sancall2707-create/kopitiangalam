import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, ShoppingCart, ArrowLeft, Coffee } from "lucide-react";
import { useListCategories, useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tableNumber = params.get("table");

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const { items: cartItems } = useCart();

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: products, isLoading: prodsLoading } = useListProducts({
    categoryId: selectedCategory,
    search: searchQuery || undefined,
  }, {
    query: {
      queryKey: ["products", selectedCategory, searchQuery],
    }
  });

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 shadow-sm" style={{ background: "hsl(24,35%,25%)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" style={{ color: "hsl(40,33%,98%)" }} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base leading-none" style={{ color: "hsl(40,33%,98%)" }}>
              Menu
            </h1>
            {tableNumber && (
              <p className="text-xs mt-0.5" style={{ color: "hsl(35,45%,70%)" }}>
                Meja {tableNumber}
              </p>
            )}
          </div>
          <button
            data-testid="button-cart"
            onClick={() => setLocation(`/cart${tableNumber ? `?table=${tableNumber}` : ""}`)}
            className="relative p-2 rounded-xl"
            style={{ background: "hsl(35,90%,50%)" }}
          >
            <ShoppingCart className="w-5 h-5" style={{ color: "hsl(24,10%,10%)" }} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: "hsl(0,84%,60%)", color: "white" }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(35,30%,55%)" }} />
            <Input
              data-testid="input-search"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-0 text-sm h-10 rounded-xl"
              style={{ background: "hsl(24,35%,18%)", color: "hsl(40,33%,92%)" }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            data-testid="button-category-all"
            onClick={() => setSelectedCategory(undefined)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === undefined ? "text-[hsl(24,10%,10%)]" : "text-[hsl(35,45%,70%)]"}`}
            style={{
              background: selectedCategory === undefined ? "hsl(35,90%,50%)" : "hsl(24,35%,20%)",
            }}
          >
            Semua
          </button>
          {catsLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 h-7 w-20 rounded-full" style={{ background: "hsl(24,35%,20%)" }} />
          ))}
          {categories?.map((cat) => (
            <button
              key={cat.id}
              data-testid={`button-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors`}
              style={{
                background: selectedCategory === cat.id ? "hsl(35,90%,50%)" : "hsl(24,35%,20%)",
                color: selectedCategory === cat.id ? "hsl(24,10%,10%)" : "hsl(35,45%,70%)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 py-4 pb-24">
        {prodsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: "hsl(35,25%,85%)" }}>
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Coffee className="w-12 h-12 mb-4" style={{ color: "hsl(35,25%,70%)" }} />
            <p className="font-medium" style={{ color: "hsl(24,10%,40%)" }}>Menu tidak ditemukan</p>
            <p className="text-sm mt-1" style={{ color: "hsl(24,10%,60%)" }}>Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products?.map((product) => (
              <button
                key={product.id}
                data-testid={`card-product-${product.id}`}
                onClick={() => setLocation(`/product/${product.id}${tableNumber ? `?table=${tableNumber}` : ""}`)}
                className="rounded-2xl overflow-hidden border text-left transition-transform active:scale-95"
                style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}
              >
                <div className="aspect-square overflow-hidden" style={{ background: "hsl(35,35%,90%)" }}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="w-10 h-10" style={{ color: "hsl(24,35%,50%)" }} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm leading-snug mb-1 line-clamp-2" style={{ color: "hsl(24,10%,10%)" }}>
                    {product.name}
                  </p>
                  {product.categoryName && (
                    <Badge variant="secondary" className="text-xs mb-1 px-1.5 py-0">
                      {product.categoryName}
                    </Badge>
                  )}
                  <p className="font-bold text-sm" style={{ color: "hsl(35,90%,40%)" }}>
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                  {product.stock === 0 && (
                    <p className="text-xs mt-1" style={{ color: "hsl(0,84%,60%)" }}>Habis</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4">
          <Button
            data-testid="button-view-cart"
            onClick={() => setLocation(`/cart${tableNumber ? `?table=${tableNumber}` : ""}`)}
            className="w-full h-14 rounded-2xl font-semibold text-base shadow-xl"
            style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Lihat Keranjang ({cartCount} item)
          </Button>
        </div>
      )}
    </div>
  );
}
