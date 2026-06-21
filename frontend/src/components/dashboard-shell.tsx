"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { Topbar } from "@/components/topbar";
import { ProviderGuard } from "@/components/provider-guard";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* ── Desktop sidebar — hidden below lg ─────────────────────────────── */}
      <aside className="hidden lg:flex w-55 shrink-0 flex-col bg-sidebar">
        <div className="h-11 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
          <div className="relative size-7 shrink-0">
            <Image src="/logo.png" alt="Nexo" fill sizes="32px" className="object-contain" />
          </div>
          <span className="font-brand text-[14px] font-semibold text-white tracking-tight">
            Nexo
          </span>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="border-t border-sidebar-border shrink-0">
          <UserMenu />
        </div>
      </aside>

      {/* ── Mobile drawer — visible below lg when open ────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in duration-150"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="absolute left-0 top-0 h-full w-64 max-w-[80vw] flex flex-col bg-sidebar animate-in slide-in-from-left duration-200">
            {/* Brand + close */}
            <div className="h-11 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative size-7 shrink-0">
                  <Image src="/logo.png" alt="Nexo" fill sizes="32px" className="object-contain" />
                </div>
                <span className="font-brand text-[14px] font-semibold text-white tracking-tight">
                  Nexo
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-white/40 hover:text-white transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* Nav — onNavigate closes drawer on link click */}
            <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            {/* User */}
            <div className="border-t border-sidebar-border shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>
      )}

      {/* ── Content shell ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-background">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <ProviderGuard>{children}</ProviderGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
