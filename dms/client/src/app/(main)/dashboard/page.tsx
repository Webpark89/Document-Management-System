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

  const [isMounted, setIsMounted] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Unified Filter States
  type ViewScopeOption = "ALL" | "MY_DEPT" | "MY_DOCS" | "CUSTOM_DEPTS";
  const [viewScope, setViewScope] = useState<ViewScopeOption>("ALL");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isDeptPopoverOpen, setIsDeptPopoverOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [departments, setDepartments] = useState<string[]>([
    "แผนกจัดซื้อ",
    "แผนกบัญชีและการเงิน",
    "แผนกคลังสินค้าและจัดส่ง",
    "แผนกเทคโนโลยีสารสนเทศ",
    "แผนกทรัพยากรบุคคล",
    "แผนกผลิต"
  ]);

  React.useEffect(() => {
    setIsMounted(true);
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
        value: typeof d.amount === "string" ? parseFloat(d.amount.replace(/[^0-9.-]+/g,"")) : (d.amount || 0)
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

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc");
    } else {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        setSortKey(null);
        setSortDirection(null);
      }
    }
  };

  // Filtered documents by scope, dept, and date range
  const filteredData = useMemo(() => {
    return documents.filter((d) => {
      // 1. Scope Filter
      if (viewScope === "MY_DOCS") {
        const isMyId = d.creator_id && user?.id && d.creator_id === user.id;
        const isMyName = d.submittedBy && user && (
          (user.full_name && d.submittedBy.toLowerCase().includes(user.full_name.toLowerCase())) ||
          (user.username && d.submittedBy.toLowerCase().includes(user.username.toLowerCase()))
        );
        if (!isMyId && !isMyName) return false;
      } else if (viewScope === "MY_DEPT") {
        const userDept = user?.department || (user as any)?.department_name || "";
        if (userDept) {
          const docDept = d.department || "";
          const matchesUserDept = docDept.toLowerCase().includes(userDept.toLowerCase()) ||
                                  userDept.toLowerCase().includes(docDept.toLowerCase());
          if (!matchesUserDept) return false;
        }
      } else if (viewScope === "CUSTOM_DEPTS") {
        if (selectedDepartments.length > 0) {
          const docDept = d.department || "";
          const matchesCustom = selectedDepartments.some(dept =>
            docDept.toLowerCase().includes(dept.toLowerCase()) ||
            dept.toLowerCase().includes(docDept.toLowerCase())
          );
          if (!matchesCustom) return false;
        }
      }

      // 2. Date Range Filter
      if (dateFrom || dateTo) {
        const dDate = new Date(d.date).getTime();
        if (dateFrom && !isNaN(dDate) && dDate < new Date(dateFrom).getTime()) return false;
        if (dateTo && !isNaN(dDate) && dDate > new Date(dateTo).getTime() + 86400000) return false;
      }

      return true;
    });
  }, [documents, viewScope, selectedDepartments, dateFrom, dateTo, user]);

  // Activity list
  const recentActivity = useMemo(() => {
    const data = [...filteredData];
    const statusPriority: Record<string, number> = {
      "Pending": 4,
      "Draft": 3,
      "Returned": 2,
      "Approved": 1,
      "Cancelled": 0
    };

    if (sortKey && sortDirection) {
      data.sort((a, b) => {
        let comparison = 0;
        if (sortKey === "id") comparison = a.id.localeCompare(b.id);
        else if (sortKey === "status") comparison = (statusPriority[a.status] ?? 0) - (statusPriority[a.status] ?? 0);
        else if (sortKey === "submittedBy") comparison = a.submittedBy.localeCompare(b.submittedBy);
        else if (sortKey === "date") comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return data.slice(0, 8);
  }, [filteredData, sortKey, sortDirection]);

  // Counts
  const total = filteredData.length;
  const approved = filteredData.filter(d => d.status === "Approved").length;
  const pending = filteredData.filter(d => d.status === "Pending").length;
  const returned = filteredData.filter(d => d.status === "Returned").length;
  const cancelled = filteredData.filter(d => d.status === "Cancelled").length;
  
  // My created docs awaiting approval
  const myPendingDocsCount = documents.filter(d => {
    if (d.status !== "Pending") return false;
    const isMyId = d.creator_id && user?.id && d.creator_id === user.id;
    const isMyName = d.submittedBy && user && (
      (user.full_name && d.submittedBy.toLowerCase().includes(user.full_name.toLowerCase())) ||
      (user.username && d.submittedBy.toLowerCase().includes(user.username.toLowerCase()))
    );
    return isMyId || isMyName;
  }).length;
  const actionRequiredCount = stats?.actionRequired ?? pending;

  // Chart 1: Type Distribution
  const typeData = useMemo(() => {
    const counts: Record<string, number> = { PR: 0, PO: 0, BK: 0, DOC: 0, Other: 0 };
    filteredData.forEach(d => {
      if (counts[d.type] !== undefined) counts[d.type]++;
      else counts.Other++;
    });
    return [
      { name: "PR", value: counts.PR, fill: TYPE_COLORS.PR },
      { name: "PO", value: counts.PO, fill: TYPE_COLORS.PO },
      { name: "BK", value: counts.BK, fill: TYPE_COLORS.BK },
      { name: "DOC", value: counts.DOC, fill: TYPE_COLORS.DOC },
      { name: "Other", value: counts.Other, fill: TYPE_COLORS.Other }
    ];
  }, [filteredData]);

  // Chart 2: Status Distribution
  const statusData = useMemo(() => {
    return [
      { name: "อนุมัติแล้ว (Approved)", value: approved, fill: STATUS_COLORS.Approved },
      { name: "รออนุมัติ (Pending)", value: pending, fill: STATUS_COLORS.Pending },
      { name: "ส่งกลับแก้ไข (Returned)", value: returned, fill: STATUS_COLORS.Returned },
      { name: "ยกเลิก (Cancelled)", value: cancelled, fill: STATUS_COLORS.Cancelled }
    ].filter(d => d.value > 0);
  }, [approved, pending, returned, cancelled]);

  const displayName = user?.full_name || user?.username || "ผู้ใช้งาน";

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      {/* HEADER & FILTERS */}
      <PageHeader
        title="ภาพรวมแดชบอร์ด"
        subtitle={`ยินดีต้อนรับกลับ, ${displayName}`}
        actions={
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
            
            {/* View Scope Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">ขอบเขต:</span>
              <select
                value={viewScope}
                onChange={(e) => {
                  const val = e.target.value as ViewScopeOption;
                  setViewScope(val);
                  if (val === "CUSTOM_DEPTS" && selectedDepartments.length === 0) {
                    setIsDeptPopoverOpen(true);
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🌐 ทั้งหมดในระบบ (All Documents)</option>
                <option value="MY_DEPT">🏢 แผนกของฉัน (My Department)</option>
                <option value="MY_DOCS">👤 เอกสารของฉัน (My Documents)</option>
                <option value="CUSTOM_DEPTS">📑 เลือกระบุตามแผนก... (Custom Depts)</option>
              </select>
            </div>

            {/* Multi-Department Selector Popover */}
            {viewScope === "CUSTOM_DEPTS" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDeptPopoverOpen(!isDeptPopoverOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span>เลือกแผนก {selectedDepartments.length > 0 ? `(${selectedDepartments.length})` : "(ทั้งหมด)"}</span>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {isDeptPopoverOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-700">เลือกแผนก</span>
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <button type="button" onClick={() => setSelectedDepartments([...departments])} className="text-blue-600 hover:underline">ทั้งหมด</button>
                        <span className="text-slate-300">|</span>
                        <button type="button" onClick={() => setSelectedDepartments([])} className="text-rose-500 hover:underline">ล้าง</button>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {departments.map((dept) => (
                        <label key={dept} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedDepartments([...selectedDepartments, dept]);
                              else setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
                            }}
                            className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                      <button type="button" onClick={() => setIsDeptPopoverOpen(false)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">ตกลง</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">วันที่:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1 px-2 text-xs text-slate-700 font-semibold"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-1 px-2 text-xs text-slate-700 font-semibold"
              />
            </div>
          </div>
        }
      />

      {viewScope === "MY_DOCS" && filteredData.length === 0 ? (
        <div className={`${APP_CARD_LG} flex flex-col items-center justify-center p-12 text-center`}>
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">คุณยังไม่มีเอกสารในระบบ</h2>
          <p className="text-slate-500 max-w-md mx-auto">เริ่มสร้างเอกสารได้ที่หน้า "ส่งเรื่องขออนุมัติ"</p>
        </div>
      ) : (
        <>
          {/* STATS ROW */}
          <StatCardGrid columns={5}>
            <AppStatCard label="เอกสารทั้งหมด" value={total} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
            <AppStatCard label="รออนุมัติ" value={pending} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <AppStatCard label="อนุมัติแล้ว" value={approved} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <AppStatCard label="ส่งกลับแก้ไข" value={returned} icon={AlertCircle} iconBg="bg-orange-50" iconColor="text-orange-600" />
            <AppStatCard label="ยกเลิก" value={cancelled} icon={XCircle} iconBg="bg-slate-100" iconColor="text-slate-500" />
          </StatCardGrid>

          {/* ACTION TASK CARDS (2 Cards: Docs Awaiting My Approval & Docs I Created Awaiting Approval) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Docs awaiting my approval */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-100 font-bold uppercase text-[10px] tracking-wider">งานของฉันที่ต้องอนุมัติ</p>
                <h3 className="text-lg font-black mt-0.5">เอกสารรอฉันอนุมัติ</h3>
                <div className="text-3xl font-black mt-2">{actionRequiredCount} <span className="text-xs font-normal opacity-80">รายการ</span></div>
              </div>
              <Link href="/approvals" className="relative z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition-colors shrink-0">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Card 2: Docs I created awaiting approval (NEW) */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-amber-100 font-bold uppercase text-[10px] tracking-wider">สถานะการจัดทำของฉัน</p>
                <h3 className="text-lg font-black mt-0.5">เอกสารที่ฉันจัดทำ (กำลังรออนุมัติ)</h3>
                <div className="text-3xl font-black mt-2">{myPendingDocsCount} <span className="text-xs font-normal opacity-80">รายการ</span></div>
              </div>
              <Link href="/submissions" className="relative z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition-colors shrink-0">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* CHARTS ROW WITH EXPLICIT NUMERIC LABELS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart: Type Distribution */}
            <div className={`lg:col-span-2 ${APP_CARD_LG} flex flex-col`}>
              <h3 className="text-sm font-bold text-slate-800 mb-6">เอกสารตามประเภท (จำนวนจริง)</h3>
              <div className="flex-1 min-h-[220px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} width={60} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: '#334155', fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart: Status Distribution */}
            <div className={`${APP_CARD_LG} flex flex-col lg:col-span-1`}>
              <h3 className="text-sm font-bold text-slate-800 mb-2">สัดส่วนสถานะอนุมัติ (จำนวนจริง)</h3>
              <div className="flex-1 min-h-[220px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        label={({ name, value }) => `${value}`}
                        labelLine={false}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
                  {recentActivity.map((doc, index) => (
                    <tr key={(doc as any).real_id || `${doc.id}-${index}`} className={`${MD_TR} group`}>
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
                      <td className="py-4 pr-6 pl-4 text-sm text-slate-400 font-medium">{formatThaiDate(doc.date)}</td>
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
