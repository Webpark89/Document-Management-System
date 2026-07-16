"use client";

import React, { useState } from "react";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { submitApprove, submitReject } from "@/features/workflow/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";

interface ApprovalActionsProps {
  documentId: string;
  signaturePlaced: boolean;
}

export function ApprovalActions({ documentId, signaturePlaced }: ApprovalActionsProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "approve" && !signaturePlaced) {
      alert("⚠️ กรุณาวางลายเซ็นบนเอกสาร (หรือกดปุ่มประทับลายเซ็น) ใน PDF Viewer ก่อนทำการอนุมัติ!");
      showToast("กรุณาประทับลายเซ็นลงบนเอกสารก่อนอนุมัติ", "error");
      return;
    }

    if (action === "reject" && !comment.trim()) {
      alert("⚠️ กรุณาระบุความคิดเห็น/เหตุผลในช่อง Comment ก่อนทำรายการไม่อนุมัติ!");
      showToast("กรุณาระบุเหตุผลในการไม่อนุมัติ", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "approve") {
        await submitApprove(documentId, comment);
        showToast("อนุมัติเอกสารเรียบร้อยแล้ว", "success");
      } else {
        await submitReject(documentId, comment);
        showToast("ไม่อนุมัติเอกสารเรียบร้อยแล้ว", "success");
      }
      router.push("/approvals");
      router.refresh();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการดำเนินการ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          ดำเนินการพิจารณา (Approval Decision)
        </h3>
        {!signaturePlaced && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            ต้องวางลายเซ็นก่อนอนุมัติ
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            ความคิดเห็น / หมายเหตุประกอบการพิจารณา (Comment)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-xs font-semibold text-slate-700 placeholder-slate-400"
            rows={3}
            placeholder="ระบุความคิดเห็น... (จำเป็นต้องระบุหากไม่อนุมัติ)"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            ไม่อนุมัติ (Reject)
          </button>

          <button
            type="button"
            onClick={() => handleAction("approve")}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer ${
              signaturePlaced
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                : "bg-slate-400 hover:bg-slate-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            อนุมัติ (Approve)
          </button>
        </div>
      </div>
    </div>
  );
}
