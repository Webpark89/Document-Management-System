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
import { useSignatures } from '@views/components/providers/SignatureProvider';
import { documentsService } from '@/controllers/services/documents.service';
import { DocumentPreview } from "../documents/DocumentPreview";

interface DocumentSignerViewerProps {
  documentId: string;
  documentName: string;
  version: string;
  initialStatus: string;
  signaturePlaced: boolean;
  onSignatureChange?: (placed: boolean) => void;
  doc?: any;
}

type ToolMode = "signature" | "text" | "date";

export function DocumentSignerViewer({
  documentId,
  documentName,
  version,
  initialStatus,
  signaturePlaced,
  onSignatureChange,
  doc,
}: DocumentSignerViewerProps) {
  const { user } = useAuth();
  const { signatures, findByApproverName } = useSignatures();
  const approverName = user?.full_name || user?.username || "Administrator";
  const mySignature = findByApproverName(approverName) || signatures.find(s => s.imageUrl);
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  React.useEffect(() => {
    documentsService.getDocumentSignedUrl(documentId).then(res => {
      if (res?.url) setSignedUrl(res.url);
    });
  }, [documentId]);

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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTool("signature");
                  handlePlaceStamp();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  placedElements.signature || signaturePlaced
                    ? "bg-emerald-600 text-white shadow-xs"
                    : activeTool === "signature"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {placedElements.signature || signaturePlaced ? "วางลายเซ็นแล้ว ✓" : "ประทับลายเซ็น"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool("text");
                  handlePlaceStamp();
                }}
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
                onClick={() => {
                  setActiveTool("date");
                  handlePlaceStamp();
                }}
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
          className="transition-transform duration-150 origin-top flex flex-col relative w-fit max-w-none mx-auto"
        >
          {/* Mock Document Content Lines */}
          <div className="w-full">
            <DocumentPreview 
              doc={doc} 
              hideHeader={true} 
              isViewer={true} 
              tempSignature={placedElements.signature || signaturePlaced}
              onSignClick={handlePlaceStamp}
            />
          </div>
 
          {/* Display Text Note Stamp if added */}
          {placedElements.textNote && (
            <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 animate-in fade-in">
              📝 ข้อความแนบ: {placedElements.textNote}
            </div>
          )}
      </div>
    </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-slate-400 font-medium">
          * ระบบดึงรูปภาพลายเซ็นจาก `users.signature_image_path` ของผู้ใช้งานที่ล็อกอิน
        </span>
        {signedUrl ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            เปิดไฟล์ PDF ฉบับจริง (New Tab)
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            ไม่พบไฟล์ PDF แนบ
          </button>
        )}
      </div>
    </div>
  );
}
