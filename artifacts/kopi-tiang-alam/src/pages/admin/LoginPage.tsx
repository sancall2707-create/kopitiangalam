import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coffee, Lock, User } from "lucide-react";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAuthToken, getAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const schema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const adminLogin = useAdminLogin();

  useEffect(() => {
    if (getAuthToken()) setLocation("/admin");
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: FormValues) {
    adminLogin.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthToken(data.token);
          setLocation("/admin");
        },
        onError: () => {
          toast({ title: "Login gagal", description: "Username atau password salah", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, hsl(24,35%,12%) 0%, hsl(24,35%,22%) 100%)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "hsl(35,90%,50%)" }}>
            <Coffee className="w-8 h-8" style={{ color: "hsl(24,10%,10%)" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(40,33%,98%)" }}>Kopi Tiang Alam</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(35,30%,60%)" }}>Admin Panel</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-2xl" style={{ background: "hsl(24,35%,18%)", border: "1px solid hsl(24,30%,28%)" }}>
          <h2 className="font-semibold mb-5 text-base" style={{ color: "hsl(40,33%,95%)" }}>Masuk ke Dashboard</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "hsl(35,30%,65%)" }}>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(35,30%,55%)" }} />
                        <Input
                          data-testid="input-username"
                          placeholder="admin"
                          className="pl-9 h-11 rounded-xl border-0 text-sm"
                          style={{ background: "hsl(24,30%,25%)", color: "hsl(40,33%,95%)" }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "hsl(35,30%,65%)" }}>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(35,30%,55%)" }} />
                        <Input
                          data-testid="input-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 h-11 rounded-xl border-0 text-sm"
                          style={{ background: "hsl(24,30%,25%)", color: "hsl(40,33%,95%)" }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                data-testid="button-login"
                type="submit"
                disabled={adminLogin.isPending}
                className="w-full h-11 rounded-xl font-semibold mt-2"
                style={{ background: "hsl(35,90%,50%)", color: "hsl(24,10%,10%)" }}
              >
                {adminLogin.isPending ? "Masuk..." : "Masuk"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "hsl(35,20%,45%)" }}>
          Kopi Tiang Alam &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
