import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card px-4 py-4 shadow-sm",
        accent && "border-t-2 border-t-primary"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2.5 text-[28px] font-semibold tracking-[-0.02em] tabular-nums leading-none text-foreground">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[12px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
