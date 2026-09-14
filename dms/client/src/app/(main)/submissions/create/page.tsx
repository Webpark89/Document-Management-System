"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { FileText, FileCheck, FileCode2, ArrowLeft, Lock, Eye, Users, CheckCircle } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import PRForm, { PRSubmitData } from '@views/components/forms/PRForm';
import POForm, { POSubmitData } from '@views/components/forms/POForm';
import BKForm, { BKSubmitData } from '@views/components/forms/BKForm';
import UploadOnlyForm, { OtherSubmitData } from '@views/components/forms/UploadOnlyForm';
import { useToast } from '@views/components/providers/ToastProvider';
import { swalConfirm } from "@/lib/swal";
import { addDocument, updateDocumentFull, updateDocumentFullWithFile } from '@views/features/documents/api';
import { workflowsService } from '@/controllers/services/workflows.service';
import { api } from "@/lib";

import type { DocumentStatus } from '@models';

type FormType = "PR" | "PO" | "บันทึก" | "Other";

export default function DocumentUploadPage() {
  const [docType, setDocType] = useState<FormType>("PR");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [editDoc, setEditDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (editId) {
      setLoadingDoc(true);
      api.get(`/api/documents/${editId}`)
        .then((res: any) => {
          if (res.data) {
            setEditDoc(res.data);
            const rawType = res.data.type;
            const prefix = (
              typeof rawType === "string"
                ? rawType
                : rawType?.prefix || (res.data.doc_number || "").split("-")[0] || ""
            ).toUpperCase();
            if (prefix === "PR") setDocType("PR");
            else if (prefix === "PO") setDocType("PO");
            else if (prefix === "BK" || prefix === "MEMO") setDocType("บันทึก");
            else setDocType("Other");
          }
        })
        .catch((err) => {
          console.error("Failed to load document for editing", err);
          showToast("ไม่สามารถโหลดข้อมูลเอกสารสำหรับการแก้ไขได้");
        })
        .finally(() => setLoadingDoc(false));
    }
  }, [editId]);

  const getRunningNumberPreview = (type: FormType) => {
    if (editDoc && editDoc.doc_number) {
      return editDoc.doc_number;
    }
    const prefix = type === "PR" ? "PR" : type === "PO" ? "PO" : type === "บันทึก" ? "BK" : "OTHER";
    return `${prefix}-2026-0001`;
  };

  const generateActualDocNumber = (type: FormType) => {
    const randomNum = String(Math.floor(Math.random() * 900) + 100).padStart(4, "0");
    const prefix = type === "PR" ? "PR" : type === "PO" ? "PO" : type === "บันทึก" ? "BK" : "OTHER";
    return `${prefix}-2026-${randomNum}`;
  };

  const handlePRSubmit = async (data: PRSubmitData) => {
    const confirmed = await swalConfirm({
      title: data.isDraft ? "ยืนยันการบันทึกร่างเอกสาร?" : (editId ? "ยืนยันการส่งขออนุมัติเอกสารใหม่?" : "ยืนยันการส่งขออนุมัติเอกสาร?"),
      text: data.isDraft
        ? "เอกสารจะถูกบันทึกไว้ในระบบในสถานะร่าง (Draft)"
        : "เอกสารจะถูกส่งเข้าสู่กระบวนการอนุมัติ (Workflow)",
      confirmButtonText: data.isDraft ? "บันทึกร่าง" : "ส่งขออนุมัติ",
      cancelButtonText: "ยกเลิก",
      icon: "question",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const runningNum = editDoc?.doc_number || generateActualDocNumber("PR");
      const apiPayload = {
        title: data.title,
        prefix: "PR",
        purpose: data.purpose,
        remark: data.remark,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          remark: it.remark,
        })),
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverId || step.approverName || "admin",
        })),
      };

      if (editId) {
        const updated = await updateDocumentFull(editId, apiPayload);
        if (!data.isDraft && updated) {
          const docIdToSubmit = updated.id || (updated as any).real_id || editId;
          await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
        }
        mutate("documents");
        showToast(data.isDraft ? "บันทึกการแก้ไขร่างเรียบร้อยแล้ว" : "ส่งเอกสารที่แก้ไขขออนุมัติใหม่เรียบร้อยแล้ว");
        router.push(`/documents/${editId}`);
        router.refresh();
        return;
      }

      const created = await addDocument(apiPayload);
      if (!data.isDraft && created && (created.id || (created as any).real_id)) {
        const docIdToSubmit = created.id || (created as any).real_id;
        await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
      }
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents/" + (created.id || (created as any)?.real_id || "") + "?source=submissions");
      router.refresh();
    } catch (error) {
      console.error("[handlePRSubmit]", error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePOSubmit = async (data: POSubmitData) => {
    const confirmed = await swalConfirm({
      title: data.isDraft ? "ยืนยันการบันทึกร่างเอกสาร?" : (editId ? "ยืนยันการส่งขออนุมัติเอกสารใหม่?" : "ยืนยันการส่งขออนุมัติเอกสาร?"),
      text: data.isDraft
        ? "เอกสารจะถูกบันทึกไว้ในระบบในสถานะร่าง (Draft)"
        : "เอกสารจะถูกส่งเข้าสู่กระบวนการอนุมัติ (Workflow)",
      confirmButtonText: data.isDraft ? "บันทึกร่าง" : "ส่งขออนุมัติ",
      cancelButtonText: "ยกเลิก",
      icon: "question",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const runningNum = editDoc?.doc_number || generateActualDocNumber("PO");
      const apiPayload = {
        title: data.title,
        prefix: "PO",
        purpose: `PO Vendor: ${data.vendorName}`,
        vendor_name: data.vendorName,
        vendor_contact: data.vendorContact,
        delivery_date: data.deliveryDate,
        payment_terms: data.paymentTerms,
        remark: data.remark,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          remark: it.remark,
          vat: it.vatPercent || 7,
        })),
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverId || step.approverName || "admin",
        })),
      };

      if (editId) {
        const updated = await updateDocumentFull(editId, apiPayload);
        if (!data.isDraft && updated) {
          const docIdToSubmit = updated.id || (updated as any).real_id || editId;
          await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
        }
        mutate("documents");
        showToast(data.isDraft ? "บันทึกการแก้ไขร่างเรียบร้อยแล้ว" : "ส่งเอกสารที่แก้ไขขออนุมัติใหม่เรียบร้อยแล้ว");
        router.push(`/documents/${editId}?source=submissions`);
        router.refresh();
        return;
      }

      const created = await addDocument(apiPayload);
      if (!data.isDraft && created && (created.id || (created as any).real_id)) {
        const docIdToSubmit = created.id || (created as any).real_id;
        await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
      }
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents/" + (created.id || (created as any)?.real_id || "") + "?source=submissions");
      router.refresh();
    } catch (error) {
      console.error("[handlePOSubmit]", error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBKSubmit = async (data: BKSubmitData) => {
    const confirmed = await swalConfirm({
      title: data.isDraft ? "ยืนยันการบันทึกร่างเอกสาร?" : (editId ? "ยืนยันการส่งขออนุมัติเอกสารใหม่?" : "ยืนยันการส่งขออนุมัติเอกสาร?"),
      text: data.isDraft
        ? "เอกสารจะถูกบันทึกไว้ในระบบในสถานะร่าง (Draft)"
        : "เอกสารจะถูกส่งเข้าสู่กระบวนการอนุมัติ (Workflow)",
      confirmButtonText: data.isDraft ? "บันทึกร่าง" : "ส่งขออนุมัติ",
      cancelButtonText: "ยกเลิก",
      icon: "question",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const runningNum = editDoc?.doc_number || generateActualDocNumber("บันทึก");
      const apiPayload = {
        title: data.title,
        prefix: "BK",
        purpose: data.detail,
        workflow_steps: data.workflowSteps.map((step) => ({
          step_order: step.stepOrder,
          approver_id: step.approverId || step.approverName || "admin",
        })),
      };

      if (editId) {
        const updated = await updateDocumentFull(editId, apiPayload);
        if (!data.isDraft && updated) {
          const docIdToSubmit = updated.id || (updated as any).real_id || editId;
          await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
        }
        mutate("documents");
        showToast(data.isDraft ? "บันทึกการแก้ไขร่างเรียบร้อยแล้ว" : "ส่งเอกสารที่แก้ไขขออนุมัติใหม่เรียบร้อยแล้ว");
        router.push(`/documents/${editId}?source=submissions`);
        router.refresh();
        return;
      }

      const created = await addDocument(apiPayload);
      if (!data.isDraft && created && (created.id || (created as any).real_id)) {
        const docIdToSubmit = created.id || (created as any).real_id;
        await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
      }
      mutate("documents");
      showToast(
        data.isDraft
          ? `บันทึกร่างเอกสาร ${created.id || runningNum} เรียบร้อยแล้ว (Draft)`
          : `ส่งเอกสารขออนุมัติ ${created.id || runningNum} สำเร็จแล้ว (Pending Review)`
      );
      router.push("/documents/" + (created.id || (created as any)?.real_id || "") + "?source=submissions");
      router.refresh();
    } catch (error) {
      console.error("[handleBKSubmit]", error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtherSubmit = async (data: OtherSubmitData) => {
    const confirmed = await swalConfirm({
      title: data.isDraft ? "ยืนยันการบันทึกร่างเอกสาร?" : (editId ? "ยืนยันการส่งขออนุมัติเอกสารใหม่?" : "ยืนยันการส่งขออนุมัติเอกสาร?"),
      text: data.isDraft
        ? "เอกสารจะถูกบันทึกไว้ในระบบในสถานะร่าง (Draft)"
        : "เอกสารจะถูกส่งเข้าสู่กระบวนการอนุมัติ (Workflow)",
      confirmButtonText: data.isDraft ? "บันทึกร่าง" : "ส่งขออนุมัติ",
      cancelButtonText: "ยกเลิก",
      icon: "question",
      confirmButtonColor: "#2563eb",
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      // When editing, always use the original document's prefix to avoid backend rejection
      const docPrefix = editDoc?.type?.prefix || "DOC";
      const workflowStepsMapped = data.workflowSteps.map((step) => ({
        step_order: step.stepOrder,
        approver_id: step.approverId || step.approverName || "admin",
      }));

      if (editId) {
        if (data.file) {
          // With new file — multipart
          const formData = new FormData();
          formData.append("file", data.file);
          formData.append("title", data.title);
          formData.append("prefix", docPrefix);
          formData.append("purpose", data.description || "");
          const approverIds = data.workflowSteps
            .map((s) => s.approverId || s.approverName || "admin")
            .filter(Boolean);
          formData.append("approver_ids", JSON.stringify(approverIds));
          const updated = await updateDocumentFullWithFile(editId, formData);
          if (!data.isDraft && updated) {
            const docIdToSubmit = updated.id || (updated as { real_id?: string }).real_id || editId;
            await workflowsService.submitWorkflow(docIdToSubmit, workflowStepsMapped);
          }
        } else {
          // Without file — JSON
          const apiPayload = {
            title: data.title,
            prefix: docPrefix,
            purpose: data.description || "",
            workflow_steps: workflowStepsMapped,
          };
          const updated = await updateDocumentFull(editId, apiPayload);
          if (!data.isDraft && updated) {
            const docIdToSubmit = updated.id || (updated as { real_id?: string }).real_id || editId;
            await workflowsService.submitWorkflow(docIdToSubmit, apiPayload.workflow_steps);
          }
        }
        mutate("documents");
        showToast(data.isDraft ? "บันทึกการแก้ไขร่างเรียบร้อยแล้ว" : "ส่งเอกสารที่แก้ไขขออนุมัติใหม่เรียบร้อยแล้ว");
        router.push(`/documents/${editId}?source=submissions`);
        router.refresh();
        return;
      }

      // Create new document (upload)
      const formData = new FormData();
      if (data.file) {
        formData.append("file", data.file);
      }
      formData.append("title", data.title);
      formData.append("prefix", "DOC");
      formData.append("purpose", data.description || "");
      const approverIds = data.workflowSteps
        .map((s) => s.approverId || s.approverName || "admin")
        .filter(Boolean);
      formData.append("approver_ids", JSON.stringify(approverIds));

      const res = await api.post<{ id?: string; real_id?: string }>("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data;
      if (!data.isDraft && created && (created.id || created.real_id)) {
        const docIdToSubmit = created.id || created.real_id!;
        await workflowsService.submitWorkflow(docIdToSubmit, workflowStepsMapped);
      }
      mutate("documents");
      showToast(
        data.isDraft
          ? "บันทึกร่างเอกสารเรียบร้อยแล้ว (Draft)"
          : "ส่งเอกสารขออนุมัติสำเร็จแล้ว (Pending Review)"
      );
      router.push("/documents/" + (created.id || (created as any)?.real_id || "") + "?source=submissions");
      router.refresh();
    } catch (error) {
      console.error("[handleOtherSubmit]", error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "เกิดข้อผิดพลาดในการอัปโหลดเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDoc) {
    return (
      <div className={APP_PAGE_SHELL}>
        <div className={APP_PAGE_CONTENT}>
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-xs font-semibold">กำลังโหลดข้อมูลเอกสารสำหรับแก้ไข...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <PageHeader
            title={editId ? "แก้ไขเอกสาร (Edit Document)" : "สร้างเอกสารใหม่ (New Document Submission)"}
            description={
              editId
                ? `กำลังแก้ไขเอกสาร ${editDoc?.doc_number || editId} (ล็อคประเภทเอกสารตามเดิม)`
                : "เลือกประเภทเอกสาร กรอกข้อมูล และกำหนดสายการอนุมัติ"
            }
          />
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ย้อนกลับ
          </button>
        </div>

        {/* NEW MODERN STEPPER */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 overflow-hidden relative">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-50/50 to-teal-50/50 rounded-full blur-2xl -z-10 translate-y-1/2 -translate-x-1/2" />
          
          <div className="flex items-start justify-between w-full relative z-10">
            {/* Connection Line Behind */}
            <div className="absolute left-[10%] right-[10%] top-6 h-1 bg-slate-100 rounded-full -z-10">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-in-out" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            
            {[
              { step: 1, label: "รายละเอียดเอกสาร", desc: "ข้อมูลฟอร์ม", icon: <FileText className="w-5 h-5" /> },
              { step: 2, label: "การมองเห็น", desc: "กำหนดสิทธิ์", icon: <Eye className="w-5 h-5" /> },
              { step: 3, label: "สายอนุมัติ", desc: "ผู้อนุมัติ", icon: <Users className="w-5 h-5" /> },
              { step: 4, label: "ตรวจสอบ", desc: "พรีวิว & ส่ง", icon: <CheckCircle className="w-5 h-5" /> }
            ].map(s => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;
              
              return (
                <div key={s.step} className="flex flex-col items-center gap-3 relative w-1/4 group">
                  {/* Step Icon Bubble */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isActive 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-50" 
                      : isPast 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : "bg-white text-slate-300 border-2 border-slate-100"
                  }`}>
                    {isPast ? <CheckCircle className="w-6 h-6 animate-in zoom-in" /> : s.icon}
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-1 hidden sm:block">
                    <p className={`text-[13px] font-black tracking-tight transition-colors duration-300 ${
                      isActive ? "text-slate-800" : isPast ? "text-slate-700" : "text-slate-400"
                    }`}>
                      {s.label}
                    </p>
                    <p className={`text-[11px] font-semibold mt-0.5 transition-colors duration-300 ${
                      isActive ? "text-blue-600" : isPast ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DOCUMENT TYPE SELECTOR (ONLY STEP 1) */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                เลือกประเภทเอกสาร
                {editId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                    <Lock className="w-3 h-3" />
                    ล็อคประเภทเอกสารในโหมดแก้ไข
                  </span>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* PR CARD */}
              <button
                type="button"
                disabled={!!editId && docType !== "PR"}
                onClick={() => !editId && setDocType("PR")}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
                  docType === "PR"
                    ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10 shadow-xs"
                    : editId
                    ? "border-slate-100 opacity-40 cursor-not-allowed"
                    : "border-slate-100 hover:bg-slate-50/50 cursor-pointer"
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
                disabled={!!editId && docType !== "PO"}
                onClick={() => !editId && setDocType("PO")}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
                  docType === "PO"
                    ? "border-purple-600 bg-purple-50/20 ring-2 ring-purple-600/10 shadow-xs"
                    : editId
                    ? "border-slate-100 opacity-40 cursor-not-allowed"
                    : "border-slate-100 hover:bg-slate-50/50 cursor-pointer"
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
                disabled={!!editId && docType !== "บันทึก"}
                onClick={() => !editId && setDocType("บันทึก")}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
                  docType === "บันทึก"
                    ? "border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-600/10 shadow-xs"
                    : editId
                    ? "border-slate-100 opacity-40 cursor-not-allowed"
                    : "border-slate-100 hover:bg-slate-50/50 cursor-pointer"
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
                disabled={!!editId && docType !== "Other"}
                onClick={() => !editId && setDocType("Other")}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
                  docType === "Other"
                    ? "border-slate-800 bg-slate-100/50 ring-2 ring-slate-800/10 shadow-xs"
                    : editId
                    ? "border-slate-100 opacity-40 cursor-not-allowed"
                    : "border-slate-100 hover:bg-slate-50/50 cursor-pointer"
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
                  <p className="text-sm font-bold text-slate-800">เอกสารทั่วไป (DOC)</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    อัปโหลดไฟล์ PDF เอกสารอื่นๆ
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* FORMS */}
        {docType === "PR" && (
          <PRForm
            runningNumberPreview={getRunningNumberPreview("PR")}
            currentStep={currentStep}
            onNext={() => setCurrentStep(p => p + 1)}
            onBack={() => setCurrentStep(p => p - 1)}
            onSubmit={handlePRSubmit}
            onCancel={() => router.back()}
            initialData={editDoc}
          />
        )}

        {docType === "PO" && (
          <POForm
            runningNumberPreview={getRunningNumberPreview("PO")}
            currentStep={currentStep}
            onNext={() => setCurrentStep(p => p + 1)}
            onBack={() => setCurrentStep(p => p - 1)}
            onSubmit={handlePOSubmit}
            onCancel={() => router.back()}
            initialData={editDoc}
          />
        )}

        {docType === "บันทึก" && (
          <BKForm
            runningNumberPreview={getRunningNumberPreview("บันทึก")}
            currentStep={currentStep}
            onNext={() => setCurrentStep(p => p + 1)}
            onBack={() => setCurrentStep(p => p - 1)}
            onSubmit={handleBKSubmit}
            onCancel={() => router.back()}
            initialData={editDoc}
          />
        )}

        {docType === "Other" && (
          <UploadOnlyForm
            runningNumberPreview={getRunningNumberPreview("Other")}
            currentStep={currentStep}
            onNext={() => setCurrentStep(p => p + 1)}
            onBack={() => setCurrentStep(p => p - 1)}
            onSubmit={handleOtherSubmit}
            onCancel={() => router.back()}
            initialData={editDoc}
          />
        )}
      </div>
    </div>
  );
}
