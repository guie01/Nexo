"use client";

import { useState, useMemo } from "react";
import { Users, Trash2 } from "lucide-react";
import { useCustomers, useCreateCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { useProvider } from "@/hooks/use-provider";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/hooks/use-customers";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CreateCustomerForm({
  onClose,
  providerId,
}: {
  onClose: () => void;
  providerId: number;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const { mutate, isPending } = useCreateCustomer();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof EMPTY_FORM]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const next: Partial<typeof EMPTY_FORM> = {};
    if (!form.full_name.trim()) next.full_name = "El nombre completo es requerido.";
    if (form.email && !EMAIL_RE.test(form.email)) next.email = "Correo electrónico inválido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    mutate(
      {
        provider_id: providerId,
        full_name: form.full_name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Cliente agregado.");
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail ?? "Error al crear el cliente.");
        },
      }
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[13px] font-medium">Nuevo cliente</p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="María García"
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="text-[11px] text-destructive">{errors.full_name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="maria@empresa.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Calle Principal 123"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Notas sobre este cliente…"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando…" : "Agregar cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const Dash = () => <span className="text-muted-foreground/25 select-none">—</span>;

export default function CustomersPage() {
  const { data: customers, isLoading, isError } = useCustomers();
  const { data: provider } = useProvider();
  const deleteMutation = useDeleteCustomer();
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!q.trim()) return customers;
    const lower = q.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.phone?.includes(lower)
    );
  }, [customers, q]);

  function handleDeleteConfirm() {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Cliente eliminado.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Error al eliminar el cliente.");
        setToDelete(null);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Visualiza y gestiona tu lista de clientes."
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Agregar cliente
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      {!isLoading && !isError && (
        <div className="mb-4 flex items-center gap-3">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="flex-1 sm:max-w-xs"
          />
          {q && (
            <p className="text-[12px] text-muted-foreground shrink-0">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {showForm && provider && (
        <CreateCustomerForm
          onClose={() => setShowForm(false)}
          providerId={provider.id}
        />
      )}

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-3">
                <div className="h-3 w-28 rounded bg-muted/70 animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted/70 animate-pulse" />
                <div className="h-3 w-32 rounded bg-muted/70 animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted/70 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="px-4 py-3.5">
            <p className="text-[13px] text-destructive">
              Error al cargar los clientes. Asegúrate de que el servidor esté activo.
            </p>
          </div>
        )}

        {!isLoading && !isError && customers?.length === 0 && (
          <EmptyState
            icon={Users}
            title="Sin clientes aún"
            description="Los clientes son la base de tu operación. Guarda su nombre, contacto y dirección para vincularlos a trabajos y cotizaciones."
            action={
              !showForm ? (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Agregar primer cliente
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !isError && customers && customers.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title="Sin resultados"
            description={`No hay clientes que coincidan con "${q}".`}
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead />
              </tr>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground text-[13px]">
                    {c.full_name}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {c.phone ?? <Dash />}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {c.email ?? <Dash />}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {c.address ?? <Dash />}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground max-w-52 truncate">
                    {c.notes ?? <Dash />}
                  </TableCell>
                  <TableCell className="w-10 pr-3">
                    <button
                      onClick={() => setToDelete(c)}
                      aria-label="Eliminar cliente"
                      className="p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar cliente?"
        description={`"${toDelete?.full_name}" será eliminado permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cliente"
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
