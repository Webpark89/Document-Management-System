"use client";

import { Bell, Search } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-[--color-border] bg-white px-6">
      {/* Page Title */}
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 transition-all"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[--color-border] bg-white shadow-lg flex flex-col overflow-hidden">
              <div className="border-b border-[--color-border] px-4 py-3 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700">การแจ้งเตือน</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    href={
                      n.message.includes("รออนุมัติ")
                        ? `/approvals/${n.document_id}`
                        : `/documents/${n.document_id}`
                    }
                    onClick={() => setShowNotifications(false)}
                    className={cn(
                      "block border-b border-[--color-border] px-4 py-3 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer text-left",
                      !n.is_read && "bg-blue-50/30"
                    )}
                  >
                    <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      {new Date(n.created_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </Link>
                ))}
              </ul>
              <Link 
                href="/notifications"
                onClick={() => setShowNotifications(false)}
                className="block text-center border-t border-[--color-border] bg-slate-50 py-2.5 text-xs font-bold text-blue-600 hover:bg-slate-100 hover:text-blue-700 transition-colors"
              >
                ดูการแจ้งเตือนทั้งหมด
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
