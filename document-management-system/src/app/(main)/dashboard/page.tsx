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
  Legend
} from "recharts";
import { MOCK_REPORT_DATA } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/AuthProvider";
import PageHeader from "@/components/shared/PageHeader";
import DataTableHeader from "@/components/ui/DataTableHeader";
import { AppStatCard, StatCardGrid } from "@/components/ui/AppStatCard";
import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
  APP_TABLE_CARD,
  APP_CARD,
  APP_CARD_LG,
  MD_THEAD,
  MD_TR,
} from "@/components/ui/design-system";

const STATUS_COLORS = {
  Approved: "#10b981", // emerald-500
  Pending: "#f59e0b",  // amber-500
  Rejected: "#f43f5e", // rose-500
  Cancelled: "#64748b" // slate-500
};

const TYPE_COLORS = {
  PR: "#3b82f6", // blue-500
  PO: "#a855f7", // purple-500
  Memo: "#10b981", // emerald-500
  Other: "#64748b" // slate-500
};

type Role = "employee" | "admin";

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("admin");
  const { user } = useAuth();

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc"); // 1st click: desc
    } else {
      if (sortDirection === "desc") {
        setSortDirection("asc"); // 2nd click: asc
      } else {
        setSortKey(null); // 3rd click: reset
        setSortDirection(null);
      }
    }
  };
  
  // Use mock current user from the requirements
  const currentUserFullname = "วิภา รักดี"; 
  
  // Clean Data based on prompt rules: Map Returned to Rejected
  const cleanData = useMemo(() => {
    return MOCK_REPORT_DATA.map(d => ({
      ...d,
      status: d.status === "Returned" ? "Rejected" : d.status
    }));
  }, []);

  // Filter Data based on role
  const dashboardData = useMemo(() => {
    if (role === "admin") return cleanData;
    return cleanData.filter(d => d.submittedBy === currentUserFullname);
  }, [role, cleanData]);

  // Sort and filter activity
  const recentActivity = useMemo(() => {
    const data = [...dashboardData];

    const statusPriority: Record<string, number> = {
      "Pending": 4,
      "Draft": 3,
      "Returned for Revision": 2,
      "Returned": 2,
      "Approved": 1,
      "Cancelled": 0,
      "Rejected": 0
    };

    if (sortKey && sortDirection) {
      data.sort((a, b) => {
        let comparison = 0;
        if (sortKey === "id") {
          comparison = a.id.localeCompare(b.id);
        } else if (sortKey === "status") {
          const priorityA = statusPriority[a.status] ?? 0;
          const priorityB = statusPriority[b.status] ?? 0;
          comparison = priorityA - priorityB;
        } else if (sortKey === "submittedBy") {
          comparison = a.submittedBy.localeCompare(b.submittedBy);
        } else if (sortKey === "date") {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      // Default: Status priority weight (desc) -> date (desc)
      data.sort((a, b) => {
        const priorityA = statusPriority[a.status] ?? 0;
        const priorityB = statusPriority[b.status] ?? 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    return data.slice(0, 8);
  }, [dashboardData, sortKey, sortDirection]);

  // Stats
  const total = dashboardData.length;
  const approved = dashboardData.filter(d => d.status === "Approved").length;
  const pending = dashboardData.filter(d => d.status === "Pending").length;
  const rejected = dashboardData.filter(d => d.status === "Rejected").length;
  const cancelled = dashboardData.filter(d => d.status === "Cancelled").length;

  // Chart 1: Type Distribution
  const typeData = useMemo(() => {
    const counts: Record<string, number> = { PR: 0, PO: 0, Memo: 0, Other: 0 };
    dashboardData.forEach(d => {
      if (counts[d.type] !== undefined) counts[d.type]++;
      else counts["Other"]++;
    });
    return [
      { name: "PR", value: counts.PR, fill: TYPE_COLORS.PR },
      { name: "PO", value: counts.PO, fill: TYPE_COLORS.PO },
      { name: "Memo", value: counts.Memo, fill: TYPE_COLORS.Memo },
      { name: "Other", value: counts.Other, fill: TYPE_COLORS.Other }
    ];
  }, [dashboardData]);

  // Chart 2: Status Distribution
  const statusData = useMemo(() => {
    return [
      { name: "Approved", value: approved, fill: STATUS_COLORS.Approved },
      { name: "Pending", value: pending, fill: STATUS_COLORS.Pending },
      { name: "Rejected", value: rejected, fill: STATUS_COLORS.Rejected },
      { name: "Cancelled", value: cancelled, fill: STATUS_COLORS.Cancelled }
    ].filter(d => d.value > 0);
  }, [approved, pending, rejected, cancelled]);

  // Top header mock
  const displayName = user?.full_name || user?.username || currentUserFullname;

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      {/* HEADER & ROLE TOGGLE */}
      <PageHeader
        title="ภาพรวมแดชบอร์ด"
        subtitle={`ยินดีต้อนรับกลับ, ${displayName}`}
        actions={
          <div className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-slate-100 p-1.5 sm:self-auto">
            <button 
              onClick={() => setRole("employee")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${role === 'employee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              มุมมองพนักงาน
            </button>
            <button 
              onClick={() => setRole("admin")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${role === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              มุมมองผู้ดูแล
            </button>
          </div>
        }
      />

      {role === "employee" && dashboardData.length === 0 ? (
        <div className={`${APP_CARD_LG} flex flex-col items-center justify-center p-12 text-center`}>
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">คุณยังไม่มีเอกสารในระบบ</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">เริ่มสร้างเอกสารแรกของคุณเพื่อเข้าสู่กระบวนการอนุมัติได้ทันที</p>
          <Link href="/documents/upload" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm">
            + สร้างเอกสารใหม่
          </Link>
        </div>
      ) : (
        <>
          {/* STATS ROW */}
          <StatCardGrid columns={5}>
            <AppStatCard label="เอกสารทั้งหมด" value={total} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <AppStatCard label="รออนุมัติ" value={pending} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <AppStatCard label="อนุมัติแล้ว" value={approved} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <AppStatCard label="ปฏิเสธ" value={rejected} icon={XCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
            <AppStatCard label="ยกเลิก" value={cancelled} icon={AlertCircle} iconBg="bg-slate-100" iconColor="text-slate-500" />
          </StatCardGrid>

          {/* MIDDLE SECTION: Employee Task Card + Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {role === "employee" && (
              <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-sm flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CheckCircle2 className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex-1">
                  <p className="text-indigo-100 font-bold uppercase text-[11px] tracking-wider mb-2">งานของฉันที่ต้องทำวันนี้</p>
                  <h3 className="text-2xl font-black mb-1">เอกสารรอฉันอนุมัติ</h3>
                  <div className="text-5xl font-black my-4">2</div>
                  <p className="text-xs text-indigo-100 font-medium">กรุณาตรวจสอบและอนุมัติเอกสารเพื่อให้กระบวนการทำงานดำเนินการต่อ</p>
                </div>
                <Link href="/approvals" className="relative z-10 mt-6 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition-colors shadow-sm">
                  <span>ไปที่ Approval Inbox</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <div className={`${role === 'employee' ? 'lg:col-span-1' : 'lg:col-span-2'} ${APP_CARD_LG} flex flex-col`}>
              <h3 className="text-sm font-bold text-slate-800 mb-6">เอกสารตามประเภท</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} width={60} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${APP_CARD_LG} flex flex-col lg:col-span-1`}>
              <h3 className="text-sm font-bold text-slate-800 mb-2">สัดส่วนสถานะอนุมัติ</h3>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* RECENT ACTIVITY TABLE */}
          <div className={`${APP_TABLE_CARD} flex flex-col`}>
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-base font-bold text-slate-900">กิจกรรมล่าสุด</h3>
              <Link href="/documents" className="flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800">
                ดูทั้งหมด <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full table-fixed min-w-[800px] text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className={MD_THEAD}>
                    <DataTableHeader title="รหัสเอกสาร" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-6 py-4 w-[15%]" />
                    <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-400 w-[40%]">ชื่อเรื่อง</th>
                    <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 px-4 w-[15%]" />
                    <DataTableHeader title="ผู้สร้าง" sortKey="submittedBy" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 px-4 w-[18%]" />
                    <DataTableHeader title="วันที่" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 pr-6 pl-4 w-[12%]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {recentActivity.map(doc => (
                    <tr key={doc.id} className={`${MD_TR} group`}>
                      <td className="py-4 pl-6 text-sm font-bold text-slate-500">
                        <Link href={`/documents/${doc.id}`} className="hover:text-blue-600 transition-colors">
                          {doc.id}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <Link href={`/documents/${doc.id}`} className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.title}</span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{doc.type} • {doc.department}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          doc.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-slate-700">{doc.submittedBy}</td>
                      <td className="py-4 pr-6 pl-4 text-sm text-slate-400 font-medium">{doc.date}</td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-400">
                        ไม่มีประวัติการทำรายการล่าสุด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      </div>
    </div>
  );
}
