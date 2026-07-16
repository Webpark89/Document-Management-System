"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  icon,
  isActive = false,
  onClick,
  trend,
  trendType = "neutral",
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:-translate-y-0.5 rounded-2xl bg-white p-10 shadow-sm border ${
        isActive
          ? "border-indigo-300 ring-1 ring-indigo-200/40"
          : "border-transparent"
      }`}
    >
      <CardContent className="p-0 flex items-start justify-between gap-6">
        <div className="space-y-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider block truncate">
            {title}
          </span>
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight block">
            {value}
          </span>
          {trend && (
            <span
              className={`text-sm font-semibold inline-flex items-center gap-1 ${
                trendType === "up"
                  ? "text-emerald-700"
                  : trendType === "down"
                  ? "text-rose-600"
                  : "text-slate-500"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="shrink-0 self-start">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default StatCard;

type StatCardRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function StatCardRow({ children, className }: StatCardRowProps) {
  return (
    <div className={cn("mb-10 grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
