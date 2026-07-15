"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { FileText, FileCheck, Stamp, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PRForm from "@/components/forms/PRForm";
import POForm from "@/components/forms/POForm";
import { useToast } from "@/components/providers/ToastProvider";
import { addDocument } from "@/features/documents/api";

type FormType = "PR" | "PO" | "Certificate";

export default function DocumentUploadPage() {
  const [docType, setDocType] = useState<FormType>("PR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handlePRSubmit = async (data: { title: string; sender: string; amount: string }) => {
    setIsSubmitting(true);
    try {
      const newDoc = {
        id: `PR-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        name: data.title,
        type: "PR",
        sender: data.sender,
        submittedDate: new Date().toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: "Draft" as const,
        amount: data.amount,
        version: "v1.0",
      };

      await addDocument(newDoc);
      mutate("documents");
      showToast(`Successfully created ${newDoc.id} (Draft)`);
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("Error creating document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePOSubmit = async (data: { title: string; sender: string; amount: string }) => {
    setIsSubmitting(true);
    try {
      const newDoc = {
        id: `PO-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        name: data.title,
        type: "PO",
        sender: data.sender,
        submittedDate: new Date().toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: "Draft" as const,
        amount: data.amount,
        version: "v1.0",
      };

      await addDocument(newDoc);
      mutate("documents");
      showToast(`Successfully created ${newDoc.id} (Draft)`);
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("Error creating document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </button>
      </div>

      <PageHeader
        size="compact"
        title="Create New Document"
        subtitle="Select a document type and fill in the required workflow information."
      />

      {/* TYPE SELECTOR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Select Document Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setDocType("PR")}
              className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                docType === "PR"
                  ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${docType === "PR" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Purchase Request (PR)</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Create request for supplies or office procurement items.
                </p>
              </div>
            </button>

            <button
              onClick={() => setDocType("PO")}
              className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                docType === "PO"
                  ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${docType === "PO" ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Purchase Order (PO)</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Issue standard company purchase order to certified vendors.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* FORMS */}
        <div className="border-t border-slate-100 pt-6 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-blue-600">กำลังบันทึกข้อมูล...</p>
              </div>
            </div>
          )}
          {docType === "PR" && (
            <PRForm onSubmit={handlePRSubmit} onCancel={() => router.push("/documents")} />
          )}
          {docType === "PO" && (
            <POForm onSubmit={handlePOSubmit} onCancel={() => router.push("/documents")} />
          )}
        </div>
      </div>
    </div>
  );
}
