"use client";

import { Pagination } from '@views/components/shared/Pagination';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckSquare, Eye, Search, ChevronLeft, ChevronRight, FileText, FileEdit } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { Badge } from '@views/components/ui/badge';
import { getDocuments } from '@views/features/documents/api';
import type { Document } from '@views/features/documents/types';
import { getStatusVariant } from "@/lib/document-status";
import { formatThaiDate } from "@/lib/format-date";
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';
import { useAuth } from '@views/components/providers/AuthProvider';
import DocTypeBadge from '@views/components/shared/DocTypeBadge';

export default function ApprovedSubmissionsHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Data States
  const [approvedDocs, setApprovedDocs] = useState<Document[]>([]);
  
  // Filter States
  const [typeFilters, setTypeFilters] = useState<string[]>(["All"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!user) return;
    
    // Fetch documents created by current user that are Approved
    getDocuments()
      .then((data) => {
        if (data && Array.isArray(data)) {
          const approved = data.filter((doc) => {
            const isCreator = (doc as any).creator_id === user.id || (doc as any).creator?.id === user.id;
            return isCreator && doc.status === "Approved";
          });
          setApprovedDocs(approved);
        } else {
          setApprovedDocs([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load approved submissions:", err);
        setApprovedDocs([]);
      });
  }, [user]);

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

  const getDocTypeCategory = (docId: string, docTypeStr?: string) => {
    const prefix = docId.split("-")[0]?.toUpperCase() || "";
    if (["PR", "PO", "BK"].includes(prefix)) return prefix;
    if (docTypeStr) {
      const typeUpper = docTypeStr.toUpperCase();
      if (typeUpper.includes("PR") || typeUpper.includes("ขอซื้อ")) return "PR";
      if (typeUpper.includes("PO") || typeUpper.includes("สั่งซื้อ")) return "PO";
      if (typeUpper.includes("BK") || typeUpper.includes("บันทึก")) return "BK";
    }
    return "DOC";
  };

  const toggleTypeFilter = (type: string) => {
    if (type === "All") {
      setTypeFilters(["All"]);
      setCurrentPage(1);
      return;
    }

    let updated = typeFilters.filter((t) => t !== "All");
    if (updated.includes(type)) {
      updated = updated.filter((t) => t !== type);
    } else {
      updated.push(type);
    }

    if (updated.length === 0) {
      updated = ["All"];
    }

    setTypeFilters(updated);
    setCurrentPage(1);
  };

  const getTypeBadgeClass = (docId: string) => {
    const prefix = docId.split("-")[0]?.toUpperCase() || "";
    switch (prefix) {
      case "PR":
        return "bg-blue-50 text-blue-600 border border-blue-200/60";
      case "PO":
        return "bg-purple-50 text-purple-600 border border-purple-200/60";
      case "BK":
        return "bg-amber-50 text-amber-600 border border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200/60";
    }
  };

  // Process list
  const rawList = approvedDocs.map((doc) => ({
    id: doc.id,
    real_id: doc.real_id || doc.id,
    name: doc.title || doc.name,
    amount: doc.amount || "-",
    sender: doc.sender || doc.creator_name || "ฉัน",
    department: doc.department || "-",
    approvers: Array.isArray(doc.approvers) ? doc.approvers : [],
    type: doc.type,
    createdDate: doc.submittedDate
      ? formatThaiDate(new Date(doc.submittedDate))
      : formatThaiDate(new Date(doc.created_at || Date.now())),
    approvedDate: doc.approved_at
      ? formatThaiDate(new Date(doc.approved_at))
      : formatThaiDate(new Date(doc.created_at || Date.now())),
    status: doc.status,
    rawCreatedAt: doc.created_at || new Date().toISOString(),
  }));

  // Filtering
  const filteredItems = rawList
    .filter((item) => {
      // Document type filter
      if (!typeFilters.includes("All")) {
        const itemCategory = getDocTypeCategory(item.id, item.type);
        const mappedCategory = itemCategory === "OTHER" ? "DOC" : itemCategory;
        if (!typeFilters.includes(mappedCategory)) return false;
      }

      // Department Filter
      if (deptFilter && item.department !== deptFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.name.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchSender = item.sender.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        const matchApprovers = item.approvers.some((app: string) => app.toLowerCase().includes(q));
        if (!matchTitle && !matchId && !matchSender && !matchDept && !matchApprovers) return false;
      }

      // Date Range Filter
      if (dateFrom || dateTo) {
        const itemDate = new Date(item.rawCreatedAt || Date.now()).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).setHours(0, 0, 0, 0);
          if (itemDate < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).setHours(23, 59, 59, 999);
          if (itemDate > toTime) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortKey || !sortDirection) return 0;
      let valA: any = a[sortKey as keyof typeof a];
      let valB: any = b[sortKey as keyof typeof b];

      if (sortKey === "createdDate" || sortKey === "approvedDate") {
        valA = new Date(a.rawCreatedAt || Date.now()).getTime();
        valB = new Date(b.rawCreatedAt || Date.now()).getTime();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Extract unique departments for filter dropdown
  const departments = Array.from(
    new Set(rawList.map((i) => i.department).filter((d) => d && d !== "-"))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        {/* HEADER */}
        <PageHeader
          title="ประวัติการถูกอนุมัติ (Approved Submissions)"
          subtitle="รายการเอกสารที่คุณเป็นผู้สร้างที่ได้รับการอนุมัติเรียบร้อยแล้ว"
          actions={
            <Link
              href="/submissions"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              กลับหน้าส่งเรื่องขออนุมัติ
            </Link>
          }
        />

        <div className={`${APP_TABLE_CARD} flex flex-col p-6 space-y-6`}>
          {/* SEARCH & FILTERS */}
          <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-4 overflow-x-auto w-full">
            <div className="flex items-center gap-3 w-[250px] shrink-0">
              <div className="relative w-full shrink-0">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, เลขที่เอกสาร..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {[
                  { id: "All", label: "ทุกประเภท" },
                  { id: "PR", label: "PR" },
                  { id: "PO", label: "PO" },
                  { id: "BK", label: "BK" },
                  { id: "DOC", label: "DOC" },
                ].map((cat) => {
                  const isSelected = typeFilters.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleTypeFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-white text-slate-800 shadow-2xs"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      {isSelected && cat.id !== "All" && <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />}
                      {isSelected && cat.id === "All" && <Check className="w-3 h-3 text-blue-500 stroke-[3]" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Department Dropdown */}
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">แผนก: ทั้งหมด</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50/80 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span>ช่วงวันที่:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 p-0 text-xs text-slate-700 focus:ring-0 cursor-pointer font-medium"
                />
                <span>-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 p-0 text-xs text-slate-700 focus:ring-0 cursor-pointer font-medium"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
            <table className="w-full table-fixed text-left border-collapse min-w-[1150px]">
              <colgroup>
                <col className="w-[300px]" />
                <col className="w-[140px]" />
                <col className="w-[130px]" />
                <col className="w-[120px]" />
                <col className="w-[160px]" />
                <col className="w-[120px]" />
                <col className="w-[110px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-3 font-bold">ข้อมูลเอกสาร</th>
                  <DataTableHeader
                    title="รหัส (ID)"
                    sortKey="id"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <DataTableHeader
                    title="ผู้สร้าง"
                    sortKey="sender"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <DataTableHeader
                    title="แผนก"
                    sortKey="department"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <th className="py-3.5 px-3 font-bold">รายชื่อผู้อนุมัติ</th>
                  <DataTableHeader
                    title="วันที่อนุมัติ"
                    sortKey="approvedDate"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <DataTableHeader
                    title="สถานะ"
                    sortKey="status"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3 text-center"
                  />
                  <th className="py-3.5 pr-4 pl-3 text-center font-bold">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/documents/${item.real_id}?source=submissions_history`)}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4 pr-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <DocTypeBadge docId={item.id} type={item.type} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block truncate">มูลค่า: {item.amount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm font-mono font-bold text-slate-600 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-4 px-3 text-sm font-semibold text-slate-700 truncate" title={item.sender}>
                        {item.sender}
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md inline-block max-w-full truncate" title={item.department}>
                          {item.department}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-xs font-semibold text-slate-700">
                        {item.approvers.length > 0 ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            {item.approvers.map((app: string, idx: number) => (
                              <span key={idx} className="text-[11px] text-slate-600 flex items-center gap-1 truncate" title={app}>
                                <span className="text-emerald-500 font-bold shrink-0">•</span> <span className="truncate">{app}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-sm text-slate-400 font-medium whitespace-nowrap">
                        {item.approvedDate}
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <Badge variant={getStatusVariant(item.status)} className="font-extrabold shadow-2xs">
                          อนุมัติแล้ว
                        </Badge>
                      </td>
                      <td className="py-4 pr-4 pl-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/documents/${item.real_id}?source=submissions_history`}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-emerald-200/60"
                        >
                          <Eye className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>ดูเอกสาร</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-16 text-center text-sm font-medium text-slate-400"
                    >
                      ไม่พบประวัติเอกสารที่ได้รับการอนุมัติ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredItems.length > 0 && (
            <div className="-mx-4 -mb-4 sm:mx-0 sm:mb-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
