"use client";

import React, { useState } from "react";
import { XCircle, X } from "lucide-react";
import { Document } from "@/features/documents/types";

interface CancelDocumentButtonProps {
  document: Document;
}

export function CancelDocumentButton({ document }: CancelDocumentButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);

  // Conditions: only Pending or Draft, and we assume current user is the owner for mock purposes.
  // In a real app, we would check `document.creator_id === currentUser.id`.
  if (document.status !== "Pending" && document.status !== "Draft") {
    return null;
  }

  // Hide button if already cancelled in this session
  if (isCancelled) {
    return null;
  }

  const handleCancel = () => {
    // Mock the cancellation
    console.log("Cancelling document", document.id, "Reason:", reason);
    setIsCancelled(true);
    setShowModal(false);
    
    // Show a mock toast notification (if we had a toast library, we'd use it here)
    alert(`เอกสาร ${document.id} ถูกยกเลิกเรียบร้อยแล้ว`);
    
    // Note: To make the UI update fully, we'd need to invalidate the router/cache.
    // Since this is a mockup, the alert and disappearing button is a good enough indication.
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs transition-colors border border-rose-200"
      >
        <XCircle className="w-4 h-4" />
        ยกเลิกเอกสาร (Cancel Request)
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-rose-50/50">
              <h3 className="text-lg font-black text-rose-700">ยืนยันการยกเลิกเอกสาร</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-rose-100 text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm font-semibold">
                การกระทำนี้ไม่สามารถย้อนกลับได้! เอกสารจะถูกเปลี่ยนสถานะเป็น "ยกเลิก" และยุติสายการอนุมัติทั้งหมด
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  เหตุผลที่ยกเลิก (ไม่บังคับ)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลที่ต้องการยกเลิก..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors resize-none h-24 text-sm font-medium"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                ปิด (Close)
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                ยืนยันการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
