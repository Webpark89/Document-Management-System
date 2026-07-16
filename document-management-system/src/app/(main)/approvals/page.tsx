"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Eye, SlidersHorizontal, Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getApprovals, Approval } from "@/features/workflow/api";
import { getStatusVariant } from "@/lib/document-status";

type TabStatus = "Pending" | "Approved" | "Returned for Revision" | "All";

export default function ApprovalsInboxPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<TabStatus>("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    getApprovals().then((data) => setApprovals(data));
  }, []);

  // Filter logic according to specs
  const pendingCount = approvals.filter((item) => item.status === "Pending").length;
  const approvedCount = approvals.filter((item) => item.status === "Approved").length;
  const returnedCount = approvals.filter((item) => item.status === "Returned for Revision").length;
  const allCount = approvals.length;

  const filteredApprovals = approvals
    .filter((item) => {
      // Status tab filter
      if (activeTab !== "All" && item.status !== activeTab) {
        return false;
      }
      // Search filter (name, id, requester)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.requester.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

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
    return "GEN";
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="กล่องข้อความรออนุมัติ (Inbox)"
        subtitle="จัดการเอกสารที่รอให้คุณพิจารณาอนุมัติ"
        actions={
          <Link
            href="/documents"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            ประวัติการอนุมัติ
          </Link>
        }
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full space-y-6">
        {/* TOOLBAR: TAB BUTTONS & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Status Tabs with Counts */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "Pending"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              รอฉันอนุมัติ (Pending)
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "Pending"
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("Approved")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "Approved"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              อนุมัติแล้ว (Approved)
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "Approved"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("Returned for Revision")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "Returned for Revision"
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ส่งกลับแก้ไข (Returned)
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "Returned for Revision"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {returnedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("All")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "All"
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              ทั้งหมด (All)
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "All"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {allCount}
              </span>
            </button>
          </div>

          {/* SEARCH BAR & SORT */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
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

            <div className="relative shrink-0">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as "newest" | "oldest")
                }
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-9 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="newest">ใหม่ล่าสุด</option>
                <option value="oldest">เก่าที่สุด</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 pl-4">ข้อมูลเอกสาร</th>
                <th className="py-4">รหัส (ID)</th>
                <th className="py-4">ผู้ขอ</th>
                <th className="py-4">วันที่ส่ง</th>
                <th className="py-4 text-center">ขั้นที่</th>
                <th className="py-4 text-center">สถานะ</th>
                <th className="py-4 pr-4 text-center">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {filteredApprovals.length > 0 ? (
                filteredApprovals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors group"
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
                          <p className="text-sm font-bold text-slate-800 leading-snug">
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
                      {item.requester}
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
                    <td className="py-4 pr-4 text-center">
                      <Link
                        href={`/approvals/${item.id}`}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {item.status === "Pending" ? "ตรวจสอบ" : "ดูรายละเอียด"}
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
                    ไม่พบรายการเอกสารตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
