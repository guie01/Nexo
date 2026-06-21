"use client";

import { useState, useEffect } from "react";

export type ToastType = "success" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const listeners = new Set<(toasts: Toast[]) => void>();
let current: Toast[] = [];

function emit() {
  const snapshot = [...current];
  listeners.forEach((fn) => fn(snapshot));
}

function add(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  current = [...current, { id, type, message }];
  emit();
  setTimeout(() => {
    current = current.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export const toast = {
  success: (message: string) => add("success", message),
  error: (message: string) => add("error", message),
};

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setToasts([...current]);
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return toasts;
}
