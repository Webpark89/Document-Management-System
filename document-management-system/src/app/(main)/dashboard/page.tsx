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

  // Sort by date desc
  const recentActivity = [...dashboardData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

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
    <div className="flex-1 flex flex-col min-w-0 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* HEADER & ROLE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back, {displayName}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto shrink-0">
          <button 
            onClick={() => setRole("employee")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === 'employee' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Employee View
          </button>
          <button 
            onClick={() => setRole("admin")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${role === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Admin View
          </button>
        </div>
      </div>

      {role === "employee" && dashboardData.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Documents</span>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-auto">{total}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-auto">{pending}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Approved</span>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-auto">{approved}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-auto">{rejected}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-slate-500">
                <AlertCircle className="w-5 h-5 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Cancelled</span>
              </div>
              <span className="text-3xl font-black text-slate-800 mt-auto">{cancelled}</span>
            </div>
          </div>

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

            <div className={`${role === 'employee' ? 'lg:col-span-1' : 'lg:col-span-2'} bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col`}>
              <h3 className="text-sm font-bold text-slate-800 mb-6">Documents by Type</h3>
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

            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Approval Status Distribution</h3>
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
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <Link href="/documents" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 pl-6 font-bold">Document ID</th>
                    <th className="py-4 font-bold">Title</th>
                    <th className="py-4 font-bold">Status</th>
                    <th className="py-4 font-bold">Creator</th>
                    <th className="py-4 font-bold pr-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {recentActivity.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 pl-6 text-sm font-bold text-slate-500">
                        <Link href={`/documents/${doc.id}`} className="hover:text-blue-600 transition-colors">
                          {doc.id}
                        </Link>
                      </td>
                      <td className="py-4">
                        <Link href={`/documents/${doc.id}`} className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.title}</span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{doc.type} • {doc.department}</span>
                        </Link>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          doc.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-semibold text-slate-700">{doc.submittedBy}</td>
                      <td className="py-4 pr-6 text-sm text-slate-400 font-medium">{doc.date}</td>
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
  );
}
