"use client";

import { Pagination } from "@views/components/shared/Pagination";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileEdit,
} from "lucide-react";

import PageHeader from "@views/components/shared/PageHeader";
import DocTypeBadge from "@views/components/shared/DocTypeBadge";

import { useAuth } from "@views/components/providers/AuthProvider";
import { getDocuments } from "@views/features/documents/api";

import { formatThaiDate } from "@/lib/format-date";
import DataTableHeader from "@views/components/ui/DataTableHeader";

import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
  APP_TABLE_CARD,
} from "@views/components/ui/design-system";

export interface ApprovalHistoryItem {
  id: string;
  docId: string;
  docName: string;
  amount: string;
  requester: string;
  approverName: string;
  action: "Approved" | "Rejected" | "Returned for Revision";
  actionDate: string;
  comment?: string;
  level: string;
  type?: string;
}

export default function ApprovalHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<ApprovalHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("All");

  const [sortKey, setSortKey] = useState<string | null>("actionDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    "desc",
  );

  useEffect(() => {
    if (!user) return;
    getDocuments()
      .then((docs) => {
        const realHistory: ApprovalHistoryItem[] = [];
        docs.forEach((doc: any) => {
          const flows = [
            ...(doc._meta?.workflow_history ?? []),
            ...(doc.workflow ? [doc.workflow] : []),
          ];
          flows.forEach((flow: any) => {
            (flow.steps ?? []).forEach((step: any) => {
              if (
                (step.status === "Approved" || step.status === "Rejected") &&
                (step.approver_id === user.id ||
                  user.permissions?.includes("approvals.view_all:view"))
              ) {
                const approverName = step.approver
                  ? `${step.approver.first_name || ""} ${step.approver.last_name || ""}`.trim()
                  : "ผู้อนุมัติ";
                realHistory.push({
                  id: step.id || `${doc.id}-${step.step_order}`,
                  docId: doc.id,
                  docName: doc.title || doc.name,
                  type: doc.type,
                  amount: doc.amount || "-",

                  requester: doc.creator_name || doc.sender || "ไม่ระบุ",
                  approverName,
                  action: step.return_to_step
                    ? "Returned for Revision"
                    : (step.status as any),
                  actionDate: step.action_date || "—",
                  comment: step.comment || "อนุมัติตามขั้นตอน",
                  level: `L${step.step_order}/${flow.total_steps || step.step_order}`,
                });
              }
            });
          });
        });
        setHistoryItems(realHistory);
      })
      .catch(() => {});
  }, [user]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const filteredHistory = useMemo(() => {
    return historyItems
      .filter((item) => {
        if (selectedAction !== "All" && item.action !== selectedAction)
          return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.docName.toLowerCase().includes(q) ||
            item.docId.toLowerCase().includes(q) ||
            item.requester.toLowerCase().includes(q) ||
            item.approverName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;
        let comp = 0;
        if (sortKey === "docId") comp = a.docId.localeCompare(b.docId);
        else if (sortKey === "actionDate")
          comp = a.actionDate.localeCompare(b.actionDate);
        else if (sortKey === "requester")
          comp = a.requester.localeCompare(b.requester);
        else if (sortKey === "action") comp = a.action.localeCompare(b.action);
        return sortDirection === "asc" ? comp : -comp;
      });
  }, [historyItems, searchQuery, selectedAction, sortKey, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getActionBadge = (action: ApprovalHistoryItem["action"]) => {
    switch (action) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
          </span>
        );
      case "Returned for Revision":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5" /> ส่งกลับแก้ไข
          </span>
        );
    }
  };

  const getTypeBadgeClass = (id: string) => {
    if (id.startsWith("PR")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (id.startsWith("PO"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (id.startsWith("CERT"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (id.startsWith("DOC") || id.startsWith("BK"))
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        <PageHeader
          title="ประวัติการอนุมัติ (Approval History)"
          subtitle="ประวัติและผลการพิจารณาอนุมัติเอกสารทั้งหมดของคุณ"
          actions={
            <Link
              href="/approvals"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              กลับหน้าอนุมัติเอกสาร
            </Link>
          }
        />

        <div className={`${APP_TABLE_CARD} flex flex-col p-6 space-y-6`}>
          {/* TOOLBAR */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedAction("All")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedAction === "All"
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setSelectedAction("Approved")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedAction === "Approved"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                อนุมัติแล้ว
              </button>
              <button
                onClick={() => setSelectedAction("Returned for Revision")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedAction === "Returned for Revision"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ส่งกลับแก้ไข
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 md:w-64 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเอกสาร, เลขที่, ผู้ขอ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
            <table className="w-full table-fixed text-left border-collapse min-w-[1100px]">
              <colgroup>
                <col className="w-[160px]" />
                <col className="w-[280px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[180px]" />
                <col className="w-[110px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <DataTableHeader
                    title="วันเวลาดำเนินการ"
                    sortKey="actionDate"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 pl-4 pr-3"
                  />
                  <th className="py-3.5 px-3 font-bold">ข้อมูลเอกสาร</th>
                  <DataTableHeader
                    title="รหัสเอกสาร"
                    sortKey="docId"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <DataTableHeader
                    title="ผู้ขออนุมัติ"
                    sortKey="requester"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3"
                  />
                  <DataTableHeader
                    title="ผลการพิจารณา"
                    sortKey="action"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="py-3.5 px-3 text-center"
                  />
                  <th className="py-3.5 px-3 font-bold">หมายเหตุ / เหตุผล</th>
                  <th className="py-3.5 pr-4 pl-3 text-center font-bold">
                    ดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/approvals/${item.docId}`)}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4 pr-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {formatThaiDate(item.actionDate, true)}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <DocTypeBadge docId={item.docId} type={item.type} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors truncate"
                              title={item.docName}
                            >
                              {item.docName}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 block truncate">
                              มูลค่า: {item.amount} · ขั้นตอน: {item.level}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm font-mono font-bold text-slate-600 whitespace-nowrap">
                        {item.docId}
                      </td>
                      <td
                        className="py-4 px-3 text-sm font-semibold text-slate-700 truncate"
                        title={item.requester}
                      >
                        {item.requester}
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        {getActionBadge(item.action)}
                      </td>
                      <td
                        className="py-4 px-3 text-xs text-slate-600 font-medium truncate"
                        title={item.comment}
                      >
                        {item.comment || "-"}
                      </td>
                      <td
                        className="py-4 pr-4 pl-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/approvals/${item.docId}`}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm font-medium text-slate-400"
                    >
                      ไม่พบประวัติการอนุมัติตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredHistory.length > 0 && (
            <div className="-mx-4 -mb-4 sm:mx-0 sm:mb-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredHistory.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
