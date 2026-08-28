"use client";

import React, { useState } from "react";
import { Folder } from "@views/features/folders/types";
import { X, FolderInput, FileText, Check } from "lucide-react";
import { FolderIconRenderer } from "./FolderIconRenderer";

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null) => Promise<void>;
  folders: Folder[];
  documentCount: number;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  onConfirm,
  folders,
  documentCount,
}: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleMove = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(selectedFolderId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderInput className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">ย้ายเอกสารเข้าโฟลเดอร์</h2>
            <p className="text-xs text-slate-400">ย้ายเอกสารจำนวน {documentCount} รายการ</p>
          </div>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 my-4">
          {/* Option: Unorganized */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              selectedFolderId === null
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>ไม่มีโฟลเดอร์ (ยกเลิกจัดกลุ่ม)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Folder items */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base"><FolderIconRenderer iconName={folder.icon} className="w-5 h-5" /></span>
                  <span className="truncate">{folder.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "กำลังย้าย..." : "ยืนยันการย้าย"}
          </button>
        </div>
      </div>
    </div>
  );
}
