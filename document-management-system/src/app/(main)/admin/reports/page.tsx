"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  FileText, 
  Clock, 
  DollarSign, 
  Download, 
  Filter, 
  AlertCircle,
  CheckCircle2,
  Clock4,
  XCircle,
  RefreshCcw,
  Search
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTableHeader from "@/components/ui/DataTableHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "All",
  "ฝ่ายจัดซื้อและพัสดุ",
  "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายบริหารทรัพยากรบุคคล (HR)",
  "ฝ่ายบริหารทั่วไป",
  "ฝ่ายวิศวกรรมและซ่อมบำรุง",
];

const DOCUMENT_TYPES = ["All", "PR", "PO", "Memo", "Other"];

import { MOCK_REPORT_DATA } from "@/lib/mock-data";

const REPORT_TYPES = [
  { id: "status", title: "Document Status", icon: FileText, desc: "รายงานสถานะเอกสาร" },
  { id: "turnaround", title: "Approval Turnaround", icon: Clock, desc: "สถิติระยะเวลาการอนุมัติ" },
  { id: "spend", title: "Purchase Spend", icon: DollarSign, desc: "รายงานมูลค่าจัดซื้อ (PR/PO)" },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

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

  // Validate Dates: if from > to, reset to
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateFrom(val);
    if (dateTo && val > dateTo) setDateTo("");
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateTo(val);
    if (dateFrom && val < dateFrom) setDateFrom("");
  };

  // Filter & Sort Data
  const filteredData = useMemo(() => {
    const data = MOCK_REPORT_DATA.filter((item) => {
      let pass = true;
      if (filterType !== "All" && item.type !== filterType) pass = false;
      if (filterDept !== "All" && item.department !== filterDept) pass = false;
      if (dateFrom && item.date < dateFrom) pass = false;
      if (dateTo && item.date > dateTo) pass = false;
      return pass;
    });

    const statusPriority: Record<string, number> = {
      "Pending": 4,
      "Draft": 3,
      "Returned for Revision": 2,
      "Returned": 2,
      "Approved": 1,
      "Cancelled": 0,
      "Rejected": 0,
    };

    if (sortKey && sortDirection) {
      data.sort((a, b) => {
        let comparison = 0;
        if (sortKey === "id") {
          comparison = a.id.localeCompare(b.id);
        } else if (sortKey === "type") {
          comparison = a.type.localeCompare(b.type);
        } else if (sortKey === "department") {
          comparison = a.department.localeCompare(b.department);
        } else if (sortKey === "status") {
          const priorityA = statusPriority[a.status] ?? 0;
          const priorityB = statusPriority[b.status] ?? 0;
          comparison = priorityA - priorityB;
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

    return data;
  }, [dateFrom, dateTo, filterType, filterDept, sortKey, sortDirection]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    let csvContent = "";
    if (activeReport === "status" || activeReport === "turnaround") {
      const headers = ["Document ID", "Type", "Department", "Status", "Date", "Approval Days"];
      csvContent = headers.join(",") + "\n";
      filteredData.forEach(d => {
        csvContent += `"${d.id}","${d.type}","${d.department}","${d.status}","${d.date}","${d.approvalDays ?? ''}"\n`;
      });
    } else if (activeReport === "spend") {
      const spendData = filteredData.filter(d => d.type === "PR" || d.type === "PO");
      const headers = ["Document ID", "Type", "Department", "Date", "Value"];
      csvContent = headers.join(",") + "\n";
      spendData.forEach(d => {
        csvContent += `"${d.id}","${d.type}","${d.department}","${d.date}","${d.value}"\n`;
      });
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${activeReport}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Report Bodies
  const renderStatusReport = () => {
    const approved = filteredData.filter(d => d.status === "Approved").length;
    const pending = filteredData.filter(d => d.status === "Pending").length;
    const returned = filteredData.filter(d => d.status === "Returned").length;
    const rejected = filteredData.filter(d => d.status === "Rejected").length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-black text-emerald-900 leading-none mt-1">{approved}</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
            <Clock4 className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-amber-900 leading-none mt-1">{pending}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
            <RefreshCcw className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Returned</p>
              <p className="text-2xl font-black text-blue-900 leading-none mt-1">{returned}</p>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
            <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-black text-rose-900 leading-none mt-1">{rejected}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl w-full">
          <table className="w-full min-w-[600px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <DataTableHeader title="Document ID" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-4 py-4 w-32" />
                <DataTableHeader title="Type" sortKey="type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-24" />
                <DataTableHeader title="Department" sortKey="department" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4" />
                <DataTableHeader title="Status" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-28" />
                <DataTableHeader title="Date" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 pr-4 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {filteredData.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-4 text-sm font-bold text-slate-500">{doc.id}</td>
                  <td className="py-4 text-xs font-semibold px-2">
                    <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-semibold text-slate-700">{doc.department}</td>
                  <td className="py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      doc.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      doc.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      doc.status === 'Returned' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-sm text-slate-400 font-medium">{doc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTurnaroundReport = () => {
    const completedDocs = filteredData.filter(d => d.status === "Approved" && d.approvalDays !== null);
    
    if (completedDocs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
          <Clock className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-600 font-bold text-sm">ไม่มีเอกสารที่อนุมัติเสร็จสิ้นในช่วงที่เลือก</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">รายงานสถิติจะแสดงเฉพาะเอกสารที่มีการอนุมัติสมบูรณ์แล้วเท่านั้น</p>
        </div>
      );
    }

    const stats = ["PR", "PO", "Memo", "Other"].map(type => {
      const docs = completedDocs.filter(d => d.type === type);
      if (docs.length === 0) return null;
      const avg = docs.reduce((sum, d) => sum + (d.approvalDays as number), 0) / docs.length;
      return { type, count: docs.length, avg };
    }).filter(Boolean) as { type: string, count: number, avg: number }[];

    const getTypeColor = (type: string) => {
      switch(type) {
        case "PR": return "bg-blue-500";
        case "PO": return "bg-purple-500";
        case "Memo": return "bg-emerald-500";
        default: return "bg-slate-500";
      }
    };

    const maxAvg = Math.max(...stats.map(s => s.avg));

    return (
      <div className="space-y-6">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Average Approval Days by Type</h3>
        <div className="space-y-6 max-w-2xl">
          {stats.map(s => (
            <div key={s.type} className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>{s.type} <span className="text-slate-400 font-medium text-xs ml-1">({s.count} docs)</span></span>
                <span>{s.avg.toFixed(1)} days</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getTypeColor(s.type)} transition-all duration-500`} 
                  style={{ width: `${Math.max((s.avg / maxAvg) * 100, 5)}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpendReport = () => {
    const spendDocs = filteredData.filter(d => d.type === "PR" || d.type === "PO");
    
    if (spendDocs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-600 font-bold text-sm">ไม่มีข้อมูล PR/PO ในช่วงที่เลือก</p>
        </div>
      );
    }

    const totalSpend = spendDocs.reduce((sum, d) => sum + d.value, 0);
    
    // Group by department
    const deptTotals: Record<string, number> = {};
    spendDocs.forEach(d => {
      deptTotals[d.department] = (deptTotals[d.department] || 0) + d.value;
    });

    const sortedDepts = Object.entries(deptTotals).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-6">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-sm">
          <p className="text-blue-100/90 font-bold uppercase text-[11px] tracking-wider mb-1">Total Purchase Spend</p>
          <p className="text-4xl font-black tracking-tight">฿ {totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-blue-100/70 text-xs mt-2 font-medium">คำนวณเฉพาะเอกสารประเภท PR และ PO เท่านั้น</p>
        </div>

        <div className="border border-slate-100/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 pl-4 font-bold w-full">Department</th>
                <th className="py-4 pr-4 font-bold text-right">Spend Value (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {sortedDepts.map(([dept, val]) => (
                <tr key={dept} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-4 text-sm font-semibold text-slate-700">{dept}</td>
                  <td className="py-4 pr-4 text-sm text-right font-bold text-slate-800">
                    {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader 
        title="Management Reports" 
        subtitle="รายงานสรุปแบบมาตรฐานที่ถูกจัดเตรียมไว้สำหรับดูสถิติและสถานะการทำงาน" 
      />

      <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 font-medium leading-relaxed">
          <strong>รายงานสรุปแบบมาตรฐาน</strong> — คุณสามารถเลือกดูและกรองข้อมูลได้ แต่ไม่สามารถสร้างรายงานรูปแบบใหม่เองได้ (Custom Report อยู่นอกขอบเขตโครงการ) 
          หากต้องการข้อมูลย้อนหลังแบบละเอียดทุกรายการ กรุณาดูที่ <Link href="/admin/audit-logs" className="font-bold underline hover:text-blue-900">Audit Log</Link>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: REPORT CATALOG */}
        <div className="lg:w-[260px] shrink-0 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">
            Available Reports
          </div>
          {REPORT_TYPES.map(rt => {
            const Icon = rt.icon;
            const isActive = activeReport === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setActiveReport(rt.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  isActive 
                    ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20" 
                    : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isActive ? "text-blue-900" : "text-slate-700"}`}>
                      {rt.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{rt.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: REPORT BODY */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs min-w-0 flex flex-col">
          
          {/* Global Filters */}
          <div className="bg-slate-50/50 p-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-end gap-4">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={handleDateToChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            
            <button 
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Report Content */}
          <div className="p-6">
            <div className="mb-6 flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Filter className="w-4 h-4" />
              Showing {filteredData.length} records based on current filters
            </div>

            {filteredData.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">ไม่มีข้อมูลในช่วงที่เลือก</h3>
                <p className="text-slate-500 mt-1">ลองปรับเปลี่ยนตัวกรอง (Filter) ด้านบนเพื่อค้นหาใหม่อีกครั้ง</p>
              </div>
            ) : (
              <>
                {activeReport === "status" && renderStatusReport()}
                {activeReport === "turnaround" && renderTurnaroundReport()}
                {activeReport === "spend" && renderSpendReport()}
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
