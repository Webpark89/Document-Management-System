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
const API_BASE = typeof window !== "undefined"
  ? ""
  : "http://127.0.0.1:4000";

type ApiResponse<T> = { data: T };

/** Retry on ECONNREFUSED (server not yet ready) with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 1): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = (err as any)?.message?.toLowerCase() ?? "";
      const isConnErr =
        msg.includes("econnrefused") ||
        msg.includes("failed to fetch") ||
        msg.includes("network request failed") ||
        (err as any)?.name === "TypeError";
      if (!isConnErr || i === maxAttempts - 1) break;
      // Removed exponential backoff to prevent sluggish UI
    }
  }
  throw lastErr;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return withRetry(async () => {
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
          if (
            typeof window !== "undefined" && 
            !window.location.pathname.startsWith("/login") &&
            !path.includes("login") &&
            !path.includes("password")
          ) {
            window.location.href = "/login";
          }
        }
        if (res.status >= 500) {
          return Promise.reject("ไม่สามารถเชื่อมต่อกับserverได้");
        }
        
        let serverMessage = `API Error: ${res.status} ${res.statusText}`;
        if (res.status === 401) {
          serverMessage = "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง";
        }
        
        try {
          const errorData = await res.json();
          if (errorData?.message) {
            serverMessage = Array.isArray(errorData.message)
              ? errorData.message.join(", ")
              : errorData.message;
          }
        } catch {}
        
        // Use Promise.reject with string to avoid Next.js Red Screen of Death
        return Promise.reject(serverMessage);
      }

      const data = await res.json();
      return { data };
    } catch (err: unknown) {
      if ((err as any)?.name === "TypeError" || (err as any)?.message?.toLowerCase().includes("fetch")) {
        return Promise.reject("ไม่สามารถเชื่อมต่อกับserverได้");
      }
      return Promise.reject(err);
    }
  });
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

