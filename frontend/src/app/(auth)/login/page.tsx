import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px]">
      {/* Left — brand panel with background image */}
      <div className="hidden lg:flex relative flex-col justify-between px-12 py-10 overflow-hidden">
        <Image
          src="/nexo-background.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for text legibility */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 z-10">
          <div className="relative size-7 shrink-0">
            <Image src="/logo.png" alt="Nexo" fill sizes="32px" className="object-contain" />
          </div>
          <span className="text-[14px] font-brand font-semibold text-white tracking-tight">
            Nexo
          </span>
        </div>

        {/* Quote */}
        <div className="relative z-10 space-y-3 max-w-sm">
          <p className="text-[22px] font-semibold text-white leading-[1.3] tracking-[-0.01em]">
            Administra tu negocio de servicios como un profesional.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed">
            Trabajos, clientes y cotizaciones — todo en un solo lugar.
            Diseñado para técnicos y proveedores de servicios.
          </p>
        </div>

        <p className="relative z-10 text-[11px] text-white/30 select-none">© 2026 Nexo</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="relative size-7 shrink-0">
              <Image src="/logo.png" alt="Nexo" fill sizes="32px" className="object-contain" />
            </div>
            <span className="font-brand text-[14px] font-semibold tracking-tight">Nexo</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-[18px] font-semibold tracking-[-0.01em]">
              Iniciar sesión
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Ingresa tus credenciales para acceder a tu espacio de trabajo.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-md border bg-card shadow-sm">
            <div className="p-5">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
