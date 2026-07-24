"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  type?: ToastType;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  type = "info",
  message,
  isOpen,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="size-5 text-green-500" />,
    error: <AlertCircle className="size-5 text-red-500" />,
    info: <Info className="size-5 text-blue-500" />,
  };

  const bgStyles = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
      <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", bgStyles[type])}>
        {icons[type]}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
