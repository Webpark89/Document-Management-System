"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  TrendingUp,
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
import { useAuth } from '@views/components/providers/AuthProvider';
import { formatThaiDate } from '@/lib/format-date';
import { AppStatCard, StatCardGrid } from '@views/components/ui/AppStatCard';
import DataTableHeader from '@views/components/ui/DataTableHeader';
import {
  APP_TABLE_CARD,
  APP_CARD_LG,
  MD_THEAD,
  MD_TR,
} from '@views/components/ui/design-system';

const STATUS_COLORS = {
  Approved: "#10b981",
  Pending: "#f59e0b",
  Returned: "#f97316",
  Cancelled: "#64748b"
};

const TYPE_COLORS = {
  PR: "#3b82f6",
  PO: "#a855f7",
  BK: "#10b981",
  DOC: "#f59e0b",
  Other: "#64748b"
};

type ViewScopeOption = "ALL" | "MY_DEPT" | "MY_DOCS" | "CUSTOM_DEPTS";

export function ExecutiveDashboard({ documents, stats, departments }: { documents: any[], stats: any, departments: string[] }) {
  const { user } = useAuth();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const [viewScope, setViewScope] = useState<ViewScopeOption>("ALL");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isDeptPopoverOpen, setIsDeptPopoverOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [bottleneckPage, setBottleneckPage] = useState(1);

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

  const total = filteredData.length;
  const pending = filteredData.filter(d => d.status === "Pending").length;
  const returned = filteredData.filter(d => d.status === "Returned" || d.status === "Rejected").length;
  const cancelled = filteredData.filter(d => d.status === "Cancelled").length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const approvedThisMonth = filteredData.filter(d => {
    if (d.status !== "Approved") return false;
    const dDate = new Date(d.date);
    return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
  }).length;

  const totalBudget = filteredData
    .filter(d => d.status === "Approved" && (d.type === "PR" || d.type === "PO"))
    .reduce((acc, d) => acc + (d.value || 0), 0);

  const actionRequiredCount = stats?.actionRequired ?? 0;

  // Bottlenecks (Pending > 7 days)
  const bottlenecks = filteredData.filter(d => {
    if (d.status !== 'Pending') return false;
    const diffTime = Date.now() - new Date(d.date).getTime();
    return diffTime > 7 * 24 * 60 * 60 * 1000;
  });

  const typeData = useMemo(() => {
    const counts: Record<string, number> = { PR: 0, PO: 0, BK: 0, Other: 0 };
    filteredData.forEach(d => {
      if (counts[d.type] !== undefined) counts[d.type]++;
      else counts.Other++;
    });
    return [
      { name: "PR", value: counts.PR, fill: TYPE_COLORS.PR },
      { name: "PO", value: counts.PO, fill: TYPE_COLORS.PO },
      { name: "BK", value: counts.BK, fill: TYPE_COLORS.BK },
      { name: "Other", value: counts.Other, fill: TYPE_COLORS.Other }
    ];
  }, [filteredData]);

  const statusData = useMemo(() => {
    const approved = filteredData.filter(d => d.status === "Approved").length;
    return [
      { name: "อนุมัติแล้ว", value: approved, fill: STATUS_COLORS.Approved },
      { name: "รออนุมัติ", value: pending, fill: STATUS_COLORS.Pending },
      { name: "ส่งกลับแก้ไข", value: returned, fill: STATUS_COLORS.Returned },
      { name: "ยกเลิก", value: cancelled, fill: STATUS_COLORS.Cancelled }
    ].filter(d => d.value > 0);
  }, [filteredData, pending, returned, cancelled]);

  const deptPendingData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.filter(d => d.status === 'Pending').forEach(d => {
      const dept = d.department || 'ไม่ระบุ';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [filteredData]);

  const recentActivity = useMemo(() => {
    const data = [...filteredData];
    if (sortKey && sortDirection) {
      data.sort((a, b) => {
        let comparison = 0;
        if (sortKey === "id") comparison = a.id.localeCompare(b.id);
        else if (sortKey === "status") comparison = a.status.localeCompare(b.status);
        else if (sortKey === "submittedBy") comparison = a.submittedBy.localeCompare(b.submittedBy);
        else if (sortKey === "date") comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return data.slice(0, 8);
  }, [filteredData, sortKey, sortDirection]);

  const hasPerm = (key: string) => {
    return user?.permissions?.includes(`dashboard.${key}:view`) || 
           user?.permissions?.includes(`dashboard:${key}`) ||
           user?.permissions?.includes(`dashboard_executive.${key}:view`);
  };

  const showStatCards = hasPerm("executive_stat_cards");
  const showDocsTypeChart = hasPerm("executive_docs_type_chart");
  const showDocsStatusChart = hasPerm("executive_docs_status_chart");
  const showPendingDeptChart = hasPerm("executive_pending_dept_chart");
  const showRecentActivity = hasPerm("executive_recent_activity");
  const showBottlenecks = hasPerm("executive_bottlenecks");
  const showViewScope = hasPerm("executive_view_scope");

  return (
    <>
      {showViewScope && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs mb-6">
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
      )}

      {showStatCards && (
        <StatCardGrid columns={6}>
          <AppStatCard label="เอกสารทั้งระบบ" value={total} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <AppStatCard label="รออนุมัติทั้งระบบ" value={pending} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <AppStatCard label="อนุมัติ (เดือนนี้)" value={approvedThisMonth} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <AppStatCard label="ส่งกลับแก้ไข" value={returned} icon={AlertCircle} iconBg="bg-orange-50" iconColor="text-orange-600" />
          <AppStatCard label="ยอด PR/PO (บ.)" value={totalBudget.toLocaleString()} icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <AppStatCard label="รออนุมัติจากฉัน" value={actionRequiredCount} icon={CheckCircle2} iconBg="bg-rose-50" iconColor="text-rose-600" />
        </StatCardGrid>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {showDocsTypeChart && (
          <div className={`lg:col-span-2 ${APP_CARD_LG} flex flex-col`}>
            <h3 className="text-sm font-bold text-slate-800 mb-6">เอกสารตามประเภท (จำนวนจริง)</h3>
            <div className="flex-1 min-h-[220px]">
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
            </div>
          </div>
        )}

        {showDocsStatusChart && (
          <div className={`${APP_CARD_LG} flex flex-col lg:col-span-1`}>
            <h3 className="text-sm font-bold text-slate-800 mb-2">สัดส่วนสถานะรวมทั้งระบบ</h3>
            <div className="flex-1 min-h-[220px]">
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
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {showPendingDeptChart && (
          <div className={`lg:col-span-1 ${APP_CARD_LG} flex flex-col`}>
            <h3 className="text-sm font-bold text-slate-800 mb-6">เอกสารรออนุมัติแยกตามแผนก (Top 5)</h3>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32} fill="#f59e0b">
                    <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: '#334155', fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {showRecentActivity && (
          <div className={`lg:col-span-2 ${APP_TABLE_CARD} flex flex-col`}>
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h3 className="text-base font-bold text-slate-900">กิจกรรมล่าสุดในระบบ</h3>

          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full table-fixed min-w-[850px] text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className={MD_THEAD}>
                  <DataTableHeader title="รหัสเอกสาร" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-6 py-4 w-[15%]" />
                  <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-400 w-[30%]">ชื่อเรื่อง / แผนก</th>
                  <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-400 w-[12%]">กิจกรรม</th>
                  <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 px-4 w-[13%]" />
                  <DataTableHeader title="ผู้สร้าง" sortKey="submittedBy" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 px-4 w-[15%]" />
                  <DataTableHeader title="วันที่" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 pr-6 pl-4 w-[15%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {recentActivity.map((doc, index) => {
                  let activityText = 'อัปเดตเอกสาร';
                  if (doc.status === 'Approved') activityText = 'อนุมัติเอกสาร';
                  else if (doc.status === 'Pending') activityText = 'ส่งขออนุมัติ';
                  else if (doc.status === 'Returned') activityText = 'ส่งกลับแก้ไข';
                  else if (doc.status === 'Rejected') activityText = 'ไม่อนุมัติ';
                  else if (doc.status === 'Draft') activityText = 'บันทึกร่าง';

                  return (
                  <tr key={doc.id || index} className={`${MD_TR} group`}>
                    <td className="py-4 pl-6 text-sm font-bold text-slate-500">
                      <Link href={`/documents/${doc.id}`} className="hover:text-blue-600 transition-colors">
                        {doc.id}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/documents/${doc.id}`} className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate block">{doc.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{doc.type} • {doc.department}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-blue-600">{activityText}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        doc.status === 'Returned' || doc.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-slate-700">{doc.submittedBy}</td>
                    <td className="py-4 pr-6 pl-4 text-sm text-slate-400 font-medium">{formatThaiDate(doc.date)}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
      
      {showBottlenecks && bottlenecks.length > 0 && (
        <div className={`mb-6 ${APP_TABLE_CARD} flex flex-col border-rose-100 overflow-hidden`}>
          <div className="bg-rose-50 border-b border-rose-100 text-rose-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold">เอกสารค้างนานผิดปกติ (เกิน 7 วัน)</h3>
                <p className="text-xs font-medium opacity-80">พบ {bottlenecks.length} รายการที่กำลังรอการอนุมัติและเกินกำหนดเวลามาตรฐาน</p>
              </div>
            </div>
            <Link href="/documents?status=Pending&overdue=true" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors">
              ดูทั้งหมด
            </Link>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full table-fixed min-w-[900px] text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className={MD_THEAD}>
                  <th className="pl-6 py-4 w-[12%] font-bold text-[11px] uppercase tracking-wider text-slate-400">รหัสเอกสาร</th>
                  <th className="py-4 px-4 w-[30%] font-bold text-[11px] uppercase tracking-wider text-slate-400">ชื่อเรื่อง / แผนก</th>
                  <th className="py-4 px-4 w-[12%] font-bold text-[11px] uppercase tracking-wider text-slate-400">จำนวนวันค้าง</th>
                  <th className="py-4 px-4 w-[16%] font-bold text-[11px] uppercase tracking-wider text-slate-400">ผู้สร้าง</th>
                  <th className="py-4 px-4 w-[18%] font-bold text-[11px] uppercase tracking-wider text-slate-400">ผู้อนุมัติ</th>
                  <th className="py-4 pr-6 pl-4 w-[12%] font-bold text-[11px] uppercase tracking-wider text-slate-400">วันที่ส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80 bg-white">
                {(() => {
                  const itemsPerPage = 5;
                  const totalPages = Math.ceil(bottlenecks.length / itemsPerPage);
                  const startIndex = (bottleneckPage - 1) * itemsPerPage;
                  const paginated = bottlenecks.slice(startIndex, startIndex + itemsPerPage);

                  return paginated.map((doc, index) => {
                    const daysPending = Math.floor((new Date().getTime() - new Date(doc.date).getTime()) / (1000 * 3600 * 24));
                    const approverText = (doc.approvers && doc.approvers.length > 0) ? doc.approvers.join(', ') : '-';
                    return (
                      <tr key={doc.id || index} className={`${MD_TR} group hover:bg-rose-50/30`}>
                        <td className="py-4 pl-6 text-sm font-bold text-slate-500">
                          <Link href={`/documents/${doc.id}`} className="hover:text-blue-600 transition-colors">
                            {doc.id}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <Link href={`/documents/${doc.id}`} className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate block">{doc.title}</span>
                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{doc.type} • {doc.department}</span>
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
                            {daysPending} วัน
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-slate-700">{doc.submittedBy}</td>
                        <td className="py-4 px-4 text-sm font-semibold text-slate-700 truncate" title={approverText}>{approverText}</td>
                        <td className="py-4 pr-6 pl-4 text-sm text-slate-400 font-medium">{formatThaiDate(doc.date)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {bottlenecks.length > 5 && (
            <div className="flex justify-end p-4 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBottleneckPage(p => Math.max(1, p - 1))}
                  disabled={bottleneckPage === 1}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-600 px-2">
                  หน้า {bottleneckPage} จาก {Math.ceil(bottlenecks.length / 5)}
                </span>
                <button
                  type="button"
                  onClick={() => setBottleneckPage(p => Math.min(Math.ceil(bottlenecks.length / 5), p + 1))}
                  disabled={bottleneckPage === Math.ceil(bottlenecks.length / 5)}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
