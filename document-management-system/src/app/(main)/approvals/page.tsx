import React from "react";
import Link from "next/link";
import { CheckSquare, ArrowRight, Eye, SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getApprovals } from "@/features/workflow/api";
import { getStatusVariant } from "@/lib/document-status";

export default async function ApprovalsInboxPage() {
  const approvals = await getApprovals();

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
        
        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-blue-600 text-white border-blue-600 shadow-sm">
              รอฉันอนุมัติ (Pending)
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-white text-slate-500 border-slate-100 hover:bg-slate-50">
              อนุมัติแล้ว (Approved)
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-white text-slate-500 border-slate-100 hover:bg-slate-50">
              ส่งกลับแก้ไข (Returned)
            </button>
          </div>
          
          <div className="relative shrink-0">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <select className="appearance-none bg-slate-50/50 border border-slate-100/80 rounded-xl py-2 pl-4 pr-10 text-xs font-semibold text-slate-700 focus:outline-none min-w-[130px]">
              <option>ใหม่ล่าสุด</option>
              <option>เก่าที่สุด</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 pl-4">ข้อมูลเอกสาร</th>
                <th className="py-4">รหัส (ID)</th>
                <th className="py-4">ผู้ขออนุมัติ</th>
                <th className="py-4">วันที่ส่ง</th>
                <th className="py-4 text-center">ขั้นที่</th>
                <th className="py-4 text-center">สถานะ</th>
                <th className="py-4 pr-4 text-center">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {approvals.length > 0 ? (
                approvals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pl-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-snug">{item.name}</p>
                        <span className="text-[10px] font-semibold text-slate-400">มูลค่า: {item.amount}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-bold text-slate-500">{item.id}</td>
                    <td className="py-4 text-sm font-medium text-slate-600">{item.requester}</td>
                    <td className="py-4 text-sm text-slate-400 font-medium">{item.submittedDate}</td>
                    <td className="py-4 text-center">
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        L{item.currentLevel} / L{item.maxLevels}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
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
                  <td colSpan={7} className="py-16 text-center text-sm font-medium text-slate-400">
                    ไม่มีเอกสารรออนุมัติ
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
