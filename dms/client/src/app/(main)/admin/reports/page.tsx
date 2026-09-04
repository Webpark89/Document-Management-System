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
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck
} from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';

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

const DOCUMENT_TYPES = [
  { value: "All", label: "All" },
  { value: "PR", label: "PR" },
  { value: "PO", label: "PO" },
  { value: "BK", label: "บันทึก" },
  { value: "OTHER", label: "Other" },
];

import { getDocuments } from '@views/features/documents/api';

const REPORT_TYPES = [
  { id: "status", title: "Document Status", icon: FileText, desc: "รายงานสถานะเอกสาร" },
  { id: "turnaround", title: "Approval Turnaround", icon: Clock, desc: "สถิติระยะเวลาการอนุมัติ" },
  { id: "spend", title: "Purchase Spend", icon: DollarSign, desc: "รายงานมูลค่าจัดซื้อ (PR/PO)" },
  { id: "approvals", title: "Approval Tracking", icon: FileCheck, desc: "รายการการอนุมัติในระบบ" },
];

const formatDateOnly = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("th-TH", { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const formatTimeOnly = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleTimeString("th-TH", { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return "-";
  }
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [departments, setDepartments] = useState<string[]>([
    "All",
    "แผนกจัดซื้อ",
    "แผนกบัญชีและการเงิน",
    "แผนกคลังสินค้าและจัดส่ง",
    "แผนกเทคโนโลยีสารสนเทศ",
    "แผนกทรัพยากรบุคคล",
    "แผนกผลิต"
  ]);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const [documents, setDocuments] = useState<any[]>([]);

  const [datePreset, setDatePreset] = useState("all");

  React.useEffect(() => {
    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(["All", ...data.map((d: any) => d.name || d)]);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (datePreset === "all" || datePreset === "custom") {
      if (datePreset === "all") {
        setDateFrom("");
        setDateTo("");
      }
      return;
    }

    const today = new Date();
    let from = new Date();
    let to = new Date();

    if (datePreset === "today") {
      from = today;
      to = today;
    } else if (datePreset === "this_month") {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (datePreset === "last_month") {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (datePreset === "this_quarter") {
      const q = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), q * 3, 1);
      to = new Date(today.getFullYear(), q * 3 + 3, 0);
    } else if (datePreset === "last_quarter") {
      const q = Math.floor(today.getMonth() / 3) - 1;
      from = new Date(today.getFullYear(), q * 3, 1);
      to = new Date(today.getFullYear(), q * 3 + 3, 0);
    } else if (datePreset === "last_6_months") {
      from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (datePreset === "this_year") {
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear(), 11, 31);
    }

    const formatDateObj = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setDateFrom(formatDateObj(from));
    setDateTo(formatDateObj(to));
  }, [datePreset]);

  React.useEffect(() => {
    getDocuments().then(docs => {
      const mapped = docs.map(d => {
        const doc: any = d;
        const typeCode = doc.type?.code || doc.type;
        const departmentName = doc.creator?.department?.name || doc.department || "ทั่วไป";

        let value = 0;
        if (typeCode === 'PR' && doc.pr_form?.total_amount) {
          value = Number(doc.pr_form.total_amount) || 0;
        } else if (typeCode === 'PO' && doc.po_form?.total_amount) {
          value = Number(doc.po_form.total_amount) || 0;
        }

        return {
          id: d.id,
          type: typeCode,
          department: departmentName,
          requester: doc.creator_name || doc.sender || (doc.creator ? `${doc.creator.first_name || ""} ${doc.creator.last_name || ""}`.trim() : "") || "ไม่ระบุ",
          status: d.status,
          date: d.submittedDate || d.created_at,
          value,
          workflow: doc.workflow,
          approvalDays: (() => {
            if (!doc.created_at || !doc.updated_at) return 1;
            const diff = new Date(doc.updated_at).getTime() - new Date(doc.created_at).getTime();
            const days = Math.ceil(diff / (1000 * 3600 * 24));
            return days > 0 ? days : 1;
          })()
        };
      });
      setDocuments(mapped);
    });
  }, []);

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
    const data = documents.filter((item) => {
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
  }, [documents, dateFrom, dateTo, filterType, filterDept, sortKey, sortDirection]);

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  // Render Report Bodies
  const renderStatusReport = () => {
    const approved = filteredData.filter(d => d.status === "Approved").length;
    const pending = filteredData.filter(d => d.status === "Pending").length;
    const returned = filteredData.filter(d => d.status === "Returned").length;
    const rejected = filteredData.filter(d => d.status === "Rejected").length;

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <table className="w-full min-w-[700px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <DataTableHeader title="Document ID" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-4 py-4 w-[12%]" />
                <DataTableHeader title="Type" sortKey="type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[10%]" />
                <DataTableHeader title="Department" sortKey="department" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[25%]" />
                <th className="py-4 font-bold text-slate-400 w-[15%]">Requester</th>
                <DataTableHeader title="Status" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[15%]" />
                <DataTableHeader title="Date" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[12%]" />
                <th className="py-4 pr-4 font-bold text-slate-400 w-[11%]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {paginatedData.map((doc, idx) => (
                <tr key={(doc as any).real_id || `${doc.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-4 text-sm font-bold text-slate-500">{doc.id}</td>
                  <td className="py-4 text-xs font-semibold px-2">
                    <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-semibold text-slate-700">{doc.department}</td>
                  <td className="py-4 text-sm text-slate-700 font-medium">{(doc as any).requester}</td>
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
                  <td className="py-4 text-sm text-slate-500 font-medium">{formatDateOnly(doc.date)}</td>
                  <td className="py-4 pr-4 text-sm text-slate-400">{formatTimeOnly(doc.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-end">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-xs ${
                      currentPage === page 
                        ? "bg-blue-600 text-white border-transparent" 
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderApprovalReport = () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl w-full">
          <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <DataTableHeader title="Document ID" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-4 py-4 w-[12%]" />
                <DataTableHeader title="Type" sortKey="type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[8%]" />
                <th className="py-4 font-bold text-slate-400 w-[15%]">Requester</th>
                <th className="py-4 font-bold text-slate-400 w-[15%]">Current Approver</th>
                <th className="py-4 font-bold text-slate-400 w-[15%]">Progress</th>
                <DataTableHeader title="Status" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[12%]" />
                <DataTableHeader title="Date" sortKey="date" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-[12%]" />
                <th className="py-4 pr-4 font-bold text-slate-400 w-[11%]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {paginatedData.map((doc, idx) => {
                const wf = (doc as any).workflow;
                let currentApprover = "-";
                let progress = "-";
                let progressPercentage = 0;
                
                if (wf && wf.steps) {
                  progress = `Step ${wf.current_step} of ${wf.total_steps}`;
                  progressPercentage = ((wf.current_step - 1) / wf.total_steps) * 100;
                  
                  const currentStepObj = wf.steps.find((s: any) => s.step_order === wf.current_step);
                  if (currentStepObj?.approver) {
                    currentApprover = `${currentStepObj.approver.first_name || ""} ${currentStepObj.approver.last_name || ""}`.trim() || currentStepObj.approver.username;
                  }
                  
                  if (doc.status === "Approved") {
                    currentApprover = "Completed";
                    progress = "Done";
                    progressPercentage = 100;
                  } else if (doc.status === "Rejected" || doc.status === "Returned") {
                    currentApprover = "-";
                  }
                }

                return (
                  <tr key={(doc as any).real_id || `${doc.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-4 text-sm font-bold text-slate-500">{doc.id}</td>
                    <td className="py-4 text-xs font-semibold px-2">
                      <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-slate-700 font-medium">{(doc as any).requester}</td>
                    <td className="py-4 text-sm text-slate-700">{currentApprover}</td>
                    <td className="py-4 text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{progress}</span>
                        {wf && wf.total_steps > 0 && doc.status !== 'Rejected' && doc.status !== 'Returned' && (
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${doc.status === 'Approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    </td>
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
                    <td className="py-4 text-sm text-slate-500 font-medium">{formatDateOnly(doc.date)}</td>
                    <td className="py-4 pr-4 text-sm text-slate-400">{formatTimeOnly(doc.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-end">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-xs ${
                      currentPage === page 
                        ? "bg-blue-600 text-white border-transparent" 
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-500 shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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

    const stats = ["PR", "PO", "BK", "OTHER"].map(prefix => {
      const docs = completedDocs.filter(d => d.type === prefix);
      if (docs.length === 0) return null;
      const avg = docs.reduce((sum, d) => sum + (d.approvalDays as number), 0) / docs.length;
      
      let displayName = prefix;
      if (prefix === "BK") displayName = "บันทึก";
      if (prefix === "OTHER") displayName = "Other";
      
      return { type: displayName, count: docs.length, avg };
    }).filter(Boolean) as { type: string, count: number, avg: number }[];

    const getTypeColor = (type: string) => {
      switch(type) {
        case "PR": return "bg-blue-500";
        case "PO": return "bg-purple-500";
        case "บันทึก":
        case "BK": return "bg-emerald-500";
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
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      <PageHeader 
        title="รายงานการจัดการ" 
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
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-1">
            รายงานที่มีให้ใช้
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
          <div className="bg-slate-50/50 p-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-start gap-4">
            <div className="flex-1 w-full flex flex-col sm:flex-row flex-wrap gap-4">
              
              {/* Date Preset Filter */}
              <div className="flex flex-col gap-2 min-w-[220px]">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time Period</label>
                  <select 
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="all">ทั้งหมด (ไม่กรอง)</option>
                    <option value="today">วันนี้</option>
                    <option value="this_month">เดือนนี้</option>
                    <option value="last_month">เดือนที่แล้ว</option>
                    <option value="this_quarter">ไตรมาสนี้</option>
                    <option value="last_quarter">ไตรมาสที่แล้ว</option>
                    <option value="last_6_months">6 เดือนล่าสุด</option>
                    <option value="this_year">ปีนี้</option>
                    <option value="custom">กำหนดช่วงเวลาแทน</option>
                  </select>
                </div>
                
                {datePreset === "custom" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="date" 
                      value={dateFrom}
                      onChange={handleDateFromChange}
                      className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input 
                      type="date" 
                      value={dateTo}
                      onChange={handleDateToChange}
                      className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                    />
                  </div>
                )}
              </div>

              {/* Type Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
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
                {activeReport === "approvals" && renderApprovalReport()}
              </>
            )}
          </div>
          
        </div>
      </div>
      </div>
    </div>
  );
}
