"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { FileText, FileCheck, Award, FileCode2, ArrowLeft } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import PRForm, { PRSubmitData } from '@views/components/forms/PRForm';
import POForm, { POSubmitData } from '@views/components/forms/POForm';
import BKForm, { BKSubmitData } from '@views/components/forms/BKForm';
import UploadOnlyForm, { OtherSubmitData } from '@views/components/forms/UploadOnlyForm';
import { useToast } from '@views/components/providers/ToastProvider';
import { addDocument } from '@views/features/documents/api';

import type { DocumentStatus } from '@models';

type FormType = "PR" | "PO" | "บันทึก" | "Other";

export default function DocumentUploadPage() {
  const [docType, setDocType] = useState<FormType>("PR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const getRunningNumberPreview = (type: FormType) => {
    const prefix = type === "PR" ? "PR" : type === "PO" ? "PO" : type === "บันทึก" ? "BK" : "OTHER";
    return `${prefix}-2026-0001`;
  };

  const generateActualDocNumber = (type: FormType) => {
    const randomNum = String(Math.floor(Math.random() * 900) + 100).padStart(4, "0");
    const prefix = type === "PR" ? "PR" : type === "PO" ? "PO" : type === "บันทึก" ? "BK" : "OTHER";
    return `${prefix}-2026-${randomNum}`;
  };

  const handlePRSubmit = async (data: PRSubmitData) => {
    setIsSubmitting(true);
    try {
      const runningNum = generateActualDocNumber("PR");
      const status: DocumentStatus = data.isDraft ? "Draft" : "Pending";

      // Payload matching database schema: documents + pr_forms + pr_form_items + workflow_steps
      const payload = {
        document: {
          doc_number: runningNum,
          title: data.title,
          type: "PR",
          status,
          is_deleted: false,
        },
        pr_form: {
          requested_date: data.requestedDate,
          required_date: data.requiredDate,
          department: data.department,
          purpose: data.purpose,
          total_amount: data.amount,
          items: data.items.map((it) => ({
            item_name: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unitPrice,
            total_price: it.quantity * it.unitPrice,
            remark: it.remark,
          })),
        },
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          role_name: step.roleName,
          approver_name: step.approverName,
          status: "Pending",
        })),
      };

      const apiPayload = {
        title: data.title,
        prefix: "PR",
        purpose: data.purpose,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          remark: it.remark,
        })),
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverName || "admin",
        })),
      };

      const created = await addDocument(apiPayload);
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePOSubmit = async (data: POSubmitData) => {
    setIsSubmitting(true);
    try {
      const runningNum = generateActualDocNumber("PO");
      const status: DocumentStatus = data.isDraft ? "Draft" : "Pending";

      // Payload matching database schema: documents + po_forms + po_form_items + workflow_steps
      const payload = {
        document: {
          doc_number: runningNum,
          title: data.title,
          type: "PO",
          status,
          is_deleted: false,
        },
        po_form: {
          vendor_name: data.vendorName,
          vendor_contact: data.vendorContact,
          delivery_date: data.deliveryDate,
          payment_terms: data.paymentTerms,
          department: data.department,
          total_amount: data.amount,
          items: data.items.map((it) => ({
            item_name: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unitPrice,
            vat_percent: it.vatPercent,
            total_price: it.quantity * it.unitPrice * (1 + it.vatPercent / 100),
            remark: it.remark,
          })),
        },
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          role_name: step.roleName,
          approver_name: step.approverName,
          status: "Pending",
        })),
      };

      const apiPayload = {
        title: data.title,
        prefix: "PO",
        purpose: `PO Vendor: ${data.vendorName}`,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          remark: it.remark,
        })),
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverName || "admin",
        })),
      };

      const created = await addDocument(apiPayload);
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBKSubmit = async (data: BKSubmitData) => {
    setIsSubmitting(true);
    try {
      const runningNum = generateActualDocNumber("บันทึก");

      const apiPayload = {
        title: data.title,
        prefix: "BK",
        purpose: data.detail,
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverName || "admin",
        })),
      };

      const created = await addDocument(apiPayload);
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtherSubmit = async (data: OtherSubmitData) => {
    setIsSubmitting(true);
    try {
      const runningNum = generateActualDocNumber("Other");

      const apiPayload = {
        title: data.title,
        prefix: "OTHER",
        purpose: data.description,
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverName || "admin",
        })),
      };

      const created = await addDocument(apiPayload);
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents");
      router.refresh();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปยังรายการเอกสาร (Back to Documents)
        </button>
      </div>

      <PageHeader
        size="compact"
        title="สร้างและยื่นเอกสารอิเล็กทรอนิกส์ (Create Document)"
        subtitle="เลือกประเภทเอกสารที่ต้องการ กรอกข้อมูล และกำหนดสายการอนุมัติเพื่อเสนอเรื่อง"
      />

      {/* TYPE SELECTOR - 4 CARDS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            เลือกประเภทเอกสาร (Select Document Type)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* PR CARD */}
            <button
              type="button"
              onClick={() => setDocType("PR")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                docType === "PR"
                  ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10 shadow-xs"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl self-start ${
                  docType === "PR"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">ใบขอซื้อ (PR)</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Purchase Request การเบิกจ่ายวัสดุ/พัสดุ
                </p>
              </div>
            </button>

            {/* PO CARD */}
            <button
              type="button"
              onClick={() => setDocType("PO")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                docType === "PO"
                  ? "border-purple-600 bg-purple-50/20 ring-2 ring-purple-600/10 shadow-xs"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl self-start ${
                  docType === "PO"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">ใบสั่งซื้อ (PO)</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Purchase Order สั่งซื้อสินค้ากับคู่ค้า
                </p>
              </div>
            </button>

            {/* MEMO CARD */}
            <button
              type="button"
              onClick={() => setDocType("บันทึก")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                docType === "บันทึก"
                  ? "border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-600/10 shadow-xs"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl self-start ${
                  docType === "บันทึก"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">บันทึกข้อความ (BK)</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  บันทึกข้อความภายใน
                </p>
              </div>
            </button>

            {/* OTHER CARD */}
            <button
              type="button"
              onClick={() => setDocType("Other")}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                docType === "Other"
                  ? "border-slate-800 bg-slate-100/50 ring-2 ring-slate-800/10 shadow-xs"
                  : "border-slate-100 hover:bg-slate-50/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl self-start ${
                  docType === "Other"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">เอกสารแนบ (Other)</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  อัปโหลดไฟล์ PDF อนุมัติ
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* FORMS SECTION */}
        <div className="border-t border-slate-100 pt-6 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-blue-600">กำลังบันทึกข้อมูลและสร้างสายการอนุมัติ...</p>
              </div>
            </div>
          )}

          {docType === "PR" && (
            <PRForm
              onSubmit={handlePRSubmit}
              onCancel={() => router.push("/documents")}
              runningNumberPreview={getRunningNumberPreview("PR")}
            />
          )}

          {docType === "PO" && (
            <POForm
              onSubmit={handlePOSubmit}
              onCancel={() => router.push("/documents")}
              runningNumberPreview={getRunningNumberPreview("PO")}
            />
          )}

          {docType === "บันทึก" && (
            <BKForm
              onSubmit={handleBKSubmit}
              onCancel={() => router.push("/documents")}
              runningNumberPreview={getRunningNumberPreview("บันทึก")}
            />
          )}

          {docType === "Other" && (
            <UploadOnlyForm
              onSubmit={handleOtherSubmit}
              onCancel={() => router.push("/documents")}
              runningNumberPreview={getRunningNumberPreview("Other")}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
