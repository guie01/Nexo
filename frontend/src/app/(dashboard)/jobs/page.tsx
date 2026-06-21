"use client";

import { useState, useMemo } from "react";
import { Briefcase, Trash2, X } from "lucide-react";
import {
  useJobs,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  JOB_STATUSES,
  STATUS_LABELS,
  NEXT_STATUSES,
  type Job,
  type JobStatus,
} from "@/hooks/use-jobs";
import { useProvider } from "@/hooks/use-provider";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

// ─── Formatters ────────────────────────────────────────────────────────────

function formatMoney(value: string | null): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(value));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Filter Bar ────────────────────────────────────────────────────────────

function FilterBar({
  active,
  onChange,
}: {
  active: JobStatus | undefined;
  onChange: (s: JobStatus | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      <FilterPill active={!active} onClick={() => onChange(undefined)}>
        Todos
      </FilterPill>
      {JOB_STATUSES.map((s) => (
        <FilterPill key={s} active={active === s} onClick={() => onChange(s)}>
          {STATUS_LABELS[s]}
        </FilterPill>
      ))}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

// ─── Inline Status Select ──────────────────────────────────────────────────

function StatusSelect({
  job,
  onUpdate,
  disabled,
}: {
  job: Job;
  onUpdate: (status: JobStatus) => void;
  disabled?: boolean;
}) {
  const nextStatuses = NEXT_STATUSES[job.status] ?? [];
  if (nextStatuses.length === 0) return <StatusBadge status={job.status} />;

  return (
    <div className="relative inline-flex" title="Click to update status">
      <StatusBadge status={job.status} className="cursor-pointer" />
      <select
        value={job.status}
        disabled={disabled}
        onChange={(e) => onUpdate(e.target.value as JobStatus)}
        aria-label={`Status: ${STATUS_LABELS[job.status]}. Click to change.`}
        style={{ fontSize: "16px" }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <option value={job.status} disabled>
          {STATUS_LABELS[job.status]}
        </option>
        {nextStatuses.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Create Job Form ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  customer_id: "",
  description: "",
  scheduled_date: "",
  estimated_price: "",
  address: "",
};

function CreateJobForm({
  onClose,
  providerId,
}: {
  onClose: () => void;
  providerId: number;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const { data: customers } = useCustomers();
  const { mutate, isPending } = useCreateJob();

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof EMPTY_FORM]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const next: Partial<typeof EMPTY_FORM> = {};
    if (!form.title.trim()) next.title = "El título es requerido.";
    if (!form.customer_id) next.customer_id = "El cliente es requerido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      provider_id: providerId,
      customer_id: Number(form.customer_id),
      title: form.title.trim(),
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.scheduled_date) payload.scheduled_date = form.scheduled_date;
    if (form.estimated_price)
      payload.estimated_price = parseFloat(form.estimated_price);
    if (form.address.trim()) payload.address = form.address.trim();

    mutate(payload as any, {
      onSuccess: () => {
        toast.success("Trabajo creado.");
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.detail ?? "Error al crear el trabajo.");
      },
    });
  }

  return (
    <div className="rounded-md border bg-card shadow-sm mb-4">
      <div className="flex items-center px-4 py-3 border-b border-border">
        <p className="text-[13px] font-medium">Nuevo trabajo</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="jf-title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="jf-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Inspección eléctrica"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-[11px] text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jf-customer">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <select
              id="jf-customer"
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 text-foreground",
                errors.customer_id && "border-destructive"
              )}
            >
              <option value="">Seleccionar cliente…</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-[11px] text-destructive">{errors.customer_id}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="jf-scheduled">Fecha programada</Label>
            <Input
              id="jf-scheduled"
              name="scheduled_date"
              type="datetime-local"
              value={form.scheduled_date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jf-price">Precio estimado</Label>
            <Input
              id="jf-price"
              name="estimated_price"
              type="number"
              min="0"
              step="0.01"
              value={form.estimated_price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jf-address">Dirección del sitio</Label>
          <Input
            id="jf-address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Calle Principal 123"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jf-description">Descripción</Label>
          <Textarea
            id="jf-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Alcance del trabajo o notas…"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-0.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando…" : "Crear trabajo"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border last:border-0">
      {[180, 120, 80, 80, 60, 50, 32].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded bg-muted/60 animate-pulse"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const Dash = () => (
  <span className="text-muted-foreground/25 select-none">—</span>
);

export default function JobsPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<Job | null>(null);

  const { data: provider } = useProvider();
  // Fetch all jobs — filtering happens client-side for instant results
  const { data: jobs, isLoading, isError } = useJobs();
  const { data: customers } = useCustomers();
  const updateMutation = useUpdateJob();
  const deleteMutation = useDeleteJob();

  const customerMap = useMemo(
    () =>
      Object.fromEntries((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers]
  );

  const filtered = useMemo(() => {
    let result = jobs ?? [];
    if (statusFilter) result = result.filter((j) => j.status === statusFilter);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(lower) ||
          customerMap[j.customer_id]?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [jobs, statusFilter, q, customerMap]);

  const hasFilters = !!statusFilter || !!q;

  function clearFilters() {
    setStatusFilter(undefined);
    setQ("");
  }

  function handleDeleteConfirm() {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Trabajo eliminado.");
        setToDelete(null);
      },
      onError: () => {
        toast.error("Error al eliminar el trabajo.");
        setToDelete(null);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Trabajos"
        description="Gestiona y sigue tus trabajos de servicio."
        action={
          !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Agregar trabajo
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-3">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Buscar por título o cliente…"
            className="flex-1 sm:max-w-xs"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
              Limpiar filtros
            </button>
          )}
        </div>
        <FilterBar active={statusFilter} onChange={setStatusFilter} />
      </div>

      {showForm && provider && (
        <CreateJobForm
          onClose={() => setShowForm(false)}
          providerId={provider.id}
        />
      )}

      {!isLoading && !isError && jobs && (
        <p className="text-[12px] text-muted-foreground mb-2">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} trabajo${filtered.length !== 1 ? "s" : ""}`}
          {statusFilter ? ` · ${STATUS_LABELS[statusFilter]}` : ""}
        </p>
      )}

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        {isError && (
          <div className="px-4 py-3.5">
            <p className="text-[13px] text-destructive">
              Error al cargar los trabajos. Asegúrate de que el servidor esté activo.
            </p>
          </div>
        )}

        {!isError && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Programado</TableHead>
                <TableHead>Estimado</TableHead>
                <TableHead>Final</TableHead>
                <TableHead />
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Briefcase}
                      title={hasFilters ? "Sin resultados" : "Sin trabajos aún"}
                      description={
                        hasFilters
                          ? "Ningún trabajo coincide con los filtros actuales."
                          : "Registra cada servicio que realizas. Lleva el seguimiento del estado, fecha y precio — desde el primer contacto hasta el cobro."
                      }
                      action={
                        hasFilters ? (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        ) : !showForm ? (
                          <Button size="sm" onClick={() => setShowForm(true)}>
                            Agregar trabajo
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-56">
                      <span className="block truncate font-medium text-[13px] text-foreground">
                        {job.title}
                      </span>
                      {job.address && (
                        <span className="block truncate text-[11px] text-muted-foreground mt-0.5">
                          {job.address}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-[13px] text-muted-foreground">
                      {customerMap[job.customer_id] ?? <Dash />}
                    </TableCell>

                    <TableCell>
                      <StatusSelect
                        job={job}
                        onUpdate={(status) =>
                          updateMutation.mutate(
                            { id: job.id, status },
                            {
                              onSuccess: () => toast.success("Estado actualizado."),
                              onError: () => toast.error("Error al actualizar el estado."),
                            }
                          )
                        }
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>

                    <TableCell className="text-[13px] text-muted-foreground tabular-nums">
                      {formatDate(job.scheduled_date)}
                    </TableCell>

                    <TableCell className="text-[13px] text-muted-foreground tabular-nums">
                      {formatMoney(job.estimated_price)}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {job.final_price ? (
                        <span className="text-[13px] font-medium text-foreground">
                          {formatMoney(job.final_price)}
                        </span>
                      ) : (
                        <Dash />
                      )}
                    </TableCell>

                    <TableCell className="w-10 pr-3">
                      <button
                        onClick={() => setToDelete(job)}
                        aria-label="Eliminar trabajo"
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
        title="¿Eliminar trabajo?"
        description={`"${toDelete?.title}" será eliminado permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar trabajo"
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
