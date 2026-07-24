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
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const hasToken = Boolean(getStoredAccessToken());

    if (!user && !isPublic && !hasToken) {
      router.replace("/login");
      return;
    }

    if (user && (pathname === "/login" || pathname.startsWith("/auth"))) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string) => {
    const response = await api.post<{ access_token: string; user: AuthUser }>(
      "/api/auth/login",
      { username: username.trim(), password }
    );
    const { access_token, user: profile } = response.data;
    persistAccessToken(access_token);
    setUser(profile);
    return profile;
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
