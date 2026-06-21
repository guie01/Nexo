"use client";

import { useState, useMemo } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProvider } from "@/hooks/use-provider";
import { useCustomers } from "@/hooks/use-customers";
import { useJobs } from "@/hooks/use-jobs";
import { useCreateQuote, useAddQuoteItem } from "@/hooks/use-quotes";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LineItem {
  _key: string;
  description: string;
  quantity: string;
  unit_price: string;
}

function blankItem(): LineItem {
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

function lineTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity);
  const price = parseFloat(item.unit_price);
  if (!isFinite(qty) || !isFinite(price) || qty <= 0 || price < 0) return 0;
  return qty * price;
}

// ─── Section heading ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/60">
      {children}
    </p>
  );
}

// ─── Native select styled to match the rest of the app ─────────────────────

function AppSelect({
  id,
  value,
  onChange,
  disabled,
  invalid,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
        invalid && "border-destructive"
      )}
    >
      {children}
    </select>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────

interface CreateQuotePanelProps {
  open: boolean;
  onClose: () => void;
}

export function CreateQuotePanel({ open, onClose }: CreateQuotePanelProps) {
  const queryClient = useQueryClient();
  const { data: provider } = useProvider();
  const { data: customers } = useCustomers();
  const { data: jobs } = useJobs();
  const createQuote = useCreateQuote();
  const addItem = useAddQuoteItem();

  // ── Form state ──────────────────────────────────────────────────────────
  const [customerId, setCustomerId] = useState("");
  const [jobId, setJobId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([blankItem()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────

  // Jobs filtered to the selected customer
  const customerJobs = useMemo(() => {
    if (!jobs || !customerId) return [];
    return jobs.filter((j) => j.customer_id === Number(customerId));
  }, [jobs, customerId]);

  // Live subtotal from local state — backend will recalculate on save
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + lineTotal(it), 0),
    [items]
  );

  // ── Helpers ─────────────────────────────────────────────────────────────

  function clearError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetForm() {
    setCustomerId("");
    setJobId("");
    setValidUntil("");
    setNotes("");
    setItems([blankItem()]);
    setErrors({});
  }

  function handleClose() {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  }

  // ── Item handlers ───────────────────────────────────────────────────────

  function updateItem(key: string, field: keyof Omit<LineItem, "_key">, value: string) {
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, [field]: value } : it))
    );
    clearError(`item_${key}_${field}`);
  }

  function addLineItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeLineItem(key: string) {
    setItems((prev) => prev.filter((it) => it._key !== key));
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!customerId) next.customerId = "Selecciona un cliente.";

    if (items.length === 0) {
      next.items = "Agrega al menos un ítem.";
    } else {
      items.forEach((it) => {
        if (!it.description.trim())
          next[`item_${it._key}_description`] = "Requerido.";
        const qty = parseFloat(it.quantity);
        if (!it.quantity || !isFinite(qty) || qty <= 0)
          next[`item_${it._key}_quantity`] = "Requerido.";
        const price = parseFloat(it.unit_price);
        if (it.unit_price === "" || !isFinite(price) || price < 0)
          next[`item_${it._key}_unit_price`] = "Requerido.";
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate() || !provider) return;

    setIsSubmitting(true);
    try {
      // Step 1 — create the quote record
      const quote = await createQuote.mutateAsync({
        provider_id: provider.id,
        customer_id: Number(customerId),
        ...(jobId ? { job_id: Number(jobId) } : {}),
        ...(validUntil ? { valid_until: validUntil } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      // Step 2 — add each line item sequentially
      for (const it of items) {
        await addItem.mutateAsync({
          quoteId: quote.id,
          item: {
            description: it.description.trim(),
            quantity: parseFloat(it.quantity),
            unit_price: parseFloat(it.unit_price),
          },
        });
      }

      // Refresh quotes list and dashboard
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success(`Cotización ${quote.quote_number} creada.`);
      resetForm();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al crear la cotización.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!open) return null;

  const noCustomers = customers !== undefined && customers.length === 0;

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
          <h2 className="text-[14px] font-semibold text-foreground">
            Nueva cotización
          </h2>
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
          id="create-quote-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-5"
        >
          {/* DETALLES */}
          <section className="space-y-3.5">
            <SectionLabel>Detalles</SectionLabel>

            {/* Customer */}
            <div className="space-y-1.5">
              <Label htmlFor="qf-customer">
                Cliente <span className="text-destructive">*</span>
              </Label>
              {noCustomers ? (
                <p className="rounded-lg border border-input bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                  No hay clientes.{" "}
                  <a
                    href="/customers"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Agrega uno primero
                  </a>
                  .
                </p>
              ) : (
                <AppSelect
                  id="qf-customer"
                  value={customerId}
                  invalid={!!errors.customerId}
                  onChange={(v) => {
                    setCustomerId(v);
                    setJobId("");
                    clearError("customerId");
                  }}
                >
                  <option value="">Seleccionar cliente…</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </AppSelect>
              )}
              {errors.customerId && (
                <p className="text-[11px] text-destructive">{errors.customerId}</p>
              )}
            </div>

            {/* Job — optional, filtered to selected customer */}
            <div className="space-y-1.5">
              <Label htmlFor="qf-job">
                Trabajo{" "}
                <span className="text-muted-foreground/50 font-normal">(opcional)</span>
              </Label>
              <AppSelect
                id="qf-job"
                value={jobId}
                disabled={!customerId}
                onChange={setJobId}
              >
                {!customerId ? (
                  <option value="">Selecciona un cliente primero</option>
                ) : customerJobs.length === 0 ? (
                  <option value="">Sin trabajos para este cliente</option>
                ) : (
                  <>
                    <option value="">Sin trabajo específico</option>
                    {customerJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </>
                )}
              </AppSelect>
            </div>

            {/* Valid until */}
            <div className="space-y-1.5">
              <Label htmlFor="qf-valid">
                Válida hasta{" "}
                <span className="text-muted-foreground/50 font-normal">(opcional)</span>
              </Label>
              <Input
                id="qf-valid"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="qf-notes">
                Notas{" "}
                <span className="text-muted-foreground/50 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="qf-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Condiciones, aclaraciones, términos de pago…"
              />
            </div>
          </section>

          {/* ÍTEMS */}
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
              <span className="text-[11px] text-muted-foreground/50">Descripción</span>
              <span className="text-[11px] text-muted-foreground/50">Cant.</span>
              <span className="text-[11px] text-muted-foreground/50">Precio unit.</span>
              <span />
            </div>

            {/* Item rows */}
            <div className="space-y-2">
              {items.map((it, idx) => {
                const lt = lineTotal(it);
                const showTotal = lt > 0;
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
                            updateItem(it._key, "description", e.target.value)
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
                            updateItem(it._key, "quantity", e.target.value)
                          }
                          aria-invalid={!!qtyErr}
                        />
                        {qtyErr && (
                          <p className="mt-0.5 text-[10px] text-destructive">!</p>
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
                            updateItem(it._key, "unit_price", e.target.value)
                          }
                          placeholder="0.00"
                          aria-invalid={!!priceErr}
                        />
                        {priceErr && (
                          <p className="mt-0.5 text-[10px] text-destructive">!</p>
                        )}
                      </div>

                      {/* Delete */}
                      <div className={cn("flex justify-center", hasErr ? "pt-1" : "pt-1.5")}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(it._key)}
                            aria-label="Eliminar ítem"
                            className="text-muted-foreground/35 transition-colors hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Line total preview */}
                    {showTotal && (
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
                <span className="text-[12px] text-muted-foreground">Subtotal estimado</span>
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
            form="create-quote-form"
            size="sm"
            disabled={isSubmitting || !provider || noCustomers}
          >
            {isSubmitting ? "Creando…" : "Crear cotización"}
          </Button>
        </div>
      </div>
    </div>
  );
}
