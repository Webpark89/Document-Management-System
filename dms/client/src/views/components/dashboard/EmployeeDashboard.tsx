"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

export function EmployeeDashboard({ documents, stats }: { documents: any[], stats: any }) {
  const { user } = useAuth();
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);

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

  const myDocs = useMemo(() => {
    return documents.filter((d) => {
      const isMyId = d.creator_id && user?.id && d.creator_id === user.id;
      const isMyName = d.submittedBy && user && (
        (user.full_name && d.submittedBy.toLowerCase().includes(user.full_name.toLowerCase())) ||
        (user.username && d.submittedBy.toLowerCase().includes(user.username.toLowerCase()))
      );
      return isMyId || isMyName;
    });
  }, [documents, user]);

  const total = myDocs.length;
  const pending = myDocs.filter(d => d.status === "Pending").length;
  const returned = myDocs.filter(d => d.status === "Returned" || d.status === "Rejected").length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const approvedThisMonth = myDocs.filter(d => {
    if (d.status !== "Approved") return false;
    const dDate = new Date(d.date);
    return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
  }).length;

  const actionRequiredCount = stats?.actionRequired ?? 0;

  const statusData = useMemo(() => {
    const approved = myDocs.filter(d => d.status === "Approved").length;
    const cancelled = myDocs.filter(d => d.status === "Cancelled").length;
    return [
      { name: "อนุมัติแล้ว", value: approved, fill: STATUS_COLORS.Approved },
      { name: "รออนุมัติ", value: pending, fill: STATUS_COLORS.Pending },
      { name: "ส่งกลับแก้ไข", value: returned, fill: STATUS_COLORS.Returned },
      { name: "ยกเลิก", value: cancelled, fill: STATUS_COLORS.Cancelled }
    ].filter(d => d.value > 0);
  }, [myDocs, pending, returned]);

  const recentActivity = useMemo(() => {
    const data = [...myDocs];
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
  }, [myDocs, sortKey, sortDirection]);

  if (myDocs.length === 0 && actionRequiredCount === 0) {
    return (
      <div className={`${APP_CARD_LG} flex flex-col items-center justify-center p-12 text-center`}>
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">คุณยังไม่มีเอกสารในระบบ</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">เริ่มสร้างเอกสารฉบับแรกของคุณเพื่อเข้าสู่ระบบพิจารณาอนุมัติ</p>
        <div className="flex gap-4">
          <Link href="/documents/upload" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors">
            สร้างเอกสารใหม่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <StatCardGrid columns={4}>
        <AppStatCard label="เอกสารที่ฉันสร้าง (ทั้งหมด)" value={total} icon={FileText} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <AppStatCard label="รอการอนุมัติ (Pending)" value={pending} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <AppStatCard label="อนุมัติสำเร็จ (เดือนนี้)" value={approvedThisMonth} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <AppStatCard label="รออนุมัติจากฉัน" value={actionRequiredCount} icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" />
      </StatCardGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
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

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-amber-100 font-bold uppercase text-[10px] tracking-wider">สถานะการจัดทำของฉัน</p>
            <h3 className="text-lg font-black mt-0.5">เอกสารที่ฉันจัดทำ (กำลังรออนุมัติ)</h3>
            <div className="text-3xl font-black mt-2">{pending} <span className="text-xs font-normal opacity-80">รายการ</span></div>
          </div>
          <Link href="/submissions" className="relative z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition-colors shrink-0">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${APP_TABLE_CARD} flex flex-col`}>
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h3 className="text-base font-bold text-slate-900">เอกสารล่าสุดของฉัน</h3>
            <Link href="/submissions" className="flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800">
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full table-fixed min-w-[700px] text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className={MD_THEAD}>
                  <DataTableHeader title="รหัสเอกสาร" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-6 py-4 w-[20%]" />
                  <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-400 w-[45%]">ชื่อเรื่อง</th>
                  <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 px-4 w-[15%]" />
                  <DataTableHeader title="วันที่ส่ง" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 pr-6 pl-4 w-[20%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {recentActivity.map((doc, index) => (
                  <tr key={doc.id || index} className={`${MD_TR} group`}>
                    <td className="py-4 pl-6 text-sm font-bold text-slate-500">
                      <Link href={`/documents/${doc.id}`} className="hover:text-blue-600 transition-colors">
                        {doc.id}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/documents/${doc.id}`} className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate block">{doc.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{doc.type}</span>
                      </Link>
                    </td>
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
                    <td className="py-4 pr-6 pl-4 text-sm text-slate-400 font-medium">{formatThaiDate(doc.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${APP_CARD_LG} flex flex-col lg:col-span-1`}>
          <h3 className="text-sm font-bold text-slate-800 mb-2">สัดส่วนสถานะเอกสารของฉัน</h3>
          <div className="flex-1 min-h-[250px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={60}
                    outerRadius={80}
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
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">ไม่มีข้อมูลเอกสาร</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
