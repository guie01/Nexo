"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useProvider } from "./use-provider";

export interface ProviderDashboard {
  provider_id: number;
  total_customers: number;
  total_jobs: number;
  jobs_by_status: Record<string, number>;
  total_quotes: number;
  quotes_by_status: Record<string, number>;
  total_quoted_value: string;
  accepted_quote_value: string;
  completed_job_revenue: string;
  average_job_value: string;
}

export function useDashboard() {
  const { data: provider } = useProvider();
  const providerId = provider?.id;

  return useQuery<ProviderDashboard>({
    queryKey: ["dashboard", providerId],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/providers/${providerId}`);
      return data;
    },
    enabled: !!providerId,
    retry: false,
  });
}
