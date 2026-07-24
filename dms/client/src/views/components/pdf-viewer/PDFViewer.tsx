"use client";

import React from "react";
import { FileText } from "lucide-react";

export interface PDFViewerProps {
  url?: string;
  className?: string;
}

export function PDFViewer({ url, className }: PDFViewerProps) {
  return (
    <div
      className={`relative flex h-[500px] w-full items-center justify-center rounded-xl border border-[--color-border] bg-slate-100 p-4 ${
        className || ""
      }`}
    >
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white shadow-md">
          <FileText className="size-8 text-blue-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Browser PDF Viewer Component
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {url ? `ไฟล์: ${url}` : "พร้อมแสดงผล PDF ด้วย react-pdf เมื่อต่อกับ Backend API"}
        </p>
      </div>
    </div>
  );
}
