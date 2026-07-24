"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCircle2, 
  FileText, 
  Clock, 
  XCircle, 
  RefreshCw,
  Check
} from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  NotificationItem 
} from '@views/features/notifications/api';

type EventType = "new" | "pending" | "approved" | "returned" | "cancelled";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Unread" | "Read">("All");

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifs = useMemo(() => {
    let result = notifications;
    if (activeTab === "Unread") result = result.filter(n => !n.is_read);
    if (activeTab === "Read") result = result.filter(n => n.is_read);
    
    // Always newest first
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [notifications, activeTab]);

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getIcon = (type: EventType) => {
    switch(type) {
      case "new": return <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>;
      case "pending": return <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Clock className="w-5 h-5" /></div>;
      case "approved": return <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>;
      case "returned": return <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><RefreshCw className="w-5 h-5" /></div>;
      case "cancelled": return <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><XCircle className="w-5 h-5" /></div>;
    }
  };

  const getRelativeTime = (isoString: string) => {
    const rtf = new Intl.RelativeTimeFormat("th", { numeric: "auto" });
    const daysDifference = Math.round((new Date(isoString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) {
      const hoursDifference = Math.round((new Date(isoString).getTime() - new Date().getTime()) / (1000 * 60 * 60));
      if (hoursDifference === 0) return "เพิ่งเมื่อสักครู่";
      return rtf.format(hoursDifference, "hour");
    }
    return rtf.format(daysDifference, "day");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
      <PageHeader
        title="ศูนย์การแจ้งเตือน (Notification Center)"
        subtitle="ติดตามความเคลื่อนไหวของเอกสารและงานที่ต้องพิจารณา"
        actions={
          <button 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
        {/* TABS */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 bg-slate-50/50">
          {(["All", "Unread", "Read"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "All" && "ทั้งหมด"}
              {tab === "Unread" && `ยังไม่อ่าน (${unreadCount})`}
              {tab === "Read" && "อ่านแล้ว"}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="flex flex-col divide-y divide-slate-100">
          {filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-sm">ไม่มีรายการแจ้งเตือน</p>
            </div>
          ) : (
            filteredNotifs.map(n => {
              const notifType: EventType = n.message.includes("รออนุมัติ") 
                ? "pending" 
                : n.message.includes("ได้รับการอนุมัติ") 
                ? "approved" 
                : n.message.includes("ถูกส่งกลับ") 
                ? "returned" 
                : "new";
              return (
                <Link 
                  key={n.id}
                  href={n.document_id ? (notifType === "pending" ? `/approvals/${n.document_id}` : `/documents/${n.document_id}`) : "#"}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    !n.is_read ? "bg-blue-50/20" : ""
                  }`}
                >
                  {!n.is_read && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                  
                  {getIcon(notifType)}
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={`text-sm ${!n.is_read ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {getRelativeTime(n.created_at)} • {new Date(n.created_at).toLocaleString("th-TH")}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
