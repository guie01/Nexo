"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { useMe } from "@/hooks/use-me";

export function UserMenu() {
  const { data: user } = useMe();

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
    <div className="px-2.5 py-2.5">
      <div className="group flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/5 transition-colors">
        {/* Avatar */}
        <div className="size-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-white/55 leading-none select-none">
            {initials}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-white/65 truncate leading-none">
            {user?.full_name ?? user?.email ?? "Cuenta"}
          </p>
          {user?.full_name && user?.email && (
            <p className="text-[11px] text-white/28 truncate mt-0.5 leading-none">
              {user.email}
            </p>
          )}
        </div>

        {/* Logout — always visible on mobile, hover-only on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
          aria-label="Cerrar sesión"
          className="p-1 rounded text-white/35 hover:text-white/70 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
