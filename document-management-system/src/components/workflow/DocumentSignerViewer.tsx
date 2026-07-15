"use client";

import React, { useState } from "react";
import { FileText, Download, CheckCircle, Edit3 } from "lucide-react";

interface DocumentSignerViewerProps {
  documentId: string;
  documentName: string;
  version: string;
  initialStatus: string;
}

export function DocumentSignerViewer({ documentId, documentName, version, initialStatus }: DocumentSignerViewerProps) {
  const [signaturePlaced, setSignaturePlaced] = useState(false);

  // In a real app, if the document is already fully approved, the signature would be loaded from the backend.
  // For the Soft Create, we will simulate dragging/placing a signature.

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Document View (E-Signature Enabled)
        </h4>
        
        {!signaturePlaced && initialStatus === "Pending" && (
          <button 
            onClick={() => setSignaturePlaced(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            จำลองการเซ็น (Mock Sign)
          </button>
        )}
      </div>

      <div className="bg-slate-100 rounded-xl p-4 sm:p-8 border border-slate-200 text-center min-h-[400px] flex flex-col items-center relative overflow-hidden">
        
        {/* Mock A4 Paper */}
        <div className="bg-white w-full max-w-sm h-full min-h-[300px] shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative">
          
          <div className="space-y-4 text-left">
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          </div>

          <div className="mt-12 flex justify-end">
            <div className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center relative">
              {signaturePlaced || initialStatus === "Approved" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl">
                  {/* Mock Signature Font */}
                  <span className="font-['Brush_Script_MT',cursive,italic] text-3xl text-blue-700 -rotate-6">
                    Approved
                  </span>
                  <div className="text-[8px] text-slate-400 font-mono mt-2">
                    Signed: {new Date().toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-300 font-semibold">พื้นที่ประทับลายเซ็น</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <button
        type="button"
        className="mx-auto mt-4 flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Download Original File
      </button>
    </div>
  );
}
