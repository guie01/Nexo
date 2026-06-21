"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateQuote,
  useAddQuoteItem,
  useUpdateQuoteItem,
  useDeleteQuoteItem,
  type Quote,
  type QuoteItem,
} from "@/hooks/use-quotes";
import { useCustomers } from "@/hooks/use-customers";
import { useJobs } from "@/hooks/use-jobs";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface EditItem {
  _key: string;
  id?: number;
  description: string;
  quantity: string;
  unit_price: string;
}

function itemFromApi(qi: QuoteItem): EditItem {
  return {
    _key: Math.random().toString(36).slice(2),
    id: qi.id,
    description: qi.description,
    quantity: String(qi.quantity),
    unit_price: String(qi.unit_price),
  };
}

function blankItem(): EditItem {
  return {
    _key: Math.random().toString(36).slice(2),
    description: "",
    quantity: "1",
    unit_price: "",
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function lineTotal(item: EditItem): number {
  const qty = parseFloat(item.quantity);
  const price = parseFloat(item.unit_price);
  if (!isFinite(qty) || !isFinite(price) || qty <= 0 || price < 0) return 0;
  return qty * price;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/60">
      {children}
    </p>
  );
}

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-[12px] text-right truncate",
          strong ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────

interface EditQuotePanelProps {
  quote: Quote;
  onClose: () => void;
}

export function EditQuotePanel({ quote, onClose }: EditQuotePanelProps) {
  const queryClient = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: jobs } = useJobs();
  const updateQuote = useUpdateQuote();
  const updateItem = useUpdateQuoteItem();
  const deleteItem = useDeleteQuoteItem();
  const addItem = useAddQuoteItem();

  // ── Form state ──────────────────────────────────────────────────────────
  const [notes, setNotes] = useState(quote.notes ?? "");
  const [validUntil, setValidUntil] = useState(quote.valid_until ?? "");
  const [items, setItems] = useState<EditItem[]>(
    quote.items.length > 0 ? quote.items.map(itemFromApi) : [blankItem()]
  );
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────

  const customerName =
    customers?.find((c) => c.id === quote.customer_id)?.full_name ?? "—";
  const jobTitle = quote.job_id
    ? (jobs?.find((j) => j.id === quote.job_id)?.title ?? "—")
    : null;

  const subtotal = items.reduce((sum, it) => sum + lineTotal(it), 0);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function clearError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateItemField(
    key: string,
    field: keyof Omit<EditItem, "_key" | "id">,
    value: string
  ) {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, [field]: value } : it))
    );
    clearError(`item_${key}_${field}`);
  }

  function addLineItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeItem(item: EditItem) {
    if (item.id !== undefined) {
      setDeletedItemIds((prev) => [...prev, item.id!]);
    }
    setItems((prev) => prev.filter((it) => it._key !== item._key));
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (items.length === 0) {
      next.items = "La cotización debe tener al menos un ítem.";
    } else {
      items.forEach((it) => {
        if (!it.description.trim())
          next[`item_${it._key}_description`] = "Requerido.";
        const qty = parseFloat(it.quantity);
        if (!it.quantity || !isFinite(qty) || qty <= 0)
          next[`item_${it._key}_quantity`] = "!";
        const price = parseFloat(it.unit_price);
        if (it.unit_price === "" || !isFinite(price) || price < 0)
          next[`item_${it._key}_unit_price`] = "!";
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // 1 — Patch quote-level fields
      await updateQuote.mutateAsync({
        quoteId: quote.id,
        payload: {
          notes: notes.trim() || null,
          valid_until: validUntil || null,
        },
      });

      // 2 — Delete removed items
      for (const itemId of deletedItemIds) {
        await deleteItem.mutateAsync(itemId);
      }

      // 3 — Update existing items
      for (const it of items.filter((it) => it.id !== undefined)) {
        await updateItem.mutateAsync({
          itemId: it.id!,
          payload: {
            description: it.description.trim(),
            quantity: parseFloat(it.quantity),
            unit_price: parseFloat(it.unit_price),
          },
        });
      }

      // 4 — Add new items
      for (const it of items.filter((it) => it.id === undefined)) {
        await addItem.mutateAsync({
          quoteId: quote.id,
          item: {
            description: it.description.trim(),
            quantity: parseFloat(it.quantity),
            unit_price: parseFloat(it.unit_price),
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success(`Cotización ${quote.quote_number} actualizada.`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al guardar los cambios.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full max-w-lg flex-col",
          "bg-background border-l border-border shadow-2xl",
          "animate-in slide-in-from-right duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[14px] font-semibold text-foreground">
              {quote.quote_number}
            </h2>
            <StatusBadge status={quote.status} />
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form
          id="edit-quote-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5"
        >
          {/* ── Info summary (read-only) ── */}
          <section>
            <div className="rounded-md border border-border bg-muted/20 px-3.5 py-3 space-y-2">
              <InfoRow label="Cliente" value={customerName} strong />
              {jobTitle && <InfoRow label="Trabajo" value={jobTitle} />}
              <InfoRow
                label="Creada"
                value={new Date(quote.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <InfoRow
                label="Total actual"
                value={money(parseFloat(quote.total))}
                strong
              />
            </div>
          </section>

          {/* ── Editable details ── */}
          <section className="space-y-3.5">
            <SectionLabel>Detalles</SectionLabel>

            <div className="space-y-1.5">
              <Label htmlFor="eq-valid">
                Válida hasta{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="eq-valid"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eq-notes">
                Notas{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="eq-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Condiciones, aclaraciones, términos de pago…"
              />
            </div>
          </section>

          {/* ── Items ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Ítems</SectionLabel>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-colors hover:text-primary/70"
              >
                <Plus className="size-3.5" />
                Agregar ítem
              </button>
            </div>

            {errors.items && (
              <p className="text-[11px] text-destructive">{errors.items}</p>
            )}

            {/* Column labels */}
            <div className="grid grid-cols-[1fr_4rem_5.5rem_1.75rem] gap-2 px-0.5">
              <span className="text-[11px] text-muted-foreground/50">
                Descripción
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Cant.
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Precio unit.
              </span>
              <span />
            </div>

            {/* Item rows */}
            <div className="space-y-2">
              {items.map((it, idx) => {
                const lt = lineTotal(it);
                const descErr = errors[`item_${it._key}_description`];
                const qtyErr = errors[`item_${it._key}_quantity`];
                const priceErr = errors[`item_${it._key}_unit_price`];
                const hasErr = !!(descErr || qtyErr || priceErr);

                return (
                  <div key={it._key} className="space-y-1">
                    <div className="grid grid-cols-[1fr_4rem_5.5rem_1.75rem] items-start gap-2">
                      {/* Description */}
                      <div>
                        <Input
                          value={it.description}
                          onChange={(e) =>
                            updateItemField(
                              it._key,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder={`Servicio ${idx + 1}`}
                          aria-invalid={!!descErr}
                        />
                        {descErr && (
                          <p className="mt-0.5 text-[10px] text-destructive">
                            {descErr}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItemField(
                              it._key,
                              "quantity",
                              e.target.value
                            )
                          }
                          aria-invalid={!!qtyErr}
                        />
                        {qtyErr && (
                          <p className="mt-0.5 text-[10px] text-destructive">
                            !
                          </p>
                        )}
                      </div>

                      {/* Unit price */}
                      <div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unit_price}
                          onChange={(e) =>
                            updateItemField(
                              it._key,
                              "unit_price",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          aria-invalid={!!priceErr}
                        />
                        {priceErr && (
                          <p className="mt-0.5 text-[10px] text-destructive">
                            !
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <div
                        className={cn(
                          "flex justify-center",
                          hasErr ? "pt-1" : "pt-1.5"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => removeItem(it)}
                          aria-label="Eliminar ítem"
                          className="text-muted-foreground/35 transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line total preview */}
                    {lt > 0 && (
                      <p className="pr-7 text-right text-[11px] tabular-nums text-muted-foreground">
                        = {money(lt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtotal */}
            {subtotal > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[12px] text-muted-foreground">
                  Subtotal estimado
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-foreground">
                  {money(subtotal)}
                </span>
              </div>
            )}
          </section>
        </form>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-4 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-quote-form"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
