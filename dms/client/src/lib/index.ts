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
const API_BASE = typeof window !== "undefined" ? "" : "http://127.0.0.1:4000";

type ApiResponse<T> = { data: T };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  // Only reads can be repeated safely when the backend is restarting.
  const maxAttempts = method === "GET" ? 5 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    try {
      let res: Response;
      try {
        res = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          credentials: "include", // Crucial for sending/receiving HttpOnly cookies
          body: isFormData
            ? body
            : body !== undefined
              ? JSON.stringify(body)
              : undefined,
        });
      } catch {
        throw new ApiError(
          "ไม่สามารถติดต่อ server ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
          0,
          method,
          path,
          true,
        );
      }

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
        let serverMessage = `ระบบทำงานผิดพลาด (HTTP ${res.status}) กรุณาลองใหม่`;
        if (res.status === 401) {
          serverMessage = "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง";
        }

        let hasServerMessage = false;
        try {
          const errorData: unknown = await res.json();
          if (
            errorData &&
            typeof errorData === "object" &&
            "message" in errorData
          ) {
            const message = errorData.message;
            if (typeof message === "string" && message.trim()) {
              serverMessage = message;
              hasServerMessage = true;
            } else if (
              Array.isArray(message) &&
              message.every((m) => typeof m === "string") &&
              message.length
            ) {
              serverMessage = message.join(", ");
              hasServerMessage = true;
            }
          }
        } catch {
          // The Next.js proxy can return plain text while Nest is restarting.
        }
        const unavailable =
          [502, 504].includes(res.status) ||
          (res.status >= 500 && !hasServerMessage);
        if (unavailable && !hasServerMessage) {
          serverMessage =
            res.status === 504
              ? "server ใช้เวลาตอบกลับนานเกินไป กรุณาลองใหม่"
              : "server ยังไม่พร้อมใช้งาน กรุณารอสักครู่แล้วลองใหม่";
        }
        throw new ApiError(
          serverMessage,
          res.status,
          method,
          path,
          unavailable,
        );
      }

      if (res.status === 204) return { data: undefined as T };
      const data = await res.json();
      return { data };
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        err.retryable &&
        attempt < maxAttempts - 1
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
        continue;
      }
      throw err;
    }
  }
  throw new Error("API request did not complete");
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
