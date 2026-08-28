"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Eye, Search, ChevronLeft, ChevronRight, Plus, Inbox, Send, FileEdit } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { Badge } from '@views/components/ui/badge';
import { getApprovals, Approval } from '@views/features/workflow/api';
import { getDocuments } from '@views/features/documents/api';
import type { Document } from '@views/features/documents/types';
import { getStatusVariant } from "@/lib/document-status";
import { formatThaiDate } from "@/lib/format-date";
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';

export default function SubmissionsPage() {
  const router = useRouter();
  
  // Data States
  const [myDocsList, setMyDocsList] = useState<Document[]>([]);
  
  // Navigation & Filter States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    // Fetch my created documents
    getDocuments().then((data) => {
      // Keep non-approved items created by me
      setMyDocsList(data.filter((doc) => doc.status !== "Approved"));
    });
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

  const getDocTypeCategory = (id: string, typeStr?: string): "PR" | "PO" | "BK" | "OTHER" => {
    const upperId = (id || "").toUpperCase();
    const upperType = (typeStr || "").toUpperCase();
    if (upperId.startsWith("PR") || upperType === "PR") return "PR";
    if (upperId.startsWith("PO") || upperType === "PO") return "PO";
    if (upperId.startsWith("BK") || upperType === "BK" || upperType.includes("MEMO") || upperType.includes("บันทึก")) return "BK";
    return "OTHER";
  };

  const handleToggleType = (typeKey: string) => {
    if (selectedTypes.includes(typeKey)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== typeKey));
    } else {
      setSelectedTypes([...selectedTypes, typeKey]);
    }
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
        approvers: doc.approvers || (doc.workflow?.steps || []).map((s: any) => s.approver ? `${s.approver.first_name} ${s.approver.last_name}` : null).filter(Boolean),
        submittedDate: formatThaiDate(doc.submittedDate || doc.created_at),
        currentLevel: doc.workflow?.current_step || 1,
        maxLevels: doc.workflow?.total_steps || 1,
        status: doc.status,
        isToApprove: false,
      }));

  // Type Counts
  const prCount = rawList.filter((item) => getDocTypeCategory(item.id, item.type) === "PR").length;
  const poCount = rawList.filter((item) => getDocTypeCategory(item.id, item.type) === "PO").length;
  const bkCount = rawList.filter((item) => getDocTypeCategory(item.id, item.type) === "BK").length;
  const otherCount = rawList.filter((item) => getDocTypeCategory(item.id, item.type) === "OTHER").length;

  // Filtering
  const filteredItems = rawList
    .filter((item) => {
      // Document type filter (multi-select)
      if (selectedTypes.length > 0) {
        const itemCategory = getDocTypeCategory(item.id, item.type);
        if (!selectedTypes.includes(itemCategory)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.sender.toLowerCase().includes(query)
        );
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

      const parseThaiDate = (dateStr?: string) => {
        if (!dateStr) return 0;
        const timestamp = Date.parse(dateStr);
        if (!isNaN(timestamp)) return timestamp;

        const months: Record<string, number> = {
          "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3, "พ.ค.": 4, "มิ.ย.": 5,
          "ก.ค.": 6, "ส.ค.": 7, "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11
        };
        const parts = dateStr.split(" ");
        if (parts.length < 3) return 0;
        const day = parseInt(parts[0]);
        const month = months[parts[1]] || 0;
        const year = parseInt(parts[2]) - 543;
        return new Date(year, month, day).getTime();
      };

      if (sortKey && sortDirection) {
        let comparison = 0;
        if (sortKey === "id") {
          comparison = a.id.localeCompare(b.id);
        } else if (sortKey === "submittedDate") {
          comparison = parseThaiDate(a.submittedDate) - parseThaiDate(b.submittedDate);
        } else if (sortKey === "requester") {
          comparison = a.sender.localeCompare(b.sender);
        } else if (sortKey === "status") {
          const priorityA = statusPriority[a.status] ?? 0;
          const priorityB = statusPriority[b.status] ?? 0;
          comparison = priorityA - priorityB;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        const priorityA = statusPriority[a.status] ?? 0;
        const priorityB = statusPriority[b.status] ?? 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        return parseThaiDate(b.submittedDate) - parseThaiDate(a.submittedDate);
      }
    });



  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypes, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const getTypeBadgeClass = (id: string) => {
    if (id.startsWith("PR")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (id.startsWith("PO")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (id.startsWith("CERT")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

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
              <Link
                href="/submissions/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                สร้างเอกสารใหม่
              </Link>
              <Link
                href="/approvals/history"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                ประวัติการอนุมัติ
              </Link>
            </div>
          }
        />



        <div className={`${APP_TABLE_CARD} flex flex-col p-6 space-y-6`}>
          {/* SUB-FILTER TOOLBAR & SEARCH */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Document Type Pills (Multi-select) */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-bold text-slate-400 mr-1">ตัวกรอง:</span>
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTypes.length === 0
                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ทั้งหมด ({rawList.length})
              </button>

              <button
                type="button"
                onClick={() => handleToggleType("PR")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTypes.includes("PR")
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                📄 ใบขอซื้อ (PR)
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTypes.includes("PR")
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {prCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleType("PO")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTypes.includes("PO")
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                📦 ใบสั่งซื้อ (PO)
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTypes.includes("PO")
                      ? "bg-white/20 text-white"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {poCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleType("BK")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTypes.includes("BK")
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                📝 บันทึกข้อความ (BK)
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTypes.includes("BK")
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {bkCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleType("OTHER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTypes.includes("OTHER")
                    ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                📁 เอกสารอื่นๆ
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTypes.includes("OTHER")
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {otherCount}
                </span>
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="relative flex-1 md:w-64 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, เลขที่เอกสาร, ผู้ขอ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
            <table className="w-full table-fixed text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 pl-4 font-bold">ข้อมูลเอกสาร</th>
                  <DataTableHeader title="รหัส (ID)" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <DataTableHeader title="ผู้สร้าง" sortKey="requester" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-36" />
                  <th className="py-4 font-bold w-44">รายชื่อผู้อนุมัติ</th>
                  <DataTableHeader title="วันที่ส่ง" sortKey="submittedDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <th className="py-4 text-center font-bold w-20">ขั้นที่</th>
                  <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 text-center w-36" />
                  <th className="py-4 pr-4 text-center font-bold w-32">ดำเนินการ</th>
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
                          router.push(`/approvals/${item.id}`);
                        }
                      }}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0 ${getTypeBadgeClass(
                              item.id
                            )}`}
                          >
                            {getDocTypeLabel(item.id)}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400">
                              มูลค่า: {item.amount}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-mono font-bold text-slate-500">
                        {item.id}
                      </td>
                      <td className="py-4 text-sm font-semibold text-slate-700">
                        {item.sender}
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
                          L{item.currentLevel} / L{item.maxLevels}
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
                            href={`/approvals/${item.id}`}
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

