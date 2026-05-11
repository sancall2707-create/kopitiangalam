import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import MenuPage from "@/pages/MenuPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import AdminLoginPage from "@/pages/admin/LoginPage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminOrdersPage from "@/pages/admin/OrdersPage";
import AdminProductsPage from "@/pages/admin/ProductsPage";
import AdminCategoriesPage from "@/pages/admin/CategoriesPage";
import AdminTablesPage from "@/pages/admin/TablesPage";

setAuthTokenGetter(() => getAuthToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = getAuthToken();
  if (!token) return <Redirect to="/admin/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order/:orderNumber" component={OrderTrackingPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboardPage} />}
      </Route>
      <Route path="/admin/orders">
        {() => <ProtectedRoute component={AdminOrdersPage} />}
      </Route>
      <Route path="/admin/products">
        {() => <ProtectedRoute component={AdminProductsPage} />}
      </Route>
      <Route path="/admin/categories">
        {() => <ProtectedRoute component={AdminCategoriesPage} />}
      </Route>
      <Route path="/admin/tables">
        {() => <ProtectedRoute component={AdminTablesPage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
