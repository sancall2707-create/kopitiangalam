import { useState } from "react";
import {
  useListTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  getListTablesQueryKey,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, QrCode, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import type { CoffeeTable } from "@workspace/api-client-react";

const schema = z.object({
  tableNumber: z.string().min(1, "Nomor meja wajib diisi"),
  status: z.enum(["available", "occupied"]),
});

type FormValues = z.infer<typeof schema>;

function QRDialog({ table, onClose }: { table: CoffeeTable; onClose: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `${origin}/menu?table=${table.tableNumber}`;

  function downloadQR() {
    const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `meja-${table.tableNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xs rounded-2xl text-center">
        <DialogHeader>
          <DialogTitle>QR Code — Meja {table.tableNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl border" style={{ borderColor: "hsl(35,25%,85%)" }}>
            <QRCodeCanvas
              id={`qr-${table.id}`}
              value={qrUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-xs break-all" style={{ color: "hsl(24,10%,50%)" }}>{qrUrl}</p>
          <Button
            data-testid="button-download-qr"
            onClick={downloadQR}
            size="sm"
            className="rounded-xl gap-1.5"
            style={{ background: "hsl(24,35%,25%)", color: "hsl(40,33%,98%)" }}
          >
            <Download className="w-4 h-4" />
            Download QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTablesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CoffeeTable | null>(null);
  const [qrTable, setQrTable] = useState<CoffeeTable | null>(null);

  const { data: tables, isLoading } = useListTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tableNumber: "", status: "available" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ tableNumber: "", status: "available" });
    setDialogOpen(true);
  }

  function openEdit(t: CoffeeTable) {
    setEditing(t);
    form.reset({ tableNumber: t.tableNumber, status: t.status as "available" | "occupied" });
    setDialogOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateTable.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
            setDialogOpen(false);
            toast({ title: "Meja diperbarui" });
          },
          onError: () => toast({ title: "Gagal memperbarui meja", variant: "destructive" }),
        }
      );
    } else {
      createTable.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
            setDialogOpen(false);
            toast({ title: "Meja ditambahkan" });
          },
          onError: () => toast({ title: "Gagal menambahkan meja", variant: "destructive" }),
        }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Hapus meja ini?")) return;
    deleteTable.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          toast({ title: "Meja dihapus" });
        },
      }
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(24,10%,10%)" }}>Manajemen Meja</h1>
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Kelola meja dan QR code</p>
          </div>
          <Button
            data-testid="button-add-table"
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
        ) : !tables?.length ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}>
            <QrCode className="w-10 h-10 mx-auto mb-2" style={{ color: "hsl(35,25%,70%)" }} />
            <p className="text-sm" style={{ color: "hsl(24,10%,50%)" }}>Belum ada meja</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tables.map((t) => (
              <div
                key={t.id}
                data-testid={`card-table-${t.id}`}
                className="rounded-2xl border p-4 flex items-center gap-4"
                style={{ background: "white", borderColor: "hsl(35,25%,88%)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(35,45%,90%)" }}>
                  <span className="font-bold text-sm" style={{ color: "hsl(24,35%,30%)" }}>{t.tableNumber}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: "hsl(24,10%,10%)" }}>Meja {t.tableNumber}</p>
                  <Badge
                    className="text-xs h-4 px-1.5 mt-0.5"
                    style={{
                      background: t.status === "available" ? "hsl(145,65%,85%)" : "hsl(35,90%,88%)",
                      color: t.status === "available" ? "hsl(145,55%,30%)" : "hsl(35,70%,35%)",
                    }}
                  >
                    {t.status === "available" ? "Tersedia" : "Terisi"}
                  </Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    data-testid={`button-qr-${t.id}`}
                    onClick={() => setQrTable(t)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: "hsl(35,25%,85%)" }}
                  >
                    <QrCode className="w-3.5 h-3.5" style={{ color: "hsl(24,35%,35%)" }} />
                  </button>
                  <button
                    data-testid={`button-edit-${t.id}`}
                    onClick={() => openEdit(t)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: "hsl(35,25%,85%)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(24,10%,40%)" }} />
                  </button>
                  <button
                    data-testid={`button-delete-${t.id}`}
                    onClick={() => handleDelete(t.id)}
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

      {/* QR Dialog */}
      {qrTable && <QRDialog table={qrTable} onClose={() => setQrTable(null)} />}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Meja" : "Tambah Meja"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="tableNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Meja</FormLabel>
                  <FormControl>
                    <Input data-testid="input-table-number" placeholder="01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-table-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="occupied">Terisi</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <Button
                data-testid="button-save-table"
                type="submit"
                disabled={createTable.isPending || updateTable.isPending}
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
