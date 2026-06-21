"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useToasts, type Toast } from "@/hooks/use-toast";

function ToastItem({ t }: { t: Toast }) {
  const isSuccess = t.type === "success";
  return (
    <div
      className={[
        "flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg",
        "min-w-72 max-w-sm pointer-events-auto",
        "animate-in slide-in-from-bottom-2 fade-in duration-200",
        isSuccess ? "bg-card border-border" : "bg-card border-destructive/40",
      ].join(" ")}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-px size-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="mt-px size-4 shrink-0 text-destructive" />
      )}
      <p className="text-[13px] leading-snug text-foreground">{t.message}</p>
    </div>
  );
}

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
