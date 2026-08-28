"use client";

import React, { useState } from "react";
import { Check, X, Loader2, AlertTriangle, RotateCcw, Ban } from "lucide-react";
import { submitApprove, submitReject } from '@views/features/workflow/api';
import { useRouter } from "next/navigation";
import { useToast } from '@views/components/providers/ToastProvider';
import { swalConfirm, swalError } from "@/lib/swal";

interface ApprovalActionsProps {
  documentId: string;
  signaturePlaced: boolean;
  canApprove?: boolean;
  activeApproverName?: string;
  currentStep?: number;
}

export function ApprovalActions({ 
  documentId, 
  signaturePlaced, 
  canApprove = true, 
  activeApproverName,
  currentStep = 1
}: ApprovalActionsProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<"return" | "cancel">("return");
  const [returnToStep, setReturnToStep] = useState<number>(1);
  const router = useRouter();
  const { showToast } = useToast();

  const handleApprove = async () => {
    if (!signaturePlaced) {
      swalError("ต้องประทับลายเซ็นก่อนอนุมัติ", "กรุณาวางลายเซ็นบนเอกสาร (หรือกดปุ่มประทับลายเซ็น) ใน PDF Viewer ก่อนทำการอนุมัติ");
      return;
    }

    const confirmed = await swalConfirm({
      title: "ยืนยันการอนุมัติเอกสาร?",
      text: "คุณต้องการอนุมัติเอกสารนี้และส่งไปยังขั้นตอนถัดไปหรือไม่?",
      confirmButtonText: "อนุมัติเอกสาร",
      cancelButtonText: "ยกเลิก",
      icon: "question",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const signatureParams = signaturePlaced 
        ? { signature_x: 400, signature_y: 100, signature_page: 1, signature_width: 120, signature_height: 60 } 
        : undefined;
      await submitApprove(documentId, comment, signatureParams);
      showToast("อนุมัติเอกสารเรียบร้อยแล้ว", "success");
      router.push("/approvals");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!comment.trim()) {
      showToast("กรุณาระบุเหตุผลในการไม่อนุมัติ", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReject(documentId, comment, rejectType, rejectType === "return" ? returnToStep : undefined);
      showToast(rejectType === "return" ? "ตีกลับเอกสารเพื่อแก้ไขเรียบร้อยแล้ว" : "ปฏิเสธเอกสารถาวรเรียบร้อยแล้ว", "success");
      setShowRejectModal(false);
      router.push("/approvals");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canApprove) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>อยู่ระหว่างการรออนุมัติ (Step {currentStep})</span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          เอกสารฉบับนี้อยู่ในระหว่างการรอพิจารณาโดย <strong className="text-slate-800">{activeApproverName || "ผู้อนุมัติประจำขั้นตอน"}</strong>
        </p>
        <div className="text-[11px] text-slate-400 pt-1">
          🔒 ปุ่มอนุมัติและลายเซ็นจะเปิดให้ใช้งานเมื่อเป็นลำดับสิทธิ์ของคุณเท่านั้น
        </div>
      </div>
    );
  }

  return (
    <>
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
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
              ปฏิเสธ / ตีกลับ (Reject)
            </button>

            <button
              type="button"
              onClick={handleApprove}
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

      {/* REJECT OPTIONS MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600" />
                เลือกรูปแบบการปฏิเสธเอกสาร
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setRejectType("return")}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  rejectType === "return"
                    ? "border-amber-500 bg-amber-50/50 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="reject_type"
                  checked={rejectType === "return"}
                  onChange={() => setRejectType("return")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    ตีกลับให้ผู้สร้างแก้ไข (Reject & Return)
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    สถานะเอกสารจะเปลี่ยนเป็น Returned (ส่งกลับแก้ไข) เพื่อให้ผู้สร้างแก้ไขและส่งขออนุมัติใหม่ได้
                  </p>
                </div>
              </label>

              <label
                onClick={() => setRejectType("cancel")}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  rejectType === "cancel"
                    ? "border-rose-500 bg-rose-50/50 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="reject_type"
                  checked={rejectType === "cancel"}
                  onChange={() => setRejectType("cancel")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    ปฏิเสธถาวร (Reject & Cancel)
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    ปิดขั้นตอนอนุมัติถาวร เอกสารจะอยู่ในสถานะ Rejected ไม่สามารถแก้ไขหรือส่งใหม่ได้
                  </p>
                </div>
              </label>
            </div>

            {rejectType === "return" && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-600">
                  ส่งกลับไปยังขั้นตอนลำดับที่ (Return to Step)
                </label>
                <input
                  type="number"
                  min={1}
                  value={returnToStep}
                  onChange={(e) => setReturnToStep(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "ยืนยันปฏิเสธ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
