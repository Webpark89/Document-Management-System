"use client";

import React, { useState } from "react";
import { PenTool, CheckCircle2 } from "lucide-react";

export interface SignatureOverlayProps {
  onApplySignature?: (x: number, y: number, page: number) => void;
}

export function SignatureOverlay({ onApplySignature }: SignatureOverlayProps) {
  const [placed, setPlaced] = useState(false);
  const [pos, setPos] = useState({ x: 150, y: 200 });

  const handleConfirm = () => {
    if (onApplySignature) {
      onApplySignature(pos.x, pos.y, 1);
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
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <CheckCircle2 className="size-3.5" /> ยืนยันตำแหน่งลายเซ็น
        </button>
      </div>

      <div className="h-64 relative bg-white border border-slate-200 rounded-lg flex items-center justify-center cursor-crosshair">
        <div className="absolute rounded-lg border-2 border-blue-500 bg-blue-100/80 px-4 py-2 text-center text-xs font-bold text-blue-800 shadow-md">
          ✍️ ลายเซ็น: วิภา รักดี
        </div>
      </div>
    </div>
  );
}
