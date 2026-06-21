"use client";

import { useState, useMemo } from "react";
import { FileText, X, Trash2 } from "lucide-react";
import {
  useQuotes,
  useUpdateQuote,
  useDeleteQuote,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TRANSITIONS,
  type Quote,
  type QuoteStatus,
} from "@/hooks/use-quotes";
import { useCustomers } from "@/hooks/use-customers";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { CreateQuotePanel } from "@/components/create-quote-panel";
import { EditQuotePanel } from "@/components/edit-quote-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Formatters ────────────────────────────────────────────────────────────

function formatMoney(value: string): string {
  const n = parseFloat(value);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Status select ─────────────────────────────────────────────────────────

function QuoteStatusSelect({
  quote,
  onUpdate,
  disabled,
}: {
  quote: Quote;
  onUpdate: (status: QuoteStatus) => void;
  disabled?: boolean;
}) {
  const nexts = QUOTE_STATUS_TRANSITIONS[quote.status] ?? [];
  if (nexts.length === 0) return <StatusBadge status={quote.status} />;

  return (
    <div className="relative inline-flex" title="Click para cambiar estado">
      <StatusBadge status={quote.status} className="cursor-pointer" />
      <select
        value={quote.status}
        disabled={disabled}
        onChange={(e) => onUpdate(e.target.value as QuoteStatus)}
        aria-label={`Estado: ${QUOTE_STATUS_LABELS[quote.status]}. Click para cambiar.`}
        style={{ fontSize: "16px" }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        <option value={quote.status} disabled>
          {QUOTE_STATUS_LABELS[quote.status]}
        </option>
        {nexts.map((s) => (
          <option key={s} value={s}>
            {QUOTE_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Filter Pill ───────────────────────────────────────────────────────────

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
        "inline-flex items-center h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors shrink-0",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border last:border-0">
      {[100, 140, 80, 80, 70, 32].map((w, i) => (
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

const Dash = () => (
  <span className="text-muted-foreground/25 select-none">—</span>
);

// ─── Page ──────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [toDelete, setToDelete] = useState<Quote | null>(null);

  const queryClient = useQueryClient();
  const { data: quotes, isLoading, isError } = useQuotes();
  const { data: customers } = useCustomers();
  const updateMutation = useUpdateQuote();
  const deleteMutation = useDeleteQuote();

  const customerMap = useMemo(
    () =>
      Object.fromEntries(
        (customers ?? []).map((c) => [c.id, c.full_name])
      ),
    [customers]
  );

  const filtered = useMemo(() => {
    let result = quotes ?? [];
    if (statusFilter) result = result.filter((q) => q.status === statusFilter);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(
        (qt) =>
          qt.quote_number.toLowerCase().includes(lower) ||
          customerMap[qt.customer_id]?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [quotes, statusFilter, q, customerMap]);

  const hasFilters = !!statusFilter || !!q;

  function clearFilters() {
    setStatusFilter(undefined);
    setQ("");
  }

  function handleStatusUpdate(quote: Quote, status: QuoteStatus) {
    updateMutation.mutate(
      { quoteId: quote.id, payload: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["quotes"] });
          toast.success(`Estado actualizado a ${QUOTE_STATUS_LABELS[status]}.`);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.detail ?? "Error al actualizar el estado."
          );
        },
      }
    );
  }

  function handleDeleteConfirm() {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(`Cotización ${toDelete.quote_number} eliminada.`);
        setToDelete(null);
      },
      onError: () => {
        toast.error("Error al eliminar la cotización.");
        setToDelete(null);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description="Crea y sigue estimados para tus clientes."
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            Nueva cotización
          </Button>
        }
      />

      {/* Panels */}
      <CreateQuotePanel open={showCreate} onClose={() => setShowCreate(false)} />
      {selectedQuote && (
        <EditQuotePanel
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar cotización?"
        description={`La cotización "${toDelete?.quote_number}" será eliminada permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cotización"
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
      />

      {/* Toolbar */}
      {!isError && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-3">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Buscar por # de cotización o cliente…"
              className="flex-1 sm:max-w-xs"
            />
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="size-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          {/* Status filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            <FilterPill
              active={!statusFilter}
              onClick={() => setStatusFilter(undefined)}
            >
              Todos
            </FilterPill>
            {QUOTE_STATUSES.map((s) => (
              <FilterPill
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              >
                {QUOTE_STATUS_LABELS[s]}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !isError && quotes && (
        <p className="text-[12px] text-muted-foreground mb-2">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} cotización${filtered.length !== 1 ? "es" : ""}`}
          {statusFilter ? ` · ${QUOTE_STATUS_LABELS[statusFilter]}` : ""}
        </p>
      )}

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        {isError && (
          <div className="px-4 py-3.5">
            <p className="text-[13px] text-destructive">
              Error al cargar las cotizaciones. Asegúrate de que el servidor esté activo.
            </p>
          </div>
        )}

        {!isError && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Cotización #</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Válida hasta</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading && quotes?.length === 0 && !hasFilters && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={FileText}
                      title="Sin cotizaciones aún"
                      description="Genera estimados detallados con ítems y precios. Envíalos a tus clientes y sigue su respuesta — borrador, enviado, aceptado o rechazado."
                    />
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && hasFilters && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={FileText}
                      title="Sin resultados"
                      description="Ninguna cotización coincide con los filtros actuales."
                      action={
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((qt) => (
                  <TableRow
                    key={qt.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedQuote(qt)}
                  >
                    <TableCell className="font-medium text-[13px] text-foreground tabular-nums">
                      {qt.quote_number}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {customerMap[qt.customer_id] ?? <Dash />}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <QuoteStatusSelect
                        quote={qt}
                        onUpdate={(status) => handleStatusUpdate(qt, status)}
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground tabular-nums">
                      {formatDate(qt.valid_until)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-medium text-foreground tabular-nums">
                      {formatMoney(qt.total)}
                    </TableCell>
                    <TableCell
                      className="w-10 pr-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setToDelete(qt)}
                        aria-label="Eliminar cotización"
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
    </div>
  );
}
