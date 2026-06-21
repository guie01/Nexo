"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useProvider, useCreateMyProvider } from "@/hooks/use-provider";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SERVICE_CATEGORIES = [
  "Electricidad",
  "Plomería",
  "Carpintería",
  "Pintura",
  "Climatización (HVAC)",
  "Jardinería y paisajismo",
  "Limpieza",
  "Construcción general",
  "Instalaciones de seguridad",
  "Telecomunicaciones",
  "Mudanzas",
  "Otro",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  service_category: "",
  city: "",
  country: "",
  description: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: provider, isLoading: providerLoading } = useProvider();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const { mutate, isPending } = useCreateMyProvider();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Forward guard: already has provider → go to dashboard
  useEffect(() => {
    if (!providerLoading && provider) {
      router.replace("/dashboard");
    }
  }, [providerLoading, provider, router]);

  // Pre-fill email from user account when available
  useEffect(() => {
    if (me?.email) {
      setForm((prev) => ({ ...prev, email: prev.email || me.email }));
    }
  }, [me]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre del negocio es requerido.");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo electrónico es requerido.");
      return;
    }

    const payload: Record<string, string> = {
      name: form.name.trim(),
      email: form.email.trim(),
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.service_category) payload.service_category = form.service_category;
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.country.trim()) payload.country = form.country.trim();
    if (form.description.trim()) payload.description = form.description.trim();

    mutate(payload as any, {
      onSuccess: () => {
        toast.success("¡Negocio configurado! Bienvenido a Nexo.");
        router.push("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.response?.data?.detail ?? "Error al crear el negocio.");
      },
    });
  }

  // Still checking provider status
  if (providerLoading) return null;
  // Already redirecting if provider exists
  if (provider) return null;

  const firstName = me?.full_name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Brand mark */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="relative size-8 shrink-0">
          <Image src="/logo.png" alt="Nexo" fill sizes="32px" className="object-contain" />
        </div>
        <span className="font-brand text-[15px] font-semibold text-foreground tracking-tight">
          Nexo
        </span>
      </div>

      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">
            {firstName ? `Bienvenido, ${firstName}` : "Configura tu negocio"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Cuéntanos sobre tu negocio para comenzar a gestionar clientes y trabajos.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border bg-card shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Business name */}
            <div className="space-y-1.5">
              <Label htmlFor="ob-name">
                Nombre del negocio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ob-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="García Electricidad"
                autoFocus
              />
            </div>

            {/* Service category */}
            <div className="space-y-1.5">
              <Label htmlFor="ob-category">Categoría de servicio</Label>
              <select
                id="ob-category"
                name="service_category"
                value={form.service_category}
                onChange={handleChange}
                className="h-8 w-full rounded-lg border border-input bg-white/5 px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 text-foreground"
              >
                <option value="">Seleccionar categoría…</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-email">
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ob-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contacto@negocio.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-phone">Teléfono</Label>
                <Input
                  id="ob-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            {/* City + Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-city">Ciudad</Label>
                <Input
                  id="ob-city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ciudad de México"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-country">País</Label>
                <Input
                  id="ob-country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="México"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ob-description">Descripción del negocio</Label>
              <Textarea
                id="ob-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Breve descripción de los servicios que ofreces…"
              />
            </div>

            {error && (
              <p className="text-[12px] text-destructive leading-snug">{error}</p>
            )}

            <div className="pt-1">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creando negocio…" : "Comenzar a usar Nexo"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
