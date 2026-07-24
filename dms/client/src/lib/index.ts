// ============================================================
// src/lib/index.ts — barrel export for friend's @/lib imports
// Exports api axios instance + token helpers used by AuthProvider
// ============================================================

import { apiClient, API_BASE_URL } from "./api-client";

export { cn } from "./utils";
export { apiClient, API_BASE_URL };

// ---- Token helpers (localStorage + httpOnly fallback for frontend) ----
const TOKEN_KEY = "dms_access_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function persistAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ---- Safe API Wrapper ----
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiResponse<T> = { data: T };

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      console.warn(`[API Warning] ${method} ${path} returned status ${res.status}`);
      throw new Error(`API ${method} ${path} → ${res.status}`);
    }

    const data = await res.json();
    return { data };
  } catch (err: any) {
    console.warn(`[API Catch] ${method} ${path} failed:`, err?.message || err);
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
