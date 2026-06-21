"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useProvider } from "./use-provider";

export interface QuoteUpdate {
  status?: QuoteStatus;
  notes?: string | null;
  valid_until?: string | null;
}

export interface QuoteItemUpdate {
  description?: string;
  quantity?: number;
  unit_price?: number;
}

export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft:    ["sent"],
  sent:     ["accepted", "rejected", "expired"],
  rejected: ["draft"],
  expired:  ["draft"],
  accepted: [],
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export const QUOTE_STATUSES: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  expired: "Vencido",
};

export interface QuoteItem {
  id: number;
  quote_id: number;
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
}

export interface Quote {
  id: number;
  provider_id: number;
  customer_id: number;
  job_id: number | null;
  quote_number: string;
  status: QuoteStatus;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  items: QuoteItem[];
}

export interface QuoteCreate {
  provider_id: number;
  customer_id: number;
  job_id?: number;
  notes?: string;
  valid_until?: string;
}

export interface QuoteItemCreate {
  description: string;
  quantity: number;
  unit_price: number;
}

export function useQuotes() {
  const { data: provider } = useProvider();
  const providerId = provider?.id;

  return useQuery<Quote[]>({
    queryKey: ["quotes", providerId],
    queryFn: async () => {
      const { data } = await api.get("/quotes/", {
        params: { provider_id: providerId, limit: 100 },
      });
      return data;
    },
    enabled: !!providerId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateQuote() {
  return useMutation({
    mutationFn: async (payload: QuoteCreate) => {
      const { data } = await api.post("/quotes/", payload);
      return data as Quote;
    },
  });
}

export function useAddQuoteItem() {
  return useMutation({
    mutationFn: async ({
      quoteId,
      item,
    }: {
      quoteId: number;
      item: QuoteItemCreate;
    }) => {
      const { data } = await api.post(`/quotes/${quoteId}/items`, item);
      return data as Quote;
    },
  });
}

export function useUpdateQuote() {
  return useMutation({
    mutationFn: async ({
      quoteId,
      payload,
    }: {
      quoteId: number;
      payload: QuoteUpdate;
    }) => {
      const { data } = await api.patch(`/quotes/${quoteId}`, payload);
      return data as Quote;
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: number) => {
      await api.delete(`/quotes/${quoteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateQuoteItem() {
  return useMutation({
    mutationFn: async ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: QuoteItemUpdate;
    }) => {
      const { data } = await api.patch(`/quote-items/${itemId}`, payload);
      return data as Quote;
    },
  });
}

export function useDeleteQuoteItem() {
  return useMutation({
    mutationFn: async (itemId: number) => {
      await api.delete(`/quote-items/${itemId}`);
    },
  });
}
