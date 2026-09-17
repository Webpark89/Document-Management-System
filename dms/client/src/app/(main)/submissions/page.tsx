"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckSquare, Eye, Search, ChevronLeft, ChevronRight, Plus, Inbox, Send, FileEdit } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { Badge } from '@views/components/ui/badge';
import { getApprovals, Approval } from '@views/features/workflow/api';
import { getDocuments } from '@views/features/documents/api';
import type { Document } from '@views/features/documents/types';
import { getStatusVariant } from "@/lib/document-status";
import { formatThaiDate } from "@/lib/format-date";
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';

import { useAuth } from '@views/components/providers/AuthProvider';

export default function SubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const hasPerm = (itemKey: string, action: string = "view") => {
    return !!user?.permissions?.includes(`submissions.${itemKey}:${action}`);
  };

  // Check view_list permission. If no permission, render a block or just let them see an empty list? Let's just wrap features.
  
  // Data States
  const [myDocsList, setMyDocsList] = useState<Document[]>([]);
  
  // Navigation & Filter States
  const [typeFilters, setTypeFilters] = useState<string[]>(["All"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    if (user && !hasPerm("view_list")) {
      router.replace("/dashboard");
      return;
    }
    // Fetch my created documents
    getDocuments().then((data) => {
      // Keep non-approved items created by me
      setMyDocsList(data.filter((doc) => doc.status !== "Approved"));
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

  const getDocTypeCategory = (id: string, typeStr?: string): "PR" | "PO" | "BK" | "OTHER" => {
    const upperId = (id || "").toUpperCase();
    const upperType = (typeStr || "").toUpperCase();
    if (upperId.startsWith("PR") || upperType === "PR") return "PR";
    if (upperId.startsWith("PO") || upperType === "PO") return "PO";
    if (upperId.startsWith("BK") || upperType === "BK" || upperType.includes("MEMO") || upperType.includes("บันทึก")) return "BK";
    return "OTHER";
  };

  // Counts
  const myPendingCount = myDocsList.filter((d) => d.status === "Pending").length;
  const myDraftCount = myDocsList.filter((d) => d.status === "Draft").length;
  const myReturnedCount = myDocsList.filter((d) => d.status === "Returned" || d.status === "Returned for Revision").length;
  const mySubmissionsTotalCount = myPendingCount + myDraftCount + myReturnedCount;

  // Active items
  const rawList = myDocsList.map((doc) => ({
    id: doc.id,
    real_id: doc.real_id || doc.id,
    name: doc.name || doc.title || "",
    type: doc.type || "PR",
    amount: doc.amount || "-",
    sender: doc.sender || doc.creator_name || "ฉัน",
    department: doc.department || "ไม่ระบุ",
    approvers: doc.approvers || ((doc as any).workflow?.steps || []).map((s: any) => s.approver ? `${s.approver.first_name} ${s.approver.last_name}` : null).filter(Boolean),
    submittedDate: formatThaiDate(doc.submittedDate || doc.created_at),
    createdAtTime: new Date(doc.created_at || doc.submittedDate || 0).getTime(),
    currentLevel: (doc as any).workflow?.current_step || 1,
    maxLevels: (doc as any).workflow?.total_steps || 1,
    status: doc.status,
    isToApprove: false,
    rawCreatedAt: doc.created_at,
  }));

  // Filtering
  const filteredItems = rawList
    .filter((item) => {
      // Document type filter (multi-select with 'All')
      if (!typeFilters.includes("All")) {
        const itemCategory = getDocTypeCategory(item.id, item.type);
        const mappedCategory = itemCategory === "OTHER" ? "DOC" : itemCategory;
        if (!typeFilters.includes(mappedCategory)) return false;
      }

      // Department filter
      if (deptFilter && item.department !== deptFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!(
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.sender.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
        )) {
          return false;
        }
      }

      // Date Range Filter
      if (dateFrom || dateTo) {
        const docDate = new Date(item.rawCreatedAt || item.createdAtTime);
        docDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (docDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (docDate > to) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const statusPriority: Record<string, number> = {
        "Pending": 4,
        "Draft": 3,
        "Returned": 2,
        "Returned for Revision": 2,
        "Approved": 1,
        "Cancelled": 0
      };

      if (sortKey && sortDirection) {
        let comparison = 0;
        if (sortKey === "id") {
          comparison = a.id.localeCompare(b.id);
        } else if (sortKey === "requester") {
          comparison = a.sender.localeCompare(b.sender);
        } else if (sortKey === "department") {
          comparison = a.department.localeCompare(b.department);
        } else if (sortKey === "submittedDate") {
          comparison = a.createdAtTime - b.createdAtTime;
        } else if (sortKey === "status") {
          const pA = statusPriority[a.status] ?? -1;
          const pB = statusPriority[b.status] ?? -1;
          comparison = pB - pA;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return b.createdAtTime - a.createdAtTime;
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilters, searchQuery, dateFrom, dateTo, deptFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const getTypeBadgeClass = (id: string) => {
    if (id.startsWith("PR")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (id.startsWith("PO")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (id.startsWith("CERT")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (id.startsWith("DOC")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 px-2 py-0.5 shadow-none font-bold">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-amber-50 text-amber-600 border-amber-200 px-2 py-0.5 shadow-none font-bold">Pending</Badge>;
      case "Returned":
      case "Returned for Revision":
        return <Badge className="bg-rose-50 text-rose-600 border-rose-200 px-2 py-0.5 shadow-none font-bold">Returned</Badge>;
      case "Draft":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-2 py-0.5 shadow-none font-bold">Draft</Badge>;
      case "Cancelled":
        return <Badge className="bg-slate-100 text-slate-400 border-slate-200 px-2 py-0.5 shadow-none font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-2 py-0.5 shadow-none font-bold">{status}</Badge>;
    }
  };

  // Unique departments for filter dropdown
  const uniqueDepartments = Array.from(new Set(rawList.map(item => item.department))).filter(Boolean);

  const getDocTypeLabel = (id: string) => {
    if (id.startsWith("PR")) return "PR";
    if (id.startsWith("PO")) return "PO";
    if (id.startsWith("CERT")) return "CERT";
    return "DOC";
  };

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        {/* HEADER WITH CREATE BUTTON & HISTORY */}
        <PageHeader
          title="ส่งเรื่องขออนุมัติ (My Submissions)"
          subtitle="จัดการเอกสารแบบร่าง หรือติดตามเอกสารที่คุณสร้างเพื่อขออนุมัติ"
          actions={
            <div className="flex items-center gap-2">
              {hasPerm("create_document", "create") && (
                <Link
                  href="/submissions/create"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  สร้างเอกสารใหม่
                </Link>
              )}
              {hasPerm("view_approval_history", "view") && (
                <Link
                  href="/approvals/history"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  ประวัติการอนุมัติ
                </Link>
              )}
            </div>
          }
        />

        <div className={`${APP_TABLE_CARD} flex flex-col p-6 space-y-6`}>
          {/* Search + Filter controls group */}
          <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-4 overflow-x-auto w-full">
            <div className="flex items-center gap-3 w-[250px] shrink-0">
              
              {/* Search */}
              {hasPerm("search_sort", "view") && (
              <div className="relative w-full shrink-0">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, เลขที่เอกสาร, ผู้ขอ, แผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>
              )}

              {/* Type Filter & Date Range & Dept */}
              <div className="flex items-center gap-4 shrink-0 flex-nowrap">
                
                {/* Type Filter */}
                {hasPerm("search_sort", "view") && (
                <div className="flex items-center gap-1.5 py-1 shrink-0">
                  {[
                    { value: "All", label: "ทุกประเภท" },
                    { value: "PR", label: "PR" },
                    { value: "PO", label: "PO" },
                    { value: "BK", label: "BK" },
                    { value: "DOC", label: "DOC" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        if (type.value === "All") {
                          setTypeFilters(["All"]);
                        } else {
                          let newFilters = typeFilters.includes("All") ? [] : [...typeFilters];
                          if (newFilters.includes(type.value)) {
                            newFilters = newFilters.filter((t) => t !== type.value);
                          } else {
                            newFilters.push(type.value);
                          }
                          if (newFilters.length === 0) newFilters = ["All"];
                          setTypeFilters(newFilters);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap ${
                        typeFilters.includes(type.value)
                          ? 'bg-slate-100 border-slate-300 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {typeFilters.includes(type.value) && <Check className="w-3.5 h-3.5" />}
                      {type.label}
                    </button>
                  ))}
                </div>
                )}

                {/* Date Range & Dept Filter */}
                <div className="flex items-center gap-3 border-l border-slate-100 pl-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">แผนก:</span>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-1 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="">ทั้งหมด</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-px h-6 bg-slate-100"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">ช่วงวันที่:</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-1 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl py-1 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    />
                  </div>
                  
                  {(dateFrom || dateTo || deptFilter) && (
                    <button
                      type="button"
                      onClick={() => { setDateFrom(""); setDateTo(""); setDeptFilter(""); }}
                      className="text-[11px] font-bold text-rose-500 hover:underline ml-1 shrink-0"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
            <table className="w-full table-fixed text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 pl-4 font-bold">ข้อมูลเอกสาร</th>
                  <DataTableHeader title="รหัส (ID)" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <DataTableHeader title="ผู้สร้าง" sortKey="requester" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <DataTableHeader title="แผนก" sortKey="department" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <th className="py-4 font-bold w-40">รายชื่อผู้อนุมัติ</th>
                  <DataTableHeader title="วันที่ส่ง" sortKey="submittedDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <th className="py-4 text-center font-bold w-16">ขั้นที่</th>
                  <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 text-center w-28" />
                  <th className="py-4 pr-4 text-center font-bold w-24">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {filteredItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (item.status === "Draft") {
                          router.push(`/submissions/create?draftId=${item.real_id}`);
                        } else {
                          // If they need to approve, send them to approval. Otherwise send to detail view.
                          if (item.isToApprove) {
                            router.push(`/approvals/${item.id}`);
                          } else {
                            router.push(`/documents/${item.real_id}?source=submissions`);
                          }
                        }
                      }}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${getTypeBadgeClass(item.id)}`}>
                            <FileEdit className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">มูลค่า: {item.amount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.id}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold text-slate-700">{item.sender}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{item.department}</span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-slate-700">
                        {item.approvers && item.approvers.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {item.approvers.map((name: string, index: number) => (
                              <span key={index} className="leading-tight block text-slate-600 font-medium">
                                • {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-400 font-medium">
                        {item.submittedDate}
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {item.currentLevel} / {item.maxLevels}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.isToApprove ? (
                          <Link
                            href={`/approvals/${item.id}`}
                            className="px-2.5 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer leading-tight"
                          >
                            <CheckSquare className="w-4 h-4 shrink-0" />
                            <div className="flex flex-col text-left text-[11px] leading-tight font-extrabold">
                              <span>อนุมัติ</span>
                              <span>ตรวจสอบ</span>
                            </div>
                          </Link>
                        ) : item.status === "Draft" ? (
                          <Link
                            href={`/submissions/create?draftId=${item.real_id}`}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer leading-tight border border-slate-200"
                          >
                            <FileEdit className="w-4 h-4 shrink-0 text-slate-500" />
                            <div className="flex flex-col text-left text-[11px] leading-tight font-extrabold">
                              <span>แก้ไข</span>
                              <span>แบบร่าง</span>
                            </div>
                          </Link>
                        ) : (
                          <Link
                            href={`/documents/${item.real_id}?source=submissions`}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer leading-tight border border-slate-200"
                          >
                            <Eye className="w-4 h-4 shrink-0 text-slate-500" />
                            <div className="flex flex-col text-left text-[11px] leading-tight font-extrabold">
                              <span>ติดตาม</span>
                              <span>สถานะ</span>
                            </div>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm font-medium text-slate-400"
                    >
                      ไม่พบรายการเอกสารในหมวดหมู่นี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-semibold text-slate-500">
              <span>
                แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredItems.length)} จากทั้งหมด{" "}
                {filteredItems.length} รายการ
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg border text-center transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-slate-100 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
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

