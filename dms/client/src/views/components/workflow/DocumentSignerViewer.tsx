"use client";

import React, { useState } from "react";
import {
  Download,
  Edit3,
  Type,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';

interface DocumentSignerViewerProps {
  documentId: string;
  documentName: string;
  version: string;
  initialStatus: string;
  signaturePlaced: boolean;
  onSignatureChange?: (placed: boolean) => void;
}

type ToolMode = "signature" | "text" | "date";

export function DocumentSignerViewer({
  documentId,
  documentName,
  version,
  initialStatus,
  signaturePlaced,
  onSignatureChange,
}: DocumentSignerViewerProps) {
  const { user } = useAuth();
  const approverName = user?.full_name || user?.username || "Administrator";
  const [activeTool, setActiveTool] = useState<ToolMode>("signature");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [placedElements, setPlacedElements] = useState<{
    signature: boolean;
    textNote: string | null;
    dateStamp: string | null;
  }>({
    signature: initialStatus === "Approved",
    textNote: null,
    dateStamp: null,
  });

  const handlePlaceStamp = () => {
    const todayStr = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + " 10:22 น.";

    if (activeTool === "signature") {
      setPlacedElements((prev) => ({ ...prev, signature: true }));
      onSignatureChange?.(true);
    } else if (activeTool === "text") {
      setPlacedElements((prev) => ({
        ...prev,
        textNote: "เห็นควรอนุมัติรายการนี้ตามเสนอ",
      }));
    } else if (activeTool === "date") {
      setPlacedElements((prev) => ({ ...prev, dateStamp: todayStr }));
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(75, prev + delta)));
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            PDF Viewer & E-Signature Controls (สเปคหน้า 9)
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            เลือกเครื่องมือเพื่อทดลองประทับลายเซ็น ข้อความ หรือวันที่ลงบนไฟล์ PDF
          </p>
        </div>

        {/* 3 TOOL BUTTONS */}
        {initialStatus === "Pending" && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTool("signature")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTool === "signature"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              ลายเซ็น
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTool === "text"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              ข้อความ
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("date")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTool === "date"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              วันที่
            </button>
          </div>
        )}
      </div>

      {/* PAGE & ZOOM NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Page 1 of 1</span>
          <span className="text-slate-300">|</span>
          <span>PDF Preview Mode</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-10)}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-mono font-bold">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom(10)}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CANVAS & MOCK A4 VIEWER */}
      <div className="bg-slate-200/70 rounded-xl p-4 sm:p-8 border border-slate-200 text-center min-h-[420px] flex flex-col items-center justify-center relative overflow-auto">
        <div
          style={{ transform: `scale(${zoomLevel / 100})` }}
          className="transition-transform duration-150 origin-center bg-white w-full max-w-md h-full min-h-[350px] shadow-md border border-slate-300 p-6 flex flex-col justify-between relative text-left rounded-sm cursor-crosshair"
          onClick={handlePlaceStamp}
        >
          {/* Mock Document Content Lines */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h5 className="font-extrabold text-sm text-slate-800">
                {documentName} ({documentId})
              </h5>
              <span className="text-[10px] font-mono text-slate-400">
                Confidential
              </span>
            </div>
            <div className="h-3.5 bg-slate-100 rounded w-11/12"></div>
            <div className="h-3.5 bg-slate-100 rounded w-full"></div>
            <div className="h-3.5 bg-slate-100 rounded w-4/5"></div>
            <div className="h-3.5 bg-slate-100 rounded w-full"></div>
            <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>

            {/* Display Text Note Stamp if added */}
            {placedElements.textNote && (
              <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 animate-in fade-in">
                📝 ข้อความแนบ: {placedElements.textNote}
              </div>
            )}
          </div>

          {/* STAMP BOX AREA */}
          <div className="mt-10 flex justify-end">
            <div
              className={`w-48 h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-all ${
                placedElements.signature || signaturePlaced
                  ? "border-blue-500 bg-blue-50/30"
                  : "border-slate-300 bg-slate-50/50 hover:bg-blue-50/20"
              }`}
            >
              {placedElements.signature || signaturePlaced ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl p-2 shadow-xs border border-blue-200">
                  <div className="flex items-center gap-1 text-emerald-600 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-extrabold uppercase">
                      Signed & Approved
                    </span>
                  </div>
                  {/* Cursive Signature Simulation */}
                  <span className="font-['Brush_Script_MT',cursive,italic] text-2xl text-blue-700 -rotate-3 my-0.5">
                    {approverName}
                  </span>
                  <div className="text-[9px] text-slate-500 font-bold text-center">
                    {approverName}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono">
                    {placedElements.dateStamp ||
                      new Date().toLocaleDateString("th-TH") + " 10:22 น."}
                  </div>
                </div>
              ) : (
                <div className="text-center p-2">
                  <Edit3 className="w-5 h-5 text-blue-500 mx-auto mb-1 animate-bounce" />
                  <p className="text-[11px] text-slate-600 font-bold">
                    คลิกเพื่อวาง{activeTool === "signature" ? "ลายเซ็น" : activeTool === "text" ? "ข้อความ" : "วันที่"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    (Click to Place Stamp)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-slate-400 font-medium">
          * ระบบดึงรูปภาพลายเซ็นจาก `users.signature_image_path` ของผู้ใช้งานที่ล็อกอิน
        </span>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download Original File
        </button>
      </div>
    </div>
  );
}
