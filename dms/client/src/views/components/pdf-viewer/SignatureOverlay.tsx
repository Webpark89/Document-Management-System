"use client";

import React, { useState } from "react";
import { PenTool, CheckCircle2 } from "lucide-react";

export interface SignatureOverlayProps {
  onApplySignature?: (x: number, y: number, page: number) => void;
  signerName?: string;
  signatureUrl?: string;
  pageNumber?: number;
}

export function SignatureOverlay({ onApplySignature, signerName, signatureUrl, pageNumber = 1 }: SignatureOverlayProps) {
   
  const [placed, setPlaced] = useState(false);
  const [pos, setPos] = useState({ x: 150, y: 200 });

  const handleConfirm = () => {
    if (signatureUrl && onApplySignature) {
      onApplySignature(pos.x, pos.y, pageNumber);
    }
  };

  return (
    <div className="relative border-2 border-dashed border-blue-400 bg-blue-50/20 p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <PenTool className="size-4" />
          <span>ลาก/วาง ลายเซ็นอิเล็กทรอนิกส์</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!signatureUrl || !placed || !onApplySignature}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <CheckCircle2 className="size-3.5" /> ยืนยันตำแหน่งลายเซ็น
        </button>
      </div>

      <div onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPos({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
        setPlaced(true);
      }} className="h-64 relative bg-white border border-slate-200 rounded-lg flex items-center justify-center cursor-crosshair">
        <div style={placed ? { left: pos.x, top: pos.y } : undefined} className="absolute rounded-lg border-2 border-blue-500 bg-blue-100/80 px-4 py-2 text-center text-xs font-bold text-blue-800 shadow-md">
          {signatureUrl ? <img src={signatureUrl} alt={`ลายเซ็น ${signerName || "ผู้ลงนาม"}`} className="h-12 w-28 object-contain" /> : "กรุณาบันทึกลายเซ็นในโปรไฟล์ก่อน"}
        </div>
      </div>
    </div>
  );
}
