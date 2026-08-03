"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Check if user is Administrator
  if (!user || user.role !== "Administrator") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-sm border border-rose-100">
          <ShieldAlert className="size-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">403 Access Denied</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500 max-w-md">
          คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าระบบ (Admin Only) หน้านี้อนุญาตเฉพาะผู้ดูแลระบบที่มีสิทธิ์ Administrator เท่านั้น
        </p>
        <Link
          href="/dashboard"
          className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 shadow-sm"
        >
          <ArrowLeft className="size-4" />
          กลับสู่หน้า Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
