"use client";

import React, { createContext, useContext, useMemo } from "react";
import { swalToast } from "@/lib/swal";

type ToastType = "success" | "error";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const globalForToast = globalThis as unknown as {
  ToastContext: React.Context<ToastContextValue | undefined>
};

const ToastContext = globalForToast.ToastContext || createContext<ToastContextValue | undefined>(undefined);
if (process.env.NODE_ENV !== "production") {
  globalForToast.ToastContext = ToastContext;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (message: string, type: ToastType = "success") => {
    swalToast(message, type);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
