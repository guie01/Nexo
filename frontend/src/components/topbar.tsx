"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/use-me";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Panel",
  "/customers": "Clientes",
  "/jobs": "Trabajos",
  "/quotes": "Cotizaciones",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { data: user } = useMe();

  const current = ROUTE_LABELS[pathname] ?? "Nexo";

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <header className="h-11 shrink-0 flex items-center justify-between px-4 bg-card border-b border-border">
      <div className="flex items-center gap-2.5">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="size-4" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px]">
          <span className="hidden sm:inline text-muted-foreground/50 select-none">Nexo</span>
          <span className="hidden sm:inline text-muted-foreground/30 mx-0.5 select-none">/</span>
          <span className="font-medium text-foreground">{current}</span>
        </nav>
      </div>

      {/* User avatar */}
      <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-semibold select-none cursor-default bg-primary/10 text-primary border border-primary/20">
        {initials}
      </div>
    </header>
  );
}
