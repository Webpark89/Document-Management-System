"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import DataTableHeader from "@/components/ui/DataTableHeader";
import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
  APP_TABLE_CARD,
  MD_THEAD,
  MD_TR,
} from "@/components/ui/design-system";
import { AdminPageHeader } from "@/app/(main)/admin/master-data/master-data-ui";

// ─── TYPES & MOCK DATA ────────────────────────────────────────────────────────
type ActionType = "Login" | "Upload" | "Download" | "View" | "Edit" | "Delete" | "Approve" | "Reject" | "Signature";
type ModuleType = "Documents" | "Users" | "Roles" | "Approvals" | "Master Data" | "Auth" | "All";

interface AuditLogExtended {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: ActionType;
  module: ModuleType;
  targetId: string;
  targetLabel: string;
  targetType: "document" | "user" | "role" | "none";
  ipAddress: string;
  details: Record<string, any>;
}

const EXTENDED_MOCK_LOGS: AuditLogExtended[] = [
  { id: "al-01", timestamp: "2026-07-17T09:15:00Z", userId: "u1", userName: "วิภา รักดี", action: "Login", module: "Auth", targetId: "", targetLabel: "-", targetType: "none", ipAddress: "192.168.1.45", details: { browser: "Chrome 120", os: "Windows 11" } },
  { id: "al-02", timestamp: "2026-07-17T09:30:22Z", userId: "u2", userName: "สมชาย ใจดี", action: "Upload", module: "Documents", targetId: "PR-2026-0005", targetLabel: "ขอซื้อเมาส์และคีย์บอร์ด", targetType: "document", ipAddress: "192.168.1.102", details: { fileName: "pr_mouse_kb.pdf", fileSize: "2.4 MB" } },
  { id: "al-03", timestamp: "2026-07-17T10:05:11Z", userId: "u1", userName: "วิภา รักดี", action: "View", module: "Documents", targetId: "PR-2026-0005", targetLabel: "ขอซื้อเมาส์และคีย์บอร์ด", targetType: "document", ipAddress: "192.168.1.45", details: { duration: "45s" } },
  { id: "al-04", timestamp: "2026-07-17T10:12:44Z", userId: "u1", userName: "วิภา รักดี", action: "Approve", module: "Approvals", targetId: "PR-2026-0005", targetLabel: "ขอซื้อเมาส์และคีย์บอร์ด", targetType: "document", ipAddress: "192.168.1.45", details: { level: 1, comment: "อนุมัติเบื้องต้น" } },
  { id: "al-05", timestamp: "2026-07-17T11:00:00Z", userId: "u3", userName: "อรทัย สุขใจ", action: "Login", module: "Auth", targetId: "", targetLabel: "-", targetType: "none", ipAddress: "10.0.0.15", details: { browser: "Safari 17", os: "macOS Sonoma" } },
  { id: "al-06", timestamp: "2026-07-17T11:15:30Z", userId: "u3", userName: "อรทัย สุขใจ", action: "Edit", module: "Users", targetId: "u2", targetLabel: "สมชาย ใจดี", targetType: "user", ipAddress: "10.0.0.15", details: { field: "department", oldValue: "พนักงานทั่วไป", newValue: "แผนกจัดซื้อ" } },
  { id: "al-07", timestamp: "2026-07-17T13:20:10Z", userId: "u4", userName: "ประยุทธ์ สร้างชาติ", action: "Reject", module: "Approvals", targetId: "PO-2026-0004", targetLabel: "จัดจ้างที่ปรึกษา HR", targetType: "document", ipAddress: "192.168.2.11", details: { reason: "งบประมาณไตรมาสนี้ไม่เพียงพอ โปรดเลื่อนไป Q4" } },
  { id: "al-08", timestamp: "2026-07-16T08:45:00Z", userId: "u5", userName: "Admin System", action: "Delete", module: "Users", targetId: "u99", targetLabel: "test.user", targetType: "user", ipAddress: "127.0.0.1", details: { reason: "พ้นสภาพพนักงาน" } },
  { id: "al-09", timestamp: "2026-07-16T14:30:00Z", userId: "u1", userName: "วิภา รักดี", action: "Signature", module: "Approvals", targetId: "PO-2026-0001", targetLabel: "ใบสั่งซื้อ Laptop Dell สำหรับทีม IT", targetType: "document", ipAddress: "192.168.1.45", details: { certId: "CERT-9921", method: "Digital Certificate" } },
  { id: "al-10", timestamp: "2026-07-16T15:10:00Z", userId: "u2", userName: "สมชาย ใจดี", action: "Download", module: "Documents", targetId: "MM-2026-0001", targetLabel: "บันทึกข้อความภายใน", targetType: "document", ipAddress: "192.168.1.102", details: { format: "PDF", isWatermarked: true } },
  { id: "al-11", timestamp: "2026-07-15T09:00:00Z", userId: "u1", userName: "วิภา รักดี", action: "Login", module: "Auth", targetId: "", targetLabel: "-", targetType: "none", ipAddress: "192.168.1.45", details: { browser: "Chrome 120", os: "Windows 11" } },
  { id: "al-12", timestamp: "2026-07-15T10:20:00Z", userId: "u5", userName: "Admin System", action: "Edit", module: "Roles", targetId: "r2", targetLabel: "Manager Role", targetType: "role", ipAddress: "127.0.0.1", details: { permissionAdded: ["approve_level_2"] } },
  { id: "al-13", timestamp: "2026-07-15T11:45:00Z", userId: "u4", userName: "ประยุทธ์ สร้างชาติ", action: "View", module: "Documents", targetId: "PO-2026-0002", targetLabel: "ใบสั่งซื้อวัตถุดิบ เดือนกรกฎาคม", targetType: "document", ipAddress: "192.168.2.11", details: { duration: "120s" } },
  { id: "al-14", timestamp: "2026-07-14T14:15:00Z", userId: "u3", userName: "อรทัย สุขใจ", action: "Upload", module: "Master Data", targetId: "md-1", targetLabel: "Vendor List", targetType: "none", ipAddress: "10.0.0.15", details: { recordsAdded: 15, fileName: "vendors_july.xlsx" } },
  { id: "al-15", timestamp: "2026-07-14T16:30:00Z", userId: "u2", userName: "สมชาย ใจดี", action: "Edit", module: "Documents", targetId: "PR-2026-0001", targetLabel: "ขอซื้ออุปกรณ์สำนักงาน Q3/2026", targetType: "document", ipAddress: "192.168.1.102", details: { field: "value", oldValue: 12000, newValue: 15000 } },
];

const ALL_ACTIONS: ActionType[] = ["Login", "Upload", "Download", "View", "Edit", "Delete", "Approve", "Reject", "Signature"];
const ALL_MODULES: ModuleType[] = ["Documents", "Users", "Roles", "Approvals", "Master Data", "Auth"];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
function AuditLogsContent() {
  const searchParams = useSearchParams();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedModule, setSelectedModule] = useState<ModuleType | "All">("All");

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
  
  // Multi-select for actions
  const [selectedActions, setSelectedActions] = useState<Set<ActionType>>(new Set());

  // Expanded rows for Details
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pre-apply filters from URL if coming from e.g. /approvals
  useEffect(() => {
    const pModule = searchParams.get("module") as ModuleType;
    const pActions = searchParams.get("action");
    
    if (pModule && ALL_MODULES.includes(pModule)) {
      setSelectedModule(pModule);
    }
    if (pActions) {
      const actionsArr = pActions.split(",").filter(a => ALL_ACTIONS.includes(a as ActionType)) as ActionType[];
      if (actionsArr.length > 0) {
        setSelectedActions(new Set(actionsArr));
      }
    }
  }, [searchParams]);

  const toggleActionFilter = (action: ActionType) => {
    const newSet = new Set(selectedActions);
    if (newSet.has(action)) {
      newSet.delete(action);
    } else {
      newSet.add(action);
    }
    setSelectedActions(newSet);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setSelectedModule("All");
    setSelectedActions(new Set());
    setSortKey(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  // 1. Filter & Sort Data
  const filteredLogs = useMemo(() => {
    const data = EXTENDED_MOCK_LOGS.filter(log => {
      // 1. Search
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        if (!log.userName.toLowerCase().includes(lowerTerm) && !log.userId.toLowerCase().includes(lowerTerm)) {
          return false;
        }
      }
      // 2. Date Range
      const logDate = log.timestamp.substring(0, 10);
      if (dateFrom && logDate < dateFrom) return false;
      if (dateTo && logDate > dateTo) return false;
      
      // 3. Module
      if (selectedModule !== "All" && log.module !== selectedModule) return false;

      // 4. Action
      if (selectedActions.size > 0 && !selectedActions.has(log.action)) return false;

      return true;
    });

    if (sortKey && sortDirection) {
      data.sort((a, b) => {
        let comparison = 0;
        if (sortKey === "timestamp") {
          comparison = a.timestamp.localeCompare(b.timestamp);
        } else if (sortKey === "userName") {
          comparison = a.userName.localeCompare(b.userName);
        } else if (sortKey === "action") {
          comparison = a.action.localeCompare(b.action);
        } else if (sortKey === "module") {
          comparison = a.module.localeCompare(b.module);
        } else if (sortKey === "ipAddress") {
          comparison = a.ipAddress.localeCompare(b.ipAddress);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else {
      // Default: Newest first
      data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    return data;
  }, [searchTerm, dateFrom, dateTo, selectedModule, selectedActions, sortKey, sortDirection]);

  // 2. Pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 3. Styling Helpers
  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case "Approve":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Reject":
      case "Delete":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "View":
      case "Download":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Edit":
      case "Upload":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Login":
      case "Signature":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTargetLink = (targetType: string, targetId: string) => {
    if (!targetId) return "#";
    if (targetType === "document") return `/documents/${targetId}`;
    if (targetType === "user") return `/admin/config/users`; // Placeholder
    return "#";
  };

  const formatDateTimeTH = (isoString: string) => {
    const d = new Date(isoString);
    // Simple mock formatting for TH layout (e.g. 17 ก.ค. 2026, 16:30)
    return d.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 4. Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Timestamp", "User", "Action", "Module", "Target ID", "Target Label", "IP Address", "Details"];
    let csvContent = headers.join(",") + "\\n";
    filteredLogs.forEach(log => {
      const detailsStr = JSON.stringify(log.details).replace(/"/g, '""');
      csvContent += `"${log.timestamp}","${log.userName}","${log.action}","${log.module}","${log.targetId}","${log.targetLabel}","${log.ipAddress}","${detailsStr}"\\n`;
    });

    const blob = new Blob(["\\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_log_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      {/* ⚠️ NOTE FOR DEVELOPERS: This page must be guarded by AdminRoleGuard on backend ⚠️ */}

      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="font-medium text-slate-600">Audit Logs</span>
          </nav>
        }
        title="บันทึกการตรวจสอบระบบ"
        subtitle="บันทึกประวัติการใช้งานและตรวจสอบความปลอดภัยของระบบ (Security & Compliance)"
        actions={
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Download className="size-4" />
            ส่งออก CSV
          </button>
        }
      />

      <div className={`${APP_TABLE_CARD} flex flex-col overflow-hidden`}>
        
        {/* FILTER BAR */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4">
            
            {/* Left: Standard Filters */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search User</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name or ID"
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex xl:flex-col gap-2 justify-end xl:w-32 shrink-0">
              <button 
                onClick={clearFilters}
                className="flex-1 xl:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
              <button 
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Multi-select Action Badges */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Action Types (Multi-select)</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ACTIONS.map(action => {
                const isSelected = selectedActions.has(action);
                return (
                  <button
                    key={action}
                    onClick={() => toggleActionFilter(action)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {action}
                  </button>
                );
              })}
              {selectedActions.size > 0 && (
                <button 
                  onClick={() => setSelectedActions(new Set())}
                  className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto w-full">
          <table className="w-full table-fixed min-w-[900px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <DataTableHeader title="Timestamp" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-44" />
                <DataTableHeader title="User" sortKey="userName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-40" />
                <DataTableHeader title="Action" sortKey="action" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-24" />
                <DataTableHeader title="Module" sortKey="module" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-24" />
                <th className="py-3 px-4 w-48 font-bold">Target</th>
                <DataTableHeader title="IP Address" sortKey="ipAddress" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-32" />
                <th className="py-3 px-4 w-16 text-center font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-slate-600 font-bold text-sm">ไม่พบข้อมูล Audit Log</p>
                      <p className="text-slate-400 text-xs mt-1">ลองปรับเงื่อนไขการค้นหาหรือช่วงเวลาใหม่อีกครั้ง</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-slate-700">{formatDateTimeTH(log.timestamp)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-slate-800">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">ID: {log.userId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-600">
                        {log.module}
                      </td>
                      <td className="py-3 px-4">
                        {log.targetType !== "none" ? (
                          <div className="flex flex-col">
                            <Link href={getTargetLink(log.targetType, log.targetId)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors truncate block">
                              {log.targetLabel}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono">{log.targetId}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          className={`p-1.5 rounded-lg transition-colors ${expandedRow === log.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* EXPANDED DETAILS ROW */}
                    {expandedRow === log.id && (
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <td colSpan={7} className="p-0">
                          <div className="px-6 py-4 border-l-4 border-indigo-400 ml-4 my-2 rounded-r-xl bg-white shadow-xs">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                  <span className="text-xs text-slate-500 font-semibold">{key}</span>
                                  <span className="text-sm font-bold text-slate-800 break-words">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-700">{totalItems}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = currentPage === page;
                  return (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors shadow-sm ${
                        isActive 
                          ? 'bg-indigo-600 text-white border-transparent' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// Wrap in Suspense since it uses useSearchParams
export default function AuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Audit Logs...</div>}>
      <AuditLogsContent />
    </Suspense>
  );
}
