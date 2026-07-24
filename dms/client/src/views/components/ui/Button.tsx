import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ElementType;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm",
    outline:
      "border border-[--color-border] bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400",
    ghost:
      "text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400",
  };

  const sizes = {
    sm: "rounded-lg px-2.5 py-1.5 text-xs gap-1.5",
    md: "rounded-lg px-4 py-2 text-sm gap-2",
    lg: "rounded-xl px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
