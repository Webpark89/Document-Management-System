"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from "recharts";
import { EmployeeDashboard } from "@views/components/dashboard/EmployeeDashboard";
import { ExecutiveDashboard } from "@views/components/dashboard/ExecutiveDashboard";
import { getDocuments } from '@views/features/documents/api';
import { dashboardService, DashboardStats } from '@/controllers/services/dashboard.service';
import { useAuth } from '@views/components/providers/AuthProvider';
import { formatThaiDate } from '@/lib/format-date';
import PageHeader from '@views/components/shared/PageHeader';
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { AppStatCard, StatCardGrid } from '@views/components/ui/AppStatCard';
import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
  APP_TABLE_CARD,
  APP_CARD,
  APP_CARD_LG,
  MD_THEAD,
  MD_TR,
} from '@views/components/ui/design-system';

const STATUS_COLORS = {
  Approved: "#10b981", // emerald-500
  Pending: "#f59e0b",  // amber-500
  Returned: "#f97316", // orange-500
  Cancelled: "#64748b" // slate-500
};

const TYPE_COLORS = {
  PR: "#3b82f6", // blue-500
  PO: "#a855f7", // purple-500
  BK: "#10b981", // emerald-500
  DOC: "#f59e0b", // amber-500
  Other: "#64748b"
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  const canViewEmployee = user?.permissions?.includes('dashboard:view_employee') || user?.permissions?.includes('dashboard.view_employee:view') || user?.permissions?.includes('dashboard_employee.view_employee:view') || false;
  const canViewExecutive = user?.permissions?.includes('dashboard:view_executive') || user?.permissions?.includes('dashboard.view_executive:view') || user?.permissions?.includes('dashboard_executive.view_executive:view') || false;

  const [activeView, setActiveView] = useState<"employee" | "executive">("employee");

  React.useEffect(() => {
    if (canViewExecutive) {
      setActiveView("executive");
    } else {
      setActiveView("employee");
    }
  }, [canViewExecutive]);

  // Load data ...
  React.useEffect(() => {
    Promise.all([
      getDocuments().catch(() => []),
      dashboardService.getStats().catch(() => null),
    ]).then(([docs, statsData]) => {
      const mapped = docs.map((d: any) => ({
        id: d.id,
        title: d.title || d.name,
        type: d.type,
        department: d.department || d.creator?.department?.name || "ทั่วไป",
        status: d.status,
        submittedBy: d.sender || d.creator_name || d.creator?.first_name || "ระบบ",
        creator_id: d.creator_id || d.creator?.id,
        creator: d.creator,
        date: d.submittedDate || d.created_at,
        value: typeof d.amount === "string" ? parseFloat(d.amount.replace(/[^0-9.-]+/g,"")) : (d.amount || 0),
        approvers: d.approvers || [],
        workflow: d.workflow || null
      }));
      setDocuments(mapped);
      setStats(statsData);
    }).finally(() => setLoading(false));

    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDepartments(data.map((d: any) => d.name || d));
      })
      .catch(() => {});
  }, []);

  const displayName = user?.full_name || user?.username || "ผู้ใช้งาน";

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      {/* HEADER & TOGGLE */}
      <PageHeader
        title="ภาพรวมแดชบอร์ด"
        subtitle={`ยินดีต้อนรับกลับ, ${displayName}`}
        actions={
          canViewEmployee && canViewExecutive && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView("executive")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === "executive"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                มุมมองผู้บริหาร
              </button>
              <button
                type="button"
                onClick={() => setActiveView("employee")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === "employee"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                มุมมองพนักงาน
              </button>
            </div>
          )
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-medium text-sm">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      ) : activeView === "executive" ? (
        <ExecutiveDashboard documents={documents} stats={stats} departments={departments} />
      ) : (
        <EmployeeDashboard documents={documents} stats={stats} />
      )}

      </div>
    </div>
  );
}
