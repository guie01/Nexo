"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Wrench,
  UserPlus,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard } from "@/hooks/use-dashboard";
import { useJobs } from "@/hooks/use-jobs";
import { useQuotes } from "@/hooks/use-quotes";
import { useCustomers } from "@/hooks/use-customers";
import { useProvider } from "@/hooks/use-provider";
import { toast } from "@/hooks/use-toast";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Job } from "@/hooks/use-jobs";
import type { Quote } from "@/hooks/use-quotes";
import type { Customer } from "@/hooks/use-customers";

// ─── Formatters ────────────────────────────────────────────────────────────

function fmtMoney(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);
}

function fmtShortDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es", {
    month: "short",
    day: "numeric",
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m} min`;
  if (h < 24) return `hace ${h}h`;
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString("es", {
    month: "short",
    day: "numeric",
  });
}

// ─── Activity synthesis ────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  Icon: LucideIcon;
  iconColor: string;
  label: string;
  entity: string;
  href: string;
  at: string;
}

function buildActivity(
  customers: Customer[],
  jobs: Job[],
  quotes: Quote[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const c of customers) {
    items.push({
      id: `c-${c.id}`,
      Icon: UserPlus,
      iconColor: "text-blue-400",
      label: "Cliente agregado",
      entity: c.full_name,
      href: "/customers",
      at: c.created_at,
    });
  }

  for (const j of jobs) {
    const shifted =
      new Date(j.updated_at).getTime() - new Date(j.created_at).getTime() >
      60_000;

    if (j.status === "completed") {
      items.push({
        id: `j-${j.id}`,
        Icon: CheckCircle2,
        iconColor: "text-emerald-400",
        label: "Trabajo completado",
        entity: j.title,
        href: "/jobs",
        at: shifted ? j.updated_at : j.created_at,
      });
    } else if (j.status === "in_progress") {
      items.push({
        id: `j-${j.id}`,
        Icon: Wrench,
        iconColor: "text-amber-400",
        label: "Trabajo en progreso",
        entity: j.title,
        href: "/jobs",
        at: shifted ? j.updated_at : j.created_at,
      });
    } else if (j.status === "cancelled") {
      items.push({
        id: `j-${j.id}`,
        Icon: XCircle,
        iconColor: "text-zinc-400",
        label: "Trabajo cancelado",
        entity: j.title,
        href: "/jobs",
        at: shifted ? j.updated_at : j.created_at,
      });
    } else {
      items.push({
        id: `j-${j.id}`,
        Icon: Briefcase,
        iconColor: "text-muted-foreground",
        label: "Trabajo creado",
        entity: j.title,
        href: "/jobs",
        at: j.created_at,
      });
    }
  }

  for (const q of quotes) {
    const shifted =
      new Date(q.updated_at).getTime() - new Date(q.created_at).getTime() >
      60_000;

    if (q.status === "accepted") {
      items.push({
        id: `q-${q.id}`,
        Icon: CheckCircle2,
        iconColor: "text-emerald-400",
        label: "Cotización aceptada",
        entity: q.quote_number,
        href: "/quotes",
        at: shifted ? q.updated_at : q.created_at,
      });
    } else if (q.status === "rejected") {
      items.push({
        id: `q-${q.id}`,
        Icon: XCircle,
        iconColor: "text-red-400",
        label: "Cotización rechazada",
        entity: q.quote_number,
        href: "/quotes",
        at: shifted ? q.updated_at : q.created_at,
      });
    } else if (q.status === "sent") {
      items.push({
        id: `q-${q.id}`,
        Icon: Send,
        iconColor: "text-blue-400",
        label: "Cotización enviada",
        entity: q.quote_number,
        href: "/quotes",
        at: shifted ? q.updated_at : q.created_at,
      });
    } else if (q.status === "expired") {
      items.push({
        id: `q-${q.id}`,
        Icon: Clock,
        iconColor: "text-orange-400",
        label: "Cotización vencida",
        entity: q.quote_number,
        href: "/quotes",
        at: shifted ? q.updated_at : q.created_at,
      });
    } else {
      items.push({
        id: `q-${q.id}`,
        Icon: FileText,
        iconColor: "text-muted-foreground",
        label: "Cotización creada",
        entity: q.quote_number,
        href: "/quotes",
        at: q.created_at,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);
}

// ─── Skeleton primitives ───────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
  return (
    <div className={`rounded bg-muted/60 animate-pulse ${className ?? ""}`} />
  );
}

function SkeletonRows({ n = 4 }: { n?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="space-y-1.5 flex-1">
            <Skel className="h-3 w-32" />
            <Skel className="h-2.5 w-20" />
          </div>
          <Skel className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Loading state ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <Skel className="h-5 w-24" />
        <Skel className="h-3.5 w-48" />
      </div>
      <div className="space-y-3">
        <Skel className="h-3 w-16" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border bg-card px-4 py-4 space-y-3">
              <Skel className="h-2.5 w-16" />
              <Skel className="h-7 w-12" />
              <Skel className="h-2.5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <Skel className="h-3 w-28" />
            </div>
            <SkeletonRows n={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/60">
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Card chrome ───────────────────────────────────────────────────────────

function Card({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        {header}
      </div>
      <div className="flex-1">{children}</div>
      {footer && (
        <div className="border-t border-border px-4 py-2.5 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── StatusCard (status breakdown) ────────────────────────────────────────

const JOB_STATUS_ORDER = [
  "new",
  "quoted",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];
const QUOTE_STATUS_ORDER = ["draft", "sent", "accepted", "rejected", "expired"];

const STATUS_LABELS_ES: Record<string, string> = {
  new: "Nuevo",
  pending: "Pendiente",
  quoted: "Cotizado",
  scheduled: "Agendado",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  expired: "Vencido",
};

function StatusCard({
  title,
  statuses,
  order,
}: {
  title: string;
  statuses: Record<string, number>;
  order: string[];
}) {
  const rows = order.filter((k) => k in statuses);
  const total = rows.reduce((s, k) => s + statuses[k], 0);

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </p>
        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
          {total}
        </span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((status) => {
          const count = statuses[status];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={status}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <span className="text-[13px] text-muted-foreground capitalize">
                {STATUS_LABELS_ES[status] ?? status.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground/50 tabular-nums w-8 text-right">
                  {pct}%
                </span>
                <span className="text-[13px] font-medium tabular-nums w-6 text-right">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Onboarding (no data yet) ──────────────────────────────────────────────

function OnboardingCard({
  icon: Icon,
  title,
  description,
  href,
  label,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-md border bg-card shadow-sm p-5 flex flex-col gap-3">
      <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/70 transition-colors"
      >
        {label}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: provider } = useProvider();
  const { data, isLoading, isError } = useDashboard();
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: quotes, isLoading: quotesLoading } = useQuotes();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const [seeding, setSeeding] = useState(false);

  // All hooks must run before any early returns (Rules of Hooks)
  const customerMap = useMemo(
    () =>
      Object.fromEntries((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers]
  );

  const recentJobs = useMemo(
    () =>
      (jobs ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5),
    [jobs]
  );

  const recentQuotes = useMemo(
    () =>
      (quotes ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5),
    [quotes]
  );

  const activityItems = useMemo(
    () =>
      customers && jobs && quotes
        ? buildActivity(customers, jobs, quotes)
        : [],
    [customers, jobs, quotes]
  );

  if (isLoading) return <LoadingState />;

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[15px] font-semibold tracking-[-0.01em]">
            Panel
          </h1>
        </div>
        <div className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3">
          <p className="text-[13px] text-destructive">
            No se pudieron cargar las métricas. Asegúrate de que el servidor
            esté activo.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived metrics ─────────────────────────────────────────────────────

  const activeJobs =
    (data.jobs_by_status.new ?? 0) +
    (data.jobs_by_status.quoted ?? 0) +
    (data.jobs_by_status.scheduled ?? 0) +
    (data.jobs_by_status.in_progress ?? 0);

  const completedJobs = data.jobs_by_status.completed ?? 0;

  const openQuotes =
    (data.quotes_by_status.draft ?? 0) + (data.quotes_by_status.sent ?? 0);

  const acceptedQuotes = data.quotes_by_status.accepted ?? 0;
  const rejectedQuotes = data.quotes_by_status.rejected ?? 0;
  const decidedQuotes = acceptedQuotes + rejectedQuotes;
  const acceptanceRate =
    decidedQuotes > 0
      ? Math.round((acceptedQuotes / decidedQuotes) * 100)
      : null;

  const hasActivity =
    data.total_customers > 0 ||
    data.total_jobs > 0 ||
    data.total_quotes > 0;

  // ── Today label ─────────────────────────────────────────────────────────

  const todayLabel = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isDev = process.env.NODE_ENV === "development";

  async function handleSeedDemo(reset = false) {
    if (!provider) return;
    setSeeding(true);
    try {
      await api.post("/dev/seed", { provider_id: provider.id, reset });
      await queryClient.invalidateQueries();
      toast.success("Datos de demo cargados.");
    } catch {
      toast.error("Error al cargar datos de demo.");
    } finally {
      setSeeding(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground capitalize">
            Panel
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5 capitalize">
            {todayLabel}
          </p>
        </div>

        {/* Quick actions — shown when there is data */}
        {hasActivity && (
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="size-3" />
              Cliente
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="size-3" />
              Trabajo
            </Link>
            <Link
              href="/quotes"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="size-3" />
              Cotización
            </Link>
          </div>
        )}
      </div>

      {/* Onboarding — no data yet */}
      {!hasActivity && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground">
              Comienza configurando tu operación.
            </p>
            {isDev && (
              <button
                onClick={() => handleSeedDemo(false)}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors disabled:opacity-50"
              >
                <Sparkles className="size-3" />
                {seeding ? "Cargando…" : "Cargar demo"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OnboardingCard
              icon={Users}
              title="Agrega un cliente"
              description="Los clientes son la base de tu operación. Guarda su contacto y dirección para vincularlos a trabajos y cotizaciones."
              href="/customers"
              label="Ir a Clientes"
            />
            <OnboardingCard
              icon={Briefcase}
              title="Crea un trabajo"
              description="Registra servicios activos, agendados o completados. Lleva el seguimiento del estado y precio desde el inicio hasta el cobro."
              href="/jobs"
              label="Ir a Trabajos"
            />
            <OnboardingCard
              icon={FileText}
              title="Genera una cotización"
              description="Crea estimados con ítems y precios detallados. Sigue su estado: borrador, enviado, aceptado o rechazado."
              href="/quotes"
              label="Ir a Cotizaciones"
            />
          </div>

          {/* Dev reset shortcut — only visible in dev, only when data exists */}
          {isDev && (
            <p className="text-[11px] text-muted-foreground/40">
              Modo dev:{" "}
              <button
                onClick={() => handleSeedDemo(true)}
                disabled={seeding}
                className="underline-offset-2 hover:underline disabled:opacity-50"
              >
                reiniciar con demo
              </button>
            </p>
          )}
        </div>
      )}

      {hasActivity && (
        <>
          {/* ── Metrics ── */}
          <Section title="Resumen">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Clientes"
                value={data.total_customers}
                sub={`${data.total_customers === 1 ? "registro" : "registros"}`}
              />
              <StatCard
                label="Trabajos activos"
                value={activeJobs}
                sub={
                  completedJobs > 0
                    ? `${completedJobs} completado${completedJobs !== 1 ? "s" : ""}`
                    : "Sin completar aún"
                }
              />
              <StatCard
                label="Cotizaciones abiertas"
                value={openQuotes}
                sub={
                  acceptanceRate !== null
                    ? `${acceptanceRate}% tasa de aceptación`
                    : acceptedQuotes > 0
                    ? `${acceptedQuotes} aceptada${acceptedQuotes !== 1 ? "s" : ""}`
                    : "Sin cerrar aún"
                }
              />
              <StatCard
                accent
                label="Ingresos realizados"
                value={fmtMoney(data.completed_job_revenue)}
                sub="De trabajos completados"
              />
            </div>
          </Section>

          {/* ── Pipeline: recent jobs + recent quotes ── */}
          <Section title="Pipeline">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Recent Jobs */}
              <Card
                header={
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Trabajos recientes
                    </p>
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {data.total_jobs}
                    </span>
                  </>
                }
                footer={
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver todos
                    <ArrowRight className="size-3" />
                  </Link>
                }
              >
                {jobsLoading ? (
                  <SkeletonRows n={4} />
                ) : recentJobs.length === 0 ? (
                  <div className="flex items-center justify-center px-4 py-8">
                    <p className="text-[13px] text-muted-foreground">
                      Sin trabajos aún
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {job.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {customerMap[job.customer_id] ?? "—"}
                            {job.scheduled_date
                              ? ` · ${fmtShortDate(job.scheduled_date)}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Quotes */}
              <Card
                header={
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Cotizaciones recientes
                    </p>
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {data.total_quotes}
                    </span>
                  </>
                }
                footer={
                  <Link
                    href="/quotes"
                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver todas
                    <ArrowRight className="size-3" />
                  </Link>
                }
              >
                {quotesLoading ? (
                  <SkeletonRows n={4} />
                ) : recentQuotes.length === 0 ? (
                  <div className="flex items-center justify-center px-4 py-8">
                    <p className="text-[13px] text-muted-foreground">
                      Sin cotizaciones aún
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentQuotes.map((qt) => (
                      <div
                        key={qt.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground tabular-nums">
                            {qt.quote_number}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {customerMap[qt.customer_id] ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[12px] font-medium text-foreground tabular-nums">
                            {fmtMoney(qt.total)}
                          </span>
                          <StatusBadge status={qt.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Section>

          {/* ── Activity feed ── */}
          {(customersLoading || jobsLoading || quotesLoading || activityItems.length > 0) && (
            <Section title="Actividad reciente">
              <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                {customersLoading || jobsLoading || quotesLoading ? (
                  <div className="divide-y divide-border">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <Skel className="size-6 rounded-full shrink-0" />
                        <Skel className="h-3 flex-1 max-w-52" />
                        <Skel className="h-3 w-14 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : activityItems.length === 0 ? (
                  <div className="flex items-center justify-center px-4 py-8">
                    <p className="text-[13px] text-muted-foreground">
                      Sin actividad reciente
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {activityItems.map((item) => {
                      const { Icon, iconColor, label, entity, href, at } = item;
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="size-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                            <Icon className={`size-3 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                            <span className="text-[13px] text-muted-foreground shrink-0">
                              {label}
                            </span>
                            <span className="text-[13px] text-foreground font-medium truncate">
                              {entity}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">
                            {relativeTime(at)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Revenue ── */}
          <Section title="Ingresos">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                accent
                label="Ingresos completados"
                value={fmtMoney(data.completed_job_revenue)}
                sub="De trabajos finalizados"
              />
              <StatCard
                accent
                label="Cotizaciones aceptadas"
                value={fmtMoney(data.accepted_quote_value)}
                sub="Valor total aceptado"
              />
              <StatCard
                accent
                label="Total cotizado"
                value={fmtMoney(data.total_quoted_value)}
                sub="Suma de todas las cotizaciones"
              />
            </div>
          </Section>

          {/* ── Status breakdown ── */}
          <Section title="Desglose">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatusCard
                title="Trabajos por estado"
                statuses={data.jobs_by_status}
                order={JOB_STATUS_ORDER}
              />
              <StatusCard
                title="Cotizaciones por estado"
                statuses={data.quotes_by_status}
                order={QUOTE_STATUS_ORDER}
              />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
