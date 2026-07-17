"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  api,
  clearAccessToken,
  getStoredAccessToken,
  persistAccessToken,
} from "@/lib";

type AuthUser = {
  id: string;
  full_name: string;
  username: string;
  role: string;
  department: string | null;
  email?: string;
  employee_id?: string;
  position?: string;
  joined_at?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const globalForAuth = globalThis as unknown as {
  AuthContext: React.Context<AuthContextValue | undefined>
};

const AuthContext = globalForAuth.AuthContext || createContext<AuthContextValue | undefined>(undefined);
if (process.env.NODE_ENV !== "production") {
  globalForAuth.AuthContext = AuthContext;
}

const PUBLIC_ROUTES = ["/auth/login", "/auth", "/login", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    persistAccessToken(token);
    api
      .get<AuthUser>("/api/auth/me")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        // Backend not connected — use mock user for frontend dev
        setUser({
          id: "u1",
          full_name: "Administrator",
          username: "admin",
          role: "Administrator",
          department: "แผนก IT",
          email: "admin@company.com",
          employee_id: "EMP-001",
          position: "ผู้ดูแลระบบ",
          joined_at: "2024-03-15T00:00:00Z",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const hasToken = Boolean(getStoredAccessToken());

    // Dev mode: auto-inject mock token to skip login during development
    if (!user && !isPublic && !hasToken) {
      // Auto-set a mock token so we don't redirect every page refresh during dev
      persistAccessToken("mock-dev-token");
      setUser({
        id: "u1",
        full_name: "Administrator",
        username: "admin",
        role: "Administrator",
        department: "แผนก IT",
        email: "admin@company.com",
        employee_id: "EMP-001",
        position: "ผู้ดูแลระบบ",
        joined_at: "2024-03-15T00:00:00Z",
      });
      setLoading(false);
      return;
    }

    if (user && pathname.startsWith("/auth")) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post<{ access_token: string; user: AuthUser }>(
        "/api/auth/login",
        { username: username.trim(), password }
      );
      const { access_token, user: profile } = response.data;
      persistAccessToken(access_token);
      await Promise.resolve();
      setUser(profile);
      return profile;
    } catch {
      // Mock login fallback for dev
      const mockUser: AuthUser = {
        id: "u1",
        full_name: username,
        username,
        role: "Administrator",
        department: "แผนก IT",
        email: `${username}@company.com`,
        employee_id: "EMP-001",
        position: "ผู้ดูแลระบบ",
        joined_at: "2024-03-15T00:00:00Z",
      };
      persistAccessToken("mock-dev-token");
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = () => {
    clearAccessToken();
    setUser(null);
    router.replace("/login");
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
