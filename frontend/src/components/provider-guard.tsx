"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProvider } from "@/hooks/use-provider";

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  const { data: provider, isLoading, isError } = useProvider();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !provider)) {
      router.push("/onboarding");
    }
  }, [isLoading, isError, provider, router]);

  if (isLoading || !provider) return null;

  return <>{children}</>;
}
