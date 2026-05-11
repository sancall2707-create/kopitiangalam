import { useState } from "react";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Category = NonNullable<ReturnType<typeof useListCategories>["data"]>[number];

const schema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "" });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    form.reset({ name: cat.name });
    setDialogOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateCategory.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            setDialogOpen(false);
            toast({ title: "Kategori diperbarui" });
          },
        }
      );
    } else {
      createCategory.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            setDialogOpen(false);
            toast({ title: "Kategori ditambahkan" });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Hapus kategori ini?")) return;
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Kategori dihapus" });
        },
      }
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>Manajemen Kategori</h1>
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Kelola kategori menu</p>
          </div>
          <Button
            data-testid="button-add-category"
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
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
        ) : !categories?.length ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
            <Tag className="w-10 h-10 mx-auto mb-2" style={{ color: "hsl(35,25%,70%)" }} />
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Belum ada kategori</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                data-testid={`card-category-${cat.id}`}
                className="rounded-2xl border p-4 flex items-center gap-4"
                style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(35,45%,90%)" }}>
                  <Tag className="w-5 h-5" style={{ color: "hsl(24,35%,35%)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>{cat.name}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    data-testid={`button-edit-${cat.id}`}
                    onClick={() => openEdit(cat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: "hsl(35,25%,85%)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(24,10%,40%)" }} />
                  </button>
                  <button
                    data-testid={`button-delete-${cat.id}`}
                    onClick={() => handleDelete(cat.id)}
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
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input data-testid="input-category-name" placeholder="Contoh: Coffee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                data-testid="button-save-category"
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
                className="w-full rounded-xl font-semibold"
                style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
              >
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
