"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Trabajos", href: "/jobs", icon: Briefcase },
  { label: "Cotizaciones", href: "/quotes", icon: FileText },
];

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-2 h-9 px-2.5 rounded-md text-[13px] transition-colors",
              active
                ? "bg-white/10 text-white font-medium"
                : "text-white/45 hover:text-white/80 hover:bg-white/6"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
            )}
            <Icon
              className={cn(
                "size-3.5 shrink-0",
                active ? "text-primary" : "text-white/35"
              )}
            />
            {label}
          </Link>
        );
      })}
    </>
  );
}
