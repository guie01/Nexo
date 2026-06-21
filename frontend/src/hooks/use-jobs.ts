"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useProvider } from "./use-provider";

export type JobStatus =
  | "new"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export const JOB_STATUSES: JobStatus[] = [
  "new",
  "quoted",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export const STATUS_LABELS: Record<JobStatus, string> = {
  new: "Nuevo",
  quoted: "Cotizado",
  scheduled: "Agendado",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
};

// Mirrors backend VALID_TRANSITIONS — only valid next states shown to user
export const NEXT_STATUSES: Record<JobStatus, JobStatus[]> = {
  new: ["quoted", "cancelled"],
  quoted: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export interface Job {
  id: number;
  provider_id: number;
  customer_id: number;
  title: string;
  description: string | null;
  status: JobStatus;
  scheduled_date: string | null;
  completed_date: string | null;
  estimated_price: string | null;
  final_price: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  provider_id: number;
  customer_id: number;
  title: string;
  description?: string;
  scheduled_date?: string;
  estimated_price?: number;
  address?: string;
}

export interface JobUpdate {
  status?: JobStatus;
  title?: string;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  estimated_price?: number;
  final_price?: number;
  address?: string;
}

export function useJobs(status?: JobStatus) {
  const { data: provider } = useProvider();
  const providerId = provider?.id;

  return useQuery<Job[]>({
    queryKey: ["jobs", providerId, status ?? "all"],
    queryFn: async () => {
      const { data } = await api.get("/jobs/", {
        params: {
          provider_id: providerId,
          limit: 100,
          ...(status ? { status } : {}),
        },
      });
      return data;
    },
    enabled: !!providerId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: JobCreate) => {
      const { data } = await api.post("/jobs/", payload);
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & JobUpdate) => {
      const { data } = await api.patch(`/jobs/${id}`, payload);
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
