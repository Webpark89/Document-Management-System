"use client";

import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { workflowsService } from "@/controllers/services/workflows.service";
import { useToast } from "@views/components/providers/ToastProvider";
import { useRouter } from "next/navigation";

interface ResubmitButtonProps {
  documentId: string;
  docStatus: string;
  onSuccess?: () => void;
}

export function ResubmitButton({ documentId, docStatus, onSuccess }: ResubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  if (docStatus !== "Draft") return null;

  const handleResubmit = async () => {
    setIsSubmitting(true);
    try {
      const ok = await workflowsService.submitWorkflow(documentId);
      if (ok) {
        showToast("ส่งขออนุมัติใหม่อีกครั้งเรียบร้อยแล้ว (Resubmitted)", "success");
        onSuccess?.();
        router.refresh();
      } else {
        showToast("เกิดข้อผิดพลาดในการส่งขออนุมัติใหม่", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการส่งขออนุมัติใหม่", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleResubmit}
      disabled={isSubmitting}
      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
    >
      {isSubmitting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Send className="w-3.5 h-3.5" />
      )}
      ส่งขออนุมัติใหม่ (Resubmit)
    </button>
  );
}
