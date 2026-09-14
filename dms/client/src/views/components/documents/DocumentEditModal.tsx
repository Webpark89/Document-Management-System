"use client";

import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { uploadNewDocumentVersion } from "@/views/features/documents/api";
import { useToast } from '@views/components/providers/ToastProvider';
import type { Document } from "@/views/features/documents/types";

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSuccess: () => void;
}

export function DocumentEditModal({
  isOpen,
  onClose,
  document,
  onSuccess,
}: DocumentEditModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(document?.name || "");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (document) setTitle(document.name);
  }, [document]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast("กรุณาแนบไฟล์เอกสาร PDF เวอร์ชันใหม่", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      await uploadNewDocumentVersion(document.real_id || document.id, formData);
      showToast("อัปโหลดเอกสารเวอร์ชันใหม่และส่งกลับเป็น Draft สำเร็จ", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                แก้ไขและส่งเอกสารใหม่
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {document.id} (ปัจจุบัน: {document.status})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-bold">คำแนะนำ:</p>
              <p className="opacity-90 mt-0.5">
                การอัปโหลดไฟล์ใหม่จะทำให้เอกสารขยับเป็นเวอร์ชันใหม่ และสถานะจะกลับไปเป็น Draft เพื่อให้คุณตรวจสอบก่อนส่งอนุมัติอีกครั้ง
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              ชื่อเอกสาร (Title)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              ไฟล์ PDF เวอร์ชันใหม่ <span className="text-rose-500">*</span>
            </label>
            <div className="relative group cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
              <div
                className={`w-full px-4 py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  file
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 bg-slate-50 group-hover:border-blue-400 group-hover:bg-blue-50/30"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    file ? "bg-blue-100 text-blue-600" : "bg-white shadow-xs text-slate-400"
                  }`}
                >
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">คลิกหรือลากไฟล์ PDF มาวางที่นี่</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      รองรับไฟล์ขนาดไม่เกิน 20MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? "กำลังอัปโหลด..." : "อัปโหลดและส่งกลับ (Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
