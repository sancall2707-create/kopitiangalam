import { useLocation } from "wouter";
import { Coffee, ShoppingBag, Star, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, hsl(24,35%,15%) 0%, hsl(24,35%,25%) 60%, hsl(35,45%,30%) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, hsl(35,90%,50%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(45,70%,60%) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 rounded-full" style={{ background: "hsl(35,90%,50%)" }}>
              <Coffee className="w-8 h-8" style={{ color: "hsl(24,10%,10%)" }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "hsl(40,33%,98%)" }}>
            Kopi Tiang Alam
          </h1>
          <p className="text-lg mb-2" style={{ color: "hsl(35,45%,75%)" }}>
            Warung kopi modern dengan cita rasa autentik
          </p>
          <p className="text-sm mb-10" style={{ color: "hsl(35,30%,60%)" }}>
            Pesan langsung dari meja Anda, tanpa menunggu
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              data-testid="button-dine-in"
              size="lg"
              className="text-base font-semibold h-14 px-8 rounded-xl shadow-lg"
              style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
              onClick={() => setLocation("/menu")}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Dine In
            </Button>
            <Button
              data-testid="button-takeaway"
              size="lg"
              variant="outline"
              className="text-base font-semibold h-14 px-8 rounded-xl"
              style={{ borderColor: "hsl(35,45%,65%)", color: "hsl(40,33%,98%)", background: "transparent" }}
              onClick={() => setLocation("/menu")}
            >
              <Coffee className="w-5 h-5 mr-2" />
              Takeaway
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "linear-gradient(to top, hsl(40,33%,98%), transparent)",
          }}
        />
      </div>

      {/* Features */}
      <div className="py-14 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Clock className="w-6 h-6" />, title: "Cepat & Mudah", desc: "Pesan dalam hitungan menit langsung dari ponsel Anda" },
            { icon: <Star className="w-6 h-6" />, title: "Kopi Pilihan", desc: "Biji kopi premium dari petani lokal Nusantara" },
            { icon: <MapPin className="w-6 h-6" />, title: "Lacak Pesanan", desc: "Pantau status pesanan Anda secara real-time" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-6 border" style={{ borderColor: "hsl(35,25%,85%)", background: "hsl(40,33%,98%)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "hsl(35,45%,88%)", color: "hsl(24,35%,25%)" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-base mb-1" style={{ color: "hsl(24,10%,10%)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(24,10%,40%)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mx-4 mb-10 rounded-2xl p-6 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, hsl(24,35%,20%) 0%, hsl(35,60%,35%) 100%)" }}>
        <div className="relative z-10">
          <Badge className="mb-3 text-xs font-semibold px-3 py-1" style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}>
            Promo Hari Ini
          </Badge>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(40,33%,98%)" }}>
            Happy Hours
          </h2>
          <p className="text-sm mb-4" style={{ color: "hsl(35,35%,75%)" }}>
            Diskon 20% untuk semua minuman kopi pukul 14.00 – 16.00
          </p>
          <Button
            data-testid="button-promo-order"
            size="sm"
            className="rounded-lg font-semibold"
            style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
            onClick={() => setLocation("/menu")}
          >
            Pesan Sekarang
          </Button>
        </div>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10"
          style={{ background: "hsl(35,90%,70%)" }} />
        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full opacity-10"
          style={{ background: "hsl(45,80%,70%)" }} />
      </div>

      {/* Categories preview */}
      <div className="px-4 pb-12">
        <h2 className="text-xl font-bold mb-5 px-2" style={{ color: "hsl(24,10%,10%)" }}>Kategori Menu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "Coffee", emoji: "☕", color: "hsl(24,35%,25%)" },
            { name: "Non Coffee", emoji: "🥤", color: "hsl(185,50%,35%)" },
            { name: "Food", emoji: "🍜", color: "hsl(15,55%,40%)" },
            { name: "Snacks", emoji: "🍪", color: "hsl(35,70%,40%)" },
            { name: "Dessert", emoji: "🍮", color: "hsl(45,65%,42%)" },
          ].map((cat) => (
            <button
              key={cat.name}
              data-testid={`button-category-${cat.name.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => setLocation("/menu")}
              className="rounded-xl p-4 text-left transition-transform active:scale-95 hover:opacity-90"
              style={{ background: cat.color, color: "hsl(40,33%,97%)" }}
            >
              <div className="text-2xl mb-2">{cat.emoji}</div>
              <div className="text-sm font-semibold">{cat.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-8 px-6 text-center" style={{ borderColor: "hsl(35,25%,85%)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coffee className="w-4 h-4" style={{ color: "hsl(35,90%,50%)" }} />
          <span className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>Kopi Tiang Alam</span>
        </div>
        <p className="text-xs" style={{ color: "hsl(24,10%,50%)" }}>Menikmati kopi terbaik Nusantara</p>
      </div>
    </div>
  );
}
