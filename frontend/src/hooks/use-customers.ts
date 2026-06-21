"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useProvider } from "./use-provider";

export interface Customer {
  id: number;
  provider_id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  provider_id: number;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export function useCustomers() {
  const { data: provider } = useProvider();
  const providerId = provider?.id;

  return useQuery<Customer[]>({
    queryKey: ["customers", providerId],
    queryFn: async () => {
      const { data } = await api.get("/customers/", {
        params: { provider_id: providerId, limit: 100 },
      });
      return data;
    },
    enabled: !!providerId,
    retry: false,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomerCreate) => {
      const { data } = await api.post("/customers/", payload);
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
