"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, AlertCircle, Eye, Download, FileText, X, Clock, FileUp, User } from "lucide-react";
import { getDocuments } from '@views/features/documents/api';
import { Document, DocumentVersion } from '@views/features/documents/types';
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import { useToast } from '@views/components/providers/ToastProvider';
import { useSidebar } from '@views/components/providers/SidebarProvider';

function formatVersionDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function buildVersionDiffFields(older: DocumentVersion, newer: DocumentVersion) {
  return [
    {
      label: "ผู้แก้ไข",
      older: older.uploaded_by,
      newer: newer.uploaded_by,
      changed: older.uploaded_by !== newer.uploaded_by,
    },
    {
      label: "ขนาดไฟล์",
      older: `${older.file_size_kb} KB`,
      newer: `${newer.file_size_kb} KB`,
      changed: older.file_size_kb !== newer.file_size_kb,
    },
    {
      label: "สถานะ",
      older: older.is_active ? "Current" : "Archived",
      newer: newer.is_active ? "Current" : "Archived",
      changed: older.is_active !== newer.is_active,
    },
  ];
}

function splitRemarkLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return ["—"];
  return trimmed.split(/(?<=[.;])\s+/).filter(Boolean);
}

function buildRemarkDiff(olderRemarks: string, newerRemarks: string) {
  const olderLines = splitRemarkLines(olderRemarks);
  const newerLines = splitRemarkLines(newerRemarks);
  const newerSet = new Set(newerLines);
  const olderSet = new Set(olderLines);
  return {
    older: olderLines.map((line) => ({
      text: line,
      tone: newerSet.has(line) ? ("neutral" as const) : ("removed" as const),
    })),
    newer: newerLines.map((line) => ({
      text: line,
      tone: olderSet.has(line) ? ("neutral" as const) : ("added" as const),
    })),
  };
}

export default function DocumentVersionsPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  const { isOpen } = useSidebar();
  
  const [doc, setDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Compare state
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCompareResult, setShowCompareResult] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

  useEffect(() => {
    getDocuments().then(documents => {
      const found = documents.find((d) => d.id === id);
      setDoc(found || null);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading version history...</div>;
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center h-[60vh]">
        <div className="p-3 bg-red-50 text-red-600 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Document Not Found</h3>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          The document ID "{id}" could not be located in the database.
        </p>
        <Link
          href="/documents"
          className="mt-6 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-colors"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  // Load versions from document
  const versions = (doc?.versions || [])
    .sort((a: any, b: any) => {
      // Sort by version_number roughly, or createdAt descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleCheckboxChange = (versionId: string) => {
    setSelectedVersions(prev => {
      let next: string[];
      if (prev.includes(versionId)) {
        next = prev.filter(v => v !== versionId);
      } else {
        if (prev.length >= 2) return prev;
        next = [...prev, versionId];
      }
      if (next.length !== 2) setShowCompareResult(false);
      return next;
    });
  };

  const selectedData = selectedVersions
    .map(vid => versions.find(v => v.id === vid)!)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); 
    // index 0 = older, index 1 = newer

  // Helper for Diff Indicators
  const calculateDiff = (older: DocumentVersion, newer: DocumentVersion) => {
    const sizeDiff = newer.file_size_kb - older.file_size_kb;
    const sizeStr = sizeDiff > 0 ? `+ ${sizeDiff} KB` : sizeDiff < 0 ? `- ${Math.abs(sizeDiff)} KB` : "ไม่มีการเปลี่ยนแปลง";
    const sizeColor = sizeDiff > 0 ? "text-emerald-600 bg-emerald-50" : sizeDiff < 0 ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-100";
    
    const timeDiffMs = Math.abs(new Date(newer.created_at).getTime() - new Date(older.created_at).getTime());
    const days = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiffMs / (1000 * 60 * 60)) % 24);
    const timeStr = `แก้ไขห่างกัน ${days > 0 ? `${days} วัน ` : ""}${hours} ชั่วโมง`;

    const sameUser = older.uploaded_by === newer.uploaded_by;
    const userStr = sameUser ? "แก้โดยคนเดียวกัน" : "แก้โดยคนละคน";
    const userColor = sameUser ? "text-indigo-600 bg-indigo-50 border-indigo-100" : "text-amber-600 bg-amber-50 border-amber-100";

    return { sizeStr, sizeColor, timeStr, userStr, userColor };
  };

  const diff = selectedData.length === 2 ? calculateDiff(selectedData[0], selectedData[1]) : null;
  const compareFields =
    selectedData.length === 2 ? buildVersionDiffFields(selectedData[0], selectedData[1]) : [];
  const remarkDiff =
    selectedData.length === 2
      ? buildRemarkDiff(selectedData[0].remarks, selectedData[1].remarks)
      : null;
  const remarksChanged =
    selectedData.length === 2 && selectedData[0].remarks !== selectedData[1].remarks;
  const changeCount =
    compareFields.filter((f) => f.changed).length + (remarksChanged ? 1 : 0);

  const showCheckboxes = versions.length > 1;
  const canCompare = selectedVersions.length === 2;

  const iconActionBtn =
    "group relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100";
  const iconActionTooltip =
    "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block";

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>

      <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
        <Link
          href={`/documents/${doc.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="size-4" />
          กลับไปยังรายละเอียดเอกสาร (Back to Document Details)
        </Link>

        <PageHeader
          size="compact"
          title={`ประวัติการแก้ไข (Version History): ${doc.id}`}
          subtitle={`ติดตามการเปลี่ยนแปลงของ "${doc.name}"`}
          actions={
            showCheckboxes ? (
              <button
                onClick={() => setShowCompareResult(true)}
                disabled={!canCompare}
                title={!canCompare ? "เลือก 2 เวอร์ชันเพื่อเปรียบเทียบ" : "เปรียบเทียบเวอร์ชันที่เลือก"}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  canCompare
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-200 text-slate-500 opacity-50"
                }`}
              >
                <FileText className="size-4" />
                Compare Selected Versions
              </button>
            ) : undefined
          }
        />
        </div>
      </div>

      <div className="mt-6 flex flex-col space-y-4">

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="w-36 py-4 pl-6 align-middle">Version</th>
                <th className="w-40 py-4 align-middle">Updated Date</th>
                <th className="w-44 py-4 align-middle">Modifier</th>
                <th className="min-w-[200px] py-4 align-middle">Changes / Remarks</th>
                <th className="w-32 py-4 text-center align-middle">Status</th>
                <th className="w-28 py-4 pr-6 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm font-semibold text-slate-400">
                    ไม่มีประวัติการแก้ไข
                  </td>
                </tr>
              ) : versions.map((ver) => {
                const isChecked = selectedVersions.includes(ver.id);
                const isDisabled = !isChecked && selectedVersions.length >= 2;

                return (
                  <tr
                    key={ver.id}
                    className={`border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 ${
                      isChecked ? "bg-blue-50/40" : "bg-white"
                    }`}
                  >
                    <td className="py-4 pl-6 align-middle">
                      <div className="flex items-center gap-3">
                        {showCheckboxes && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleCheckboxChange(ver.id)}
                            className="size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        )}
                        <span className="text-sm font-bold tabular-nums text-slate-800">
                          {ver.version_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-500">
                      {new Date(ver.created_at).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-800">{ver.uploaded_by}</td>
                    <td className="py-4 pr-6 text-xs font-medium leading-relaxed text-slate-500">
                      {ver.remarks}
                    </td>
                    <td className="py-4 text-center align-middle">
                      {ver.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                          Current
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-6 text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setViewingVersion(ver.id)}
                          className={`${iconActionBtn} hover:text-blue-600`}
                        >
                          <Eye className="size-4" />
                          <span className={iconActionTooltip}>ดูเวอร์ชัน</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(`กำลังดาวน์โหลดไฟล์เวอร์ชัน ${ver.version_number}...`, "success")
                          }
                          className={`${iconActionBtn} hover:text-emerald-600`}
                        >
                          <Download className="size-4" />
                          <span className={iconActionTooltip}>ดาวน์โหลด</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showCheckboxes && (
          <p className="text-[11px] font-semibold text-slate-400">
            * เลือก Checkbox 2 รายการเพื่อเปรียบเทียบ
          </p>
        )}

        {showCompareResult && selectedData.length === 2 && (
          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  ผลการเปรียบเทียบเวอร์ชัน (Compare Versions)
                </h3>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  เปลี่ยนแปลง {changeCount} รายการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareResult(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="ปิดผลการเปรียบเทียบ"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[selectedData[0], selectedData[1]].map((ver, colIdx) => (
                <div
                  key={ver.id}
                  className={`rounded-xl border p-4 ${
                    colIdx === 0 ? "border-slate-200 bg-slate-50/50" : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800">{ver.version_number}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        colIdx === 0
                          ? "bg-white text-slate-500 ring-1 ring-slate-200"
                          : "bg-white text-blue-600 ring-1 ring-blue-200"
                      }`}
                    >
                      {colIdx === 0 ? "Older" : "Newer"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{formatVersionDate(ver.created_at)}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700">{ver.uploaded_by}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left">ฟิลด์</th>
                    <th className="px-4 py-3 text-left">{selectedData[0].version_number}</th>
                    <th className="px-4 py-3 text-left">{selectedData[1].version_number}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareFields.map((field) => (
                    <tr key={field.label} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">{field.label}</td>
                      <td
                        className={`px-4 py-3 text-xs font-medium ${
                          field.changed ? "bg-red-50 text-red-700" : "text-slate-700"
                        }`}
                      >
                        {field.older}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs font-medium ${
                          field.changed ? "bg-emerald-50 text-emerald-700" : "text-slate-700"
                        }`}
                      >
                        {field.newer}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-3 align-top text-xs font-semibold text-slate-500">
                      หมายเหตุ
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ul className="space-y-1.5">
                        {remarkDiff?.older.map((line, i) => (
                          <li
                            key={`old-${i}`}
                            className={`rounded-md px-2 py-1 text-xs leading-relaxed ${
                              line.tone === "removed"
                                ? "bg-red-50 text-red-700 line-through decoration-red-300"
                                : "bg-white text-slate-600"
                            }`}
                          >
                            {line.text}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ul className="space-y-1.5">
                        {remarkDiff?.newer.map((line, i) => (
                          <li
                            key={`new-${i}`}
                            className={`rounded-md px-2 py-1 text-xs leading-relaxed ${
                              line.tone === "added"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-white text-slate-600"
                            }`}
                          >
                            {line.text}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* COMPARE MODAL */}
      {showCompareModal && selectedData.length === 2 && diff && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-[padding] duration-200"
          style={{ paddingLeft: isOpen ? "calc(16rem + 1rem)" : "calc(5rem + 1rem)" }}
        >
          {/* Backdrop Click */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowCompareModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#eef2f9] rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-slate-800">เปรียบเทียบเวอร์ชัน (Compare Versions)</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  เทียบจากเวอร์ชันเก่า ไปยัง เวอร์ชันที่ใหม่กว่า
                </p>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 gap-6 relative">
                
                {/* Arrow indicator between columns */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-300">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Left Side (Older) */}
                <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm">
                  <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                    <span className="font-black text-slate-700">{selectedData[0].version_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white border-slate-200 text-slate-500">Older Version</span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> แก้ไขโดย</span>
                        <span className="text-sm font-bold text-slate-700">{selectedData[0].uploaded_by}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> วันที่แก้ไข</span>
                        <span className="text-sm font-bold text-slate-700">{new Date(selectedData[0].created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><FileUp className="w-3.5 h-3.5"/> ขนาดไฟล์</span>
                        <span className="text-sm font-bold text-slate-700">{selectedData[0].file_size_kb} KB</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">หมายเหตุการแก้ไข</span>
                      <p className="text-sm font-medium text-slate-600 bg-[#eef2f9] p-3 rounded-xl border border-slate-200">
                        {selectedData[0].remarks}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side (Newer) */}
                <div className="bg-white border border-blue-200 rounded-2xl flex flex-col shadow-sm ring-1 ring-blue-100">
                  <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex justify-between items-center rounded-t-2xl">
                    <span className="font-black text-blue-800">{selectedData[1].version_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white border-blue-200 text-blue-600">Newer Version</span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> แก้ไขโดย</span>
                        <span className="text-sm font-bold text-slate-700">{selectedData[1].uploaded_by}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> วันที่แก้ไข</span>
                        <span className="text-sm font-bold text-slate-700">{new Date(selectedData[1].created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><FileUp className="w-3.5 h-3.5"/> ขนาดไฟล์</span>
                        <span className="text-sm font-bold text-slate-700">{selectedData[1].file_size_kb} KB</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">หมายเหตุการแก้ไข</span>
                      <p className="text-sm font-medium text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        {selectedData[1].remarks}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Diff Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 ${diff.sizeColor}`}>
                  <FileUp className="w-4 h-4" />
                  {diff.sizeStr}
                </div>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-full font-bold text-xs flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {diff.timeStr}
                </div>
                <div className={`px-4 py-2 rounded-full border font-bold text-xs flex items-center gap-2 ${diff.userColor}`}>
                  <User className="w-4 h-4" />
                  {diff.userStr}
                </div>
              </div>

              {/* Level 2: Side-by-side Preview */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-slate-700 mb-4 px-1">File Preview</h4>
                <div className="grid grid-cols-2 gap-6">
                  {/* Preview Left */}
                  <div className="border border-slate-200 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 aspect-[1/1.2] shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-white m-4 rounded shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-2" />
                        <span className="text-xs font-bold text-slate-400">{selectedData[0].version_number} Preview</span>
                     </div>
                  </div>
                  {/* Preview Right */}
                  <div className="border border-slate-200 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 aspect-[1/1.2] shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-white m-4 rounded shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-2" />
                        <span className="text-xs font-bold text-slate-400">{selectedData[1].version_number} Preview</span>
                     </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between items-center">
              <div className="flex gap-4">
                <button 
                  onClick={() => showToast(`กำลังดาวน์โหลดไฟล์ ${selectedData[0].version_number}...`, "success")}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  โหลด {selectedData[0].version_number}
                </button>
                <button 
                  onClick={() => showToast(`กำลังดาวน์โหลดไฟล์ ${selectedData[1].version_number}...`, "success")}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  โหลด {selectedData[1].version_number}
                </button>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SINGLE VERSION MODAL */}
      {viewingVersion && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-[padding] duration-200"
          style={{ paddingLeft: isOpen ? "calc(16rem + 1rem)" : "calc(5rem + 1rem)" }}
        >
          <div className="absolute inset-0 cursor-pointer" onClick={() => setViewingVersion(null)}></div>
          
          <div className="relative bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  ตัวอย่างไฟล์ (Preview) - {versions.find(v => v.id === viewingVersion)?.version_number}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  ดูตัวอย่างไฟล์เวอร์ชันที่เลือก
                </p>
              </div>
              <button 
                onClick={() => setViewingVersion(null)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 flex flex-col">
              <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                <span className="text-sm font-bold text-slate-500">
                  กำลังแสดงตัวอย่างเนื้อหาของ {versions.find(v => v.id === viewingVersion)?.version_number}
                </span>
                <span className="text-xs text-slate-400 mt-2">(พื้นที่จำลองสำหรับแสดงผล PDF/รูปภาพ)</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between items-center">
              <button 
                onClick={() => {
                  showToast(`กำลังดาวน์โหลดไฟล์ ${versions.find(v => v.id === viewingVersion)?.version_number}...`, "success");
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                โหลดเวอร์ชันนี้
              </button>
              <button 
                onClick={() => setViewingVersion(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
