import { useLocation, Link } from "wouter";
import { LayoutDashboard, ShoppingBag, Package, Tag, Table, LogOut, Coffee, Menu, X } from "lucide-react";
import { useState } from "react";
import { removeAuthToken } from "@/lib/auth";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { path: "/admin/products", label: "Produk", icon: Package },
  { path: "/admin/categories", label: "Kategori", icon: Tag },
  { path: "/admin/tables", label: "Meja", icon: Table },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    removeAuthToken();
    setLocation("/admin/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(35,20%,96%)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:relative lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(24,35%,18%)" }}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "hsl(24,30%,25%)" }}>
          <div className="p-1.5 rounded-lg" style={{ background: "hsl(35,90%,50%)" }}>
            <Coffee className="w-4 h-4" style={{ color: "hsl(24,10%,10%)" }} />
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: "hsl(40,33%,98%)" }}>Kopi Tiang Alam</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(35,30%,55%)" }}>Admin Panel</p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" style={{ color: "hsl(35,30%,60%)" }} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isActive ? "hsl(35,90%,50%)" : "transparent",
                  color: isActive ? "hsl(24,10%,10%)" : "hsl(35,30%,65%)",
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(24,30%,25%)" }}>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors hover:opacity-80"
            style={{ color: "hsl(0,70%,65%)" }}
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b lg:hidden"
          style={{ background: "hsl(24,35%,18%)", borderColor: "hsl(24,30%,25%)" }}
        >
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" style={{ color: "hsl(40,33%,90%)" }} />
          </button>
          <span className="font-semibold text-sm" style={{ color: "hsl(40,33%,98%)" }}>
            {NAV_ITEMS.find((n) => n.path === location)?.label ?? "Admin"}
          </span>
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
