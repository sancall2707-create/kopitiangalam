import { useState } from "react";
import {
  useListAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListCategories,
  getListAdminProductsQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Coffee } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  categoryId: z.coerce.number().nullable(),
  description: z.string().nullable(),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  image: z.string().nullable(),
  stock: z.coerce.number().int().min(0),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

export default function AdminProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products, isLoading } = useListAdminProducts();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", categoryId: null, description: null, price: 0, image: null, stock: 0, status: "active" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", categoryId: null, description: null, price: 0, image: null, stock: 0, status: "active" });
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    form.reset({
      name: p.name,
      categoryId: p.categoryId ?? null,
      description: p.description ?? null,
      price: p.price,
      image: p.image ?? null,
      stock: p.stock,
      status: p.status as "active" | "inactive",
    });
    setDialogOpen(true);
  }

  function onSubmit(values: FormValues) {
    const data = { ...values, price: values.price, categoryId: values.categoryId ?? null, description: values.description ?? null, image: values.image ?? null };
    if (editing) {
      updateProduct.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Produk diperbarui" });
          },
        }
      );
    } else {
      createProduct.mutate(
        { data: { ...data, status: data.status ?? "active" } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Produk ditambahkan" });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          toast({ title: "Produk dihapus" });
        },
      }
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>Manajemen Produk</h1>
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Kelola menu dan stok produk</p>
          </div>
          <Button
            data-testid="button-add-product"
            onClick={openCreate}
            size="sm"
            className="rounded-xl gap-1.5 font-medium"
            style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
          >
            <Plus className="w-4 h-4" />
            Tambah
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : !products?.length ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Belum ada produk</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                data-testid={`card-product-${p.id}`}
                className="rounded-2xl border p-4 flex items-center gap-4"
                style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: "hsl(35,35%,88%)" }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="w-5 h-5" style={{ color: "hsl(24,35%,50%)" }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "hsl(35,90%,40%)" }}>Rp {p.price.toLocaleString("id-ID")}</span>
                    <span className="text-xs" style={{ color: "hsl(24,10%,55%)" }}>· Stok: {p.stock}</span>
                    {p.categoryName && <Badge variant="secondary" className="text-xs h-4 px-1">{p.categoryName}</Badge>}
                    <Badge
                      className="text-xs h-4 px-1"
                      style={{
                        background: p.status === "active" ? "hsl(145,65%,85%)" : "hsl(0,0%,88%)",
                        color: p.status === "active" ? "hsl(145,55%,30%)" : "hsl(24,10%,45%)",
                      }}
                    >
                      {p.status === "active" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    data-testid={`button-edit-${p.id}`}
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: "hsl(35,25%,85%)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(24,10%,40%)" }} />
                  </button>
                  <button
                    data-testid={`button-delete-${p.id}`}
                    onClick={() => handleDelete(p.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: "hsl(35,25%,85%)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(0,84%,60%)" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl><Input data-testid="input-product-name" placeholder="Nama produk" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-description"
                      placeholder="Deskripsi produk"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga (Rp)</FormLabel>
                  <FormControl><Input data-testid="input-price" type="number" placeholder="25000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-image"
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl><Input data-testid="input-stock" type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <Button
                data-testid="button-save-product"
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
                className="w-full rounded-xl font-semibold"
                style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
              >
                {editing ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
