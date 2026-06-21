import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  // Job statuses — stronger tints at /20 so badges read on hover rows too
  new:         "bg-zinc-500/12 text-zinc-400 border-zinc-500/20",
  quoted:      "bg-violet-500/20 text-violet-300 border-violet-500/30",
  scheduled:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled:   "bg-zinc-500/10 text-zinc-500 border-zinc-500/18",
  // Quote statuses
  draft:    "bg-zinc-500/12 text-zinc-400 border-zinc-500/20",
  sent:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/25",
  expired:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  // Legacy/shared
  pending:  "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = statusMap[status] ?? "bg-zinc-500/12 text-zinc-400 border-zinc-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        classes,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const variantMap = {
  default: "bg-secondary text-secondary-foreground border-transparent",
  outline: "border-border text-muted-foreground bg-transparent",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  error:   "bg-red-500/15 text-red-400 border-red-500/25",
  info:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
} as const;

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variantMap;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
