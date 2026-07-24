"use client";

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
  Calendar,
  Filter,
  X
} from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { Badge } from '@views/components/ui/badge';
import { getApprovals, Approval } from '@views/features/workflow/api';
import { getStatusVariant } from "@/lib/document-status";
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';

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
}

const MOCK_APPROVAL_HISTORY: ApprovalHistoryItem[] = [
  {
    id: "hist-01",
    docId: "PO-2026-0001",
    docName: "สั่งซื้อคอมพิวเตอร์ Dell Latitude 5440",
    amount: "฿64,000",
    requester: "วิภา รักดี",
    approverName: "ประเสริฐ มีสุข",
    action: "Approved",
    actionDate: "13 ก.ค. 2026 16:30",
    comment: "อนุมัติ โครงการ Dell Laptop สำหรับพนักงานใหม่",
    level: "L4/L4",
  },
  {
    id: "hist-02",
    docId: "PO-2026-0001",
    docName: "สั่งซื้อคอมพิวเตอร์ Dell Latitude 5440",
    amount: "฿64,000",
    requester: "วิภา รักดี",
    approverName: "วิภา รักดี",
    action: "Approved",
    actionDate: "13 ก.ค. 2026 14:00",
    comment: "ดำเนินการจัดซื้อได้เลย",
    level: "L3/L4",
  },
  {
    id: "hist-03",
    docId: "PR-2026-0002",
    docName: "ขอจัดซื้ออุปกรณ์ความปลอดภัยโรงงาน",
    amount: "฿8,200",
    requester: "อรทัย สุขใจ",
    approverName: "วิภา รักดี",
    action: "Returned for Revision",
    actionDate: "12 ก.ค. 2026 14:30",
    comment: "ขอปฏิเสธเบื้องต้นเพื่อขอเอกสารใบเสนอราคาเปรียบเทียบจากคู่ค้าอย่างน้อย 3 รายเพิ่มเติม",
    level: "L2/L3",
  },
  {
    id: "hist-04",
    docId: "BK-2026-0001",
    docName: "บันทึกขออนุมัติเดินทางสัมมนาประจำปี 2026",
    amount: "-",
    requester: "ประเสริฐ มีสุข",
    approverName: "ประเสริฐ มีสุข",
    action: "Approved",
    actionDate: "11 ก.ค. 2026 16:00",
    comment: "อนุมัติค่าเดินทางและที่พักตามระเบียบบริษัท",
    level: "L2/L2",
  },
  {
    id: "hist-05",
    docId: "PO-2026-0002",
    docName: "สั่งซื้อกระดาษ A4 และอุปกรณ์งานพิมพ์",
    amount: "฿5,000",
    requester: "ประทีป สุขเจริญ",
    approverName: "ประเสริฐ มีสุข",
    action: "Approved",
    actionDate: "09 ก.ค. 2026 15:30",
    comment: "อนุมัติสั่งซื้อตามเงื่อนไขส่งมอบงานพิมพ์",
    level: "L3/L3",
  },
  {
    id: "hist-06",
    docId: "OTHER-2026-0001",
    docName: "เอกสารยินยอมให้เข้าตรวจแปลงผลิตวัตถุดิบ",
    amount: "-",
    requester: "กิตติศักดิ์ พรหมมา",
    approverName: "วิภา รักดี",
    action: "Approved",
    actionDate: "08 ก.ค. 2026 15:00",
    comment: "อนุญาตให้เข้าปฏิบัติงานตรวจเช็คแปลงการผลิตวัตถุดิบได้",
    level: "L2/L2",
  },
  {
    id: "hist-07",
    docId: "PR-2026-0001",
    docName: "ขอซื้อวัสดุสำนักงาน Q3/2026",
    amount: "฿12,500",
    requester: "สมชาย ใจดี",
    approverName: "สมชาย ใจดี",
    action: "Approved",
    actionDate: "14 ก.ค. 2026 10:30",
    comment: "เห็นควรจัดซื้อตามความเหมาะสม",
    level: "L1/L3",
  },
];

export default function ApprovalHistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<ApprovalHistoryItem[]>(MOCK_APPROVAL_HISTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  
  const [sortKey, setSortKey] = useState<string | null>("actionDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

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
        if (selectedAction !== "All" && item.action !== selectedAction) return false;
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
        else if (sortKey === "actionDate") comp = a.actionDate.localeCompare(b.actionDate);
        else if (sortKey === "requester") comp = a.requester.localeCompare(b.requester);
        else if (sortKey === "action") comp = a.action.localeCompare(b.action);
        return sortDirection === "asc" ? comp : -comp;
      });
  }, [historyItems, searchQuery, selectedAction, sortKey, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

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
          <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
            <table className="w-full table-fixed text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <DataTableHeader title="วันเวลาดำเนินการ" sortKey="actionDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 pl-4 w-44" />
                  <th className="py-4 font-bold">ข้อมูลเอกสาร</th>
                  <DataTableHeader title="รหัสเอกสาร" sortKey="docId" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                  <DataTableHeader title="ผู้ขออนุมัติ" sortKey="requester" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-36" />
                  <DataTableHeader title="ผลการพิจารณา" sortKey="action" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 text-center w-36" />
                  <th className="py-4 font-bold w-56">หมายเหตุ / เหตุผล</th>
                  <th className="py-4 pr-4 text-center font-bold w-24">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => router.push(`/approvals/${item.docId}`)}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4 text-xs font-semibold text-slate-500">
                        {item.actionDate}
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                          {item.docName}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400">
                          มูลค่า: {item.amount} · ขั้นตอน: {item.level}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-mono font-bold text-slate-500">
                        {item.docId}
                      </td>
                      <td className="py-4 text-sm font-semibold text-slate-700">
                        {item.requester}
                      </td>
                      <td className="py-4 text-center">
                        {getActionBadge(item.action)}
                      </td>
                      <td className="py-4 text-xs text-slate-600 font-medium truncate max-w-[200px]" title={item.comment}>
                        {item.comment || "-"}
                      </td>
                      <td className="py-4 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                    <td colSpan={7} className="py-16 text-center text-sm font-medium text-slate-400">
                      ไม่พบประวัติการอนุมัติตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredHistory.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-semibold text-slate-500">
              <span>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHistory.length)} of{" "}
                {filteredHistory.length} items
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
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
                  className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
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
