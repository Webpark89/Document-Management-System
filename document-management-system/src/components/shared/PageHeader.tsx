"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  size?: "default" | "compact";
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  size = "default",
  actions,
  className,
}: PageHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;

  const { user } = useAuth();
  const displayName = user?.full_name || user?.username || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={cn("flex items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h2
          className={cn(
            "font-bold text-slate-900",
            size === "compact" ? "text-xl" : "text-2xl"
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "text-slate-400 font-semibold",
              size === "compact" ? "text-xs" : "text-sm"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 transition-all"
          >
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm border-2 border-white">
                {unreadCount}
              </span>
            )}
            <Bell className="w-5 h-5 text-slate-500" />
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden text-left">
              <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50 flex justify-between items-center">
                <p className="text-sm font-bold text-slate-700">การแจ้งเตือน</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer",
                      !n.is_read && "bg-blue-50/30"
                    )}
                  >
                    <p className="text-sm text-slate-700 leading-snug font-medium">{n.message}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      {new Date(n.created_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
              <Link 
                href="/notifications"
                onClick={() => setShowNotifications(false)}
                className="block text-center border-t border-slate-100 bg-slate-50 py-3 text-xs font-bold text-blue-600 hover:bg-slate-100 hover:text-blue-700 transition-colors"
              >
                ดูการแจ้งเตือนทั้งหมด
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-slate-700 hidden md:block">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
