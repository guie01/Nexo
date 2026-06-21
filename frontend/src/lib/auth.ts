import api from "./api";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Provider {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  description: string | null;
  phone: string | null;
  service_category: string | null;
  city: string | null;
  country: string | null;
}

export interface ProviderCreatePayload {
  name: string;
  email: string;
  description?: string;
  phone?: string;
  service_category?: string;
  city?: string;
  country?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

const TOKEN_KEY = "access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  setToken(data.access_token);
}

export function logout(): void {
  removeToken();
  window.location.href = "/login";
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/me");
  return data;
}

export async function getMyProvider(): Promise<Provider> {
  const { data } = await api.get<Provider>("/me/provider");
  return data;
}

export async function createMyProvider(payload: ProviderCreatePayload): Promise<Provider> {
  const { data } = await api.post<Provider>("/me/provider", payload);
  return data;
}
