"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import {
  FileText,
  FileCheck,
  FileCode2,
  ArrowLeft,
  Lock,
  Eye,
  Users,
  CheckCircle,
} from "lucide-react";
import PageHeader from "@views/components/shared/PageHeader";
import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
} from "@views/components/ui/design-system";
import PRForm, { PRSubmitData } from "@views/components/forms/PRForm";
import POForm, { POSubmitData } from "@views/components/forms/POForm";
import BKForm, { BKSubmitData } from "@views/components/forms/BKForm";
import UploadOnlyForm, {
  OtherSubmitData,
} from "@views/components/forms/UploadOnlyForm";
import { useToast } from "@views/components/providers/ToastProvider";
import { swalConfirm } from "@/lib/swal";
import {
  addDocument,
  updateDocumentFull,
  updateDocumentFullWithFile,
  getDocumentById,
} from "@views/features/documents/api";
import { workflowsService } from "@/controllers/services/workflows.service";
import { api } from "@/lib";
import {
  saveSubmissionDraft,
  newSubmissionSaveState,
  type SubmissionSaveState,
} from "@/lib/submission-persistence";

import type { DocumentStatus } from "@models";

type FormType = "PR" | "PO" | "บันทึก" | "Other";

export default function DocumentUploadPage() {
  const [activePrefixes, setActivePrefixes] = useState<string[] | null>(null);
  const [uploadPrefix, setUploadPrefix] = useState("DOC");
  const [uploadTypes, setUploadTypes] = useState<
    { prefix: string; name: string }[]
  >([]);
  const [docType, setDocType] = useState<FormType>("PR");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const saveState = useRef<SubmissionSaveState | null>(null);
  const [savedDraft, setSavedDraft] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") || searchParams.get("draftId");
  const [editDoc, setEditDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    saveState.current = null;
    setSavedDraft(null);
  }, [editId]);

  useEffect(() => {
    api
      .get<{ prefix: string; name: string }[]>("/api/lookups/workflows")
      .then((r) => {
        const uploads = r.data.filter(
          (t) => !["PR", "PO", "BK"].includes(t.prefix),
        );
        const prefixes = r.data.map((t) => t.prefix);
        setActivePrefixes(prefixes);
        setUploadTypes(uploads);
        if (!editId) {
          setUploadPrefix((previous) =>
            uploads.some((t) => t.prefix === previous)
              ? previous
              : (uploads[0]?.prefix ?? "DOC"),
          );
          setDocType((previous) => {
            const prefix = previous === "บันทึก" ? "BK" : previous;
            if (
              (previous === "Other" && uploads.length) ||
              prefixes.includes(prefix)
            )
              return previous;
            return prefixes.includes("PR")
              ? "PR"
              : prefixes.includes("PO")
                ? "PO"
                : prefixes.includes("BK")
                  ? "บันทึก"
                  : "Other";
          });
        }
      })
      .catch((error) => showToast(String(error), "error"));
  }, []);

  useEffect(() => {
    if (editId) {
      setLoadingDoc(true);
      api
        .get(`/api/documents/${editId}`)
        .then((res: any) => {
          if (res.data) {
            setEditDoc(res.data);
            const rawType = res.data.type;
            const prefix = (
              typeof rawType === "string"
                ? rawType
                : rawType?.prefix ||
                  (res.data.doc_number || "").split("-")[0] ||
                  ""
            ).toUpperCase();
            if (prefix === "PR") setDocType("PR");
            else if (prefix === "PO") setDocType("PO");
            else if (prefix === "BK" || prefix === "MEMO") setDocType("บันทึก");
            else {
              setDocType("Other");
              setUploadPrefix(prefix);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load document for editing", err);
          showToast("ไม่สามารถโหลดข้อมูลเอกสารสำหรับการแก้ไขได้");
        })
        .finally(() => setLoadingDoc(false));
    }
  }, [editId]);

  const getRunningNumberPreview = (_type: FormType) =>
    editDoc?.doc_number || "ระบบออกเลขเมื่อบันทึก";

  const persist = async (
    payload: any,
    draft: boolean,
    steps: any[],
    file?: File | null,
  ) => {
    if (submitLock.current) return;
    if (activePrefixes && !activePrefixes.includes(payload.prefix)) {
      showToast("ประเภทเอกสารนี้ถูกปิดใช้งาน กรุณาเลือกประเภทอื่น", "error");
      return;
    }
    if (!draft && (!steps.length || steps.some((s) => !s.approverId))) {
      showToast("กรุณาเลือกผู้อนุมัติให้ครบตาม Master Data", "error");
      return;
    }
    if (!payload.title?.trim()) {
      showToast("กรุณาระบุชื่อเอกสาร", "error");
      return;
    }
    submitLock.current = true;
    let confirmed: boolean;
    try {
      confirmed = await swalConfirm({
        title: draft ? "บันทึกร่างเอกสาร?" : "ส่งขออนุมัติ?",
        text: draft
          ? "บันทึกข้อมูลฉบับร่าง"
          : "ส่งเอกสารให้ผู้อนุมัติตามรายชื่อที่เลือก",
        confirmButtonText: draft ? "บันทึกร่าง" : "ส่งอนุมัติ",
        cancelButtonText: "ยกเลิก",
        icon: "question",
      });
    } catch (error) {
      submitLock.current = false;
      showToast(
        error instanceof Error ? error.message : String(error),
        "error",
      );
      return;
    }
    if (!confirmed) {
      submitLock.current = false;
      return;
    }
    setIsSubmitting(true);
    let saved: any = null;
    try {
      saveState.current ??= newSubmissionSaveState(editId ?? undefined);
      const write = async (id?: string) => {
        const data = id
          ? payload
          : { ...payload, client_request_id: saveState.current!.requestId };
        if (file) {
          const body = new FormData();
          body.append("file", file);
          body.append("payload", JSON.stringify(data));
          return id
            ? updateDocumentFullWithFile(id, body)
            : (await api.post<any>("/api/documents/upload", body)).data;
        }
        return id ? updateDocumentFull(id, data) : addDocument(data);
      };
      saved = await saveSubmissionDraft(saveState.current, {
        load: getDocumentById,
        create: () => write(),
        update: write,
      });
      const id = saved.real_id;
      setSavedDraft({ id, number: saved.doc_number || saved.id });
      const alreadyProcessed = !["Draft", "Returned"].includes(saved.status);
      if (!draft && !alreadyProcessed) {
        const ok = await workflowsService.submitWorkflow(
          id,
          steps.map((s) => ({
            step_order: s.stepOrder,
            approver_id: s.approverId,
          })),
        );
        if (!ok) throw new Error("ส่งอนุมัติไม่สำเร็จ");
      }
      mutate("documents");
      showToast(
        alreadyProcessed
          ? "เอกสารนี้ส่งเข้าสู่ระบบแล้ว กำลังเปิดรายละเอียด"
          : draft
            ? "บันทึกร่างเรียบร้อยแล้ว"
            : "ส่งขออนุมัติเรียบร้อยแล้ว",
        "success",
      );
      router.push(`/documents/${id}?source=submissions`);
    } catch (error) {
      showToast(
        `${saved?.real_id ? `บันทึกฉบับร่าง ${saved.doc_number || saved.id} แล้ว แต่ส่งอนุมัติยังไม่สำเร็จ: ` : ""}${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const handlePRSubmit = (data: PRSubmitData) =>
    persist(
      {
        title: data.title,
        prefix: "PR",
        purpose: data.purpose,
        remark: data.remark,
        requested_date: data.requestedDate,
        required_date: data.requiredDate || undefined,
        visibility: data.visibility,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          remark: it.remark,
        })),
      },
      data.isDraft,
      data.workflowSteps,
    );
  const handlePOSubmit = (data: POSubmitData) =>
    persist(
      {
        title: data.title,
        prefix: "PO",
        vendor_name: data.vendorName,
        vendor_contact: data.vendorContact,
        delivery_date: data.deliveryDate || undefined,
        payment_terms: data.paymentTerms,
        remark: data.remark,
        visibility: data.visibility,
        items: data.items.map((it) => ({
          item_name: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          vat: it.vatPercent ?? 7,
          remark: it.remark,
        })),
      },
      data.isDraft,
      data.workflowSteps,
    );
  const handleBKSubmit = (data: BKSubmitData) =>
    persist(
      {
        title: data.title,
        prefix: "BK",
        purpose: data.detail,
        visibility: data.visibility,
      },
      data.isDraft,
      data.workflowSteps,
    );
  const handleOtherSubmit = (data: OtherSubmitData) =>
    persist(
      {
        title: data.title,
        prefix: uploadPrefix,
        purpose: data.description,
        visibility: data.visibility,
      },
      data.isDraft,
      data.workflowSteps,
      data.file,
    );

  if (loadingDoc) {
    return (
      <div className={APP_PAGE_SHELL}>
        <div className={APP_PAGE_CONTENT}>
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-xs font-semibold">
              กำลังโหลดข้อมูลเอกสารสำหรับแก้ไข...
            </p>
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
            title={
              editId
                ? "แก้ไขเอกสาร (Edit Document)"
                : "สร้างเอกสารใหม่ (New Document Submission)"
            }
            subtitle={
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

        {savedDraft && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            บันทึกฉบับร่าง {savedDraft.number} แล้ว
            คุณสามารถส่งอนุมัติอีกครั้งจากฟอร์มนี้ได้ โดยระบบจะใช้เอกสารเดิม
          </div>
        )}
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
              {
                step: 1,
                label: "รายละเอียดเอกสาร",
                desc: "ข้อมูลฟอร์ม",
                icon: <FileText className="w-5 h-5" />,
              },
              {
                step: 2,
                label: "การมองเห็น",
                desc: "กำหนดสิทธิ์",
                icon: <Eye className="w-5 h-5" />,
              },
              {
                step: 3,
                label: "สายอนุมัติ",
                desc: "ผู้อนุมัติ",
                icon: <Users className="w-5 h-5" />,
              },
              {
                step: 4,
                label: "ตรวจสอบ",
                desc: "พรีวิว & ส่ง",
                icon: <CheckCircle className="w-5 h-5" />,
              },
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;

              return (
                <div
                  key={s.step}
                  className="flex flex-col items-center gap-3 relative w-1/4 group"
                >
                  {/* Step Icon Bubble */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-50"
                        : isPast
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-white text-slate-300 border-2 border-slate-100"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="w-6 h-6 animate-in zoom-in" />
                    ) : (
                      s.icon
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="text-center mt-1 hidden sm:block">
                    <p
                      className={`text-[13px] font-black tracking-tight transition-colors duration-300 ${
                        isActive
                          ? "text-slate-800"
                          : isPast
                            ? "text-slate-700"
                            : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p
                      className={`text-[11px] font-semibold mt-0.5 transition-colors duration-300 ${
                        isActive
                          ? "text-blue-600"
                          : isPast
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
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
                disabled={
                  (!!editId && docType !== "PR") ||
                  (!editId && activePrefixes?.includes("PR") === false)
                }
                onClick={() => !editId && setDocType("PR")}
                className={`disabled:opacity-40 disabled:cursor-not-allowed p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
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
                  <p className="text-sm font-bold text-slate-800">
                    ใบขอซื้อ (PR)
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Purchase Request การเบิกจ่ายวัสดุ/พัสดุ
                  </p>
                </div>
              </button>

              {/* PO CARD */}
              <button
                type="button"
                disabled={
                  (!!editId && docType !== "PO") ||
                  (!editId && activePrefixes?.includes("PO") === false)
                }
                onClick={() => !editId && setDocType("PO")}
                className={`disabled:opacity-40 disabled:cursor-not-allowed p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
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
                  <p className="text-sm font-bold text-slate-800">
                    ใบสั่งซื้อ (PO)
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Purchase Order สั่งซื้อสินค้ากับคู่ค้า
                  </p>
                </div>
              </button>

              {/* MEMO CARD */}
              <button
                type="button"
                disabled={
                  (!!editId && docType !== "บันทึก") ||
                  (!editId && activePrefixes?.includes("BK") === false)
                }
                onClick={() => !editId && setDocType("บันทึก")}
                className={`disabled:opacity-40 disabled:cursor-not-allowed p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
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
                  <p className="text-sm font-bold text-slate-800">
                    บันทึกข้อความ (BK)
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    บันทึกข้อความภายใน
                  </p>
                </div>
              </button>

              {/* OTHER CARD */}
              <button
                type="button"
                disabled={
                  (!!editId && docType !== "Other") ||
                  (!editId &&
                    activePrefixes !== null &&
                    uploadTypes.length === 0)
                }
                onClick={() => !editId && setDocType("Other")}
                className={`disabled:opacity-40 disabled:cursor-not-allowed p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all ${
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
                  <p className="text-sm font-bold text-slate-800">
                    เอกสารทั่วไป (DOC)
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    อัปโหลดไฟล์ PDF เอกสารอื่นๆ
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {isSubmitting && (
          <p role="status" className="text-sm text-blue-700">
            กำลังบันทึกเอกสารและส่งอนุมัติ...
          </p>
        )}
        {docType === "Other" && currentStep === 1 && (
          <label className="block text-sm font-semibold">
            ประเภทเอกสาร PDF
            <select
              aria-label="ประเภทเอกสาร PDF"
              disabled={!!editId}
              value={uploadPrefix}
              onChange={(e) => setUploadPrefix(e.target.value)}
              className="block mt-2 rounded-xl border p-3 bg-white w-full"
            >
              {uploadTypes.map((t) => (
                <option key={t.prefix} value={t.prefix}>
                  {t.name} ({t.prefix})
                </option>
              ))}
            </select>
          </label>
        )}
        {!editId && activePrefixes?.length === 0 && (
          <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-800">
            ยังไม่มีประเภทเอกสารที่เปิดใช้งาน กรุณาให้ผู้ดูแลตั้งค่า Master Data
          </p>
        )}
        <fieldset
          disabled={isSubmitting || (!editId && activePrefixes?.length === 0)}
          className={isSubmitting ? "opacity-60 pointer-events-none" : ""}
        >
          {/* FORMS */}
          {docType === "PR" && (
            <PRForm
              runningNumberPreview={getRunningNumberPreview("PR")}
              currentStep={currentStep}
              onNext={() => setCurrentStep((p) => p + 1)}
              onBack={() => setCurrentStep((p) => p - 1)}
              onSubmit={handlePRSubmit}
              onCancel={() => router.back()}
              initialData={editDoc}
            />
          )}

          {docType === "PO" && (
            <POForm
              runningNumberPreview={getRunningNumberPreview("PO")}
              currentStep={currentStep}
              onNext={() => setCurrentStep((p) => p + 1)}
              onBack={() => setCurrentStep((p) => p - 1)}
              onSubmit={handlePOSubmit}
              onCancel={() => router.back()}
              initialData={editDoc}
            />
          )}

          {docType === "บันทึก" && (
            <BKForm
              runningNumberPreview={getRunningNumberPreview("บันทึก")}
              currentStep={currentStep}
              onNext={() => setCurrentStep((p) => p + 1)}
              onBack={() => setCurrentStep((p) => p - 1)}
              onSubmit={handleBKSubmit}
              onCancel={() => router.back()}
              initialData={editDoc}
            />
          )}

          {docType === "Other" && (
            <UploadOnlyForm
              documentPrefix={uploadPrefix}
              runningNumberPreview={getRunningNumberPreview("Other")}
              currentStep={currentStep}
              onNext={() => setCurrentStep((p) => p + 1)}
              onBack={() => setCurrentStep((p) => p - 1)}
              onSubmit={handleOtherSubmit}
              onCancel={() => router.back()}
              initialData={editDoc}
            />
          )}
        </fieldset>
      </div>
    </div>
  );
}
