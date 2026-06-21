"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProvider, createMyProvider, getToken, type Provider, type ProviderCreatePayload } from "@/lib/auth";

export type { Provider };

export function useProvider() {
  return useQuery<Provider>({
    queryKey: ["me", "provider"],
    queryFn: getMyProvider,
    enabled: !!getToken(),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useCreateMyProvider() {
  const queryClient = useQueryClient();
  return useMutation<Provider, Error, ProviderCreatePayload>({
    mutationFn: createMyProvider,
    onSuccess: (provider) => {
      queryClient.setQueryData(["me", "provider"], provider);
    },
  });
}
