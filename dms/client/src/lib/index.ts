import { apiClient, API_BASE_URL } from "./api-client";

export { cn } from "./utils";
export { apiClient, API_BASE_URL };

// ---- Cookie helpers (HttpOnly Session) ----
export function getStoredAccessToken(): string | null {
  // Always return 'session_active' if auth cookie present or stubbed
  if (typeof window === "undefined") return null;
  // Let document.cookie check for fallback, but fetch uses credentials now
  return document.cookie.includes("access_token") ? "session_active" : null;
}

export function persistAccessToken(token: string): void {
  // Handled by HttpOnly Cookie from Backend
}

export function clearAccessToken(): void {
  // Handled by /api/auth/logout on Backend
}

// ---- Safe API Wrapper ----
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiResponse<T> = { data: T };

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include", // Crucial for sending/receiving HttpOnly cookies
      body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
          return new Promise(() => {}); // Halt execution during redirect to avoid error overlay
        }
      }
      let serverMessage = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData?.message) {
          serverMessage = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message;
        }
      } catch {}
      throw new Error(serverMessage);
    }

    const data = await res.json();
    return { data };
  } catch (err: any) {
    if (err?.name === "TypeError" || err?.message?.toLowerCase().includes("fetch")) {
      throw new Error(
        "ไม่สามารถเชื่อมต่อ Backend Server ได้ (กรุณารัน `npm run dev` ที่โฟลเดอร์หลักเพื่อเปิด NestJS พอร์ต 4000)"
      );
    }
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
