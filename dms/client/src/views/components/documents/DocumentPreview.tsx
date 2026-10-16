"use client";

import React from "react";
import { Download, FileText } from "lucide-react";
import { downloadDocument } from "@views/features/documents/api";
import { useAuth } from "@views/components/providers/AuthProvider";
import { useToast } from "@views/components/providers/ToastProvider";
import PRForm from "@views/components/forms/PRForm";
import POForm from "@views/components/forms/POForm";
import BKForm from "@views/components/forms/BKForm";

interface DocumentPreviewProps {
  doc: any;
  versionId?: string;
  hideHeader?: boolean;
  isViewer?: boolean;
  tempSignature?: boolean;
  onSignClick?: () => void;
}

export function DocumentPreview({
  doc: initialDoc,
  versionId,
  hideHeader,
  isViewer,
  tempSignature,
  onSignClick,
}: DocumentPreviewProps) {
  let doc = initialDoc as any;
  const rawType = doc?.type || doc?.doc_type;
  const rawPrefix =
    (typeof rawType === "object" ? rawType?.prefix : rawType) ||
    (doc?.doc_number || doc?.id || "").split("-")[0] ||
    "OTHER";
  const resolvedTypePrefix = String(rawPrefix).toUpperCase();

  if (versionId && doc?.versions) {
    const version = doc.versions.find(
      (v: any) =>
        v.id === versionId ||
        v.version_number?.toString() === versionId.toString(),
    );
    const docTypePrefix = resolvedTypePrefix;
    if (version && version.form_data) {
      doc = { ...doc };
      const vFormData = version.form_data;
      const meta = vFormData._meta;
      doc = {
        ...doc,
        ...(meta ?? {}),
        _meta: meta,
        workflow: meta?.workflow ?? null,
        creator: meta?.creator ?? doc.creator,
        department: meta?.creator?.department?.name ?? doc.department,
        doc_number: meta?.doc_number ?? doc.doc_number,
        title: meta?.title ?? doc.title,
      };
      if (!["PR", "PO", "BK", "MEMO"].includes(docTypePrefix))
        doc.fileUrl = version.download_url;
      if (docTypePrefix === "PR") {
        doc.pr_form =
          vFormData.items &&
          Array.isArray(vFormData.items) &&
          vFormData.items.length > 0
            ? vFormData
            : { ...vFormData, items: [] };
      } else if (docTypePrefix === "PO") {
        doc.po_form =
          vFormData.items &&
          Array.isArray(vFormData.items) &&
          vFormData.items.length > 0
            ? vFormData
            : { ...vFormData, items: [] };
      } else if (docTypePrefix === "BK" || docTypePrefix === "MEMO") {
        doc.bk_form = vFormData;
      }
    }
  }
  // PR Form Renderer (A4 Style)
  const renderPRForm = () => {
    const form = doc.pr_form;
    if (!form)
      return (
        <div className="text-center p-8 text-slate-500">
          ไม่พบข้อมูล PR Form
        </div>
      );
    return (
      <div className="w-full relative">
        <PRForm
          isViewer={true}
          tempSignature={tempSignature}
          onSignClick={onSignClick}
          initialData={doc}
          currentStep={1}
          runningNumberPreview={doc.doc_number || doc.id}
          onSubmit={() => {}}
          onCancel={() => {}}
          onNext={() => {}}
          onBack={() => {}}
        />
      </div>
    );
  };

  // PO Form Renderer (A4 Style)
  const renderPOForm = () => {
    const form = doc.po_form;
    if (!form)
      return (
        <div className="text-center p-8 text-slate-500">
          ไม่พบข้อมูล PO Form
        </div>
      );
    return (
      <div className="w-full relative">
        <POForm
          isViewer={true}
          tempSignature={tempSignature}
          onSignClick={onSignClick}
          initialData={doc}
          currentStep={1}
          runningNumberPreview={doc.doc_number || doc.id}
          onSubmit={() => {}}
          onCancel={() => {}}
          onNext={() => {}}
          onBack={() => {}}
        />
      </div>
    );
  };

  // BK Form Renderer (A4 Style)
  const renderBKForm = () => {
    return (
      <div className="w-full relative">
        <BKForm
          isViewer={true}
          tempSignature={tempSignature}
          onSignClick={onSignClick}
          initialData={doc}
          currentStep={1}
          runningNumberPreview={doc.doc_number || doc.id}
          onSubmit={() => {}}
          onCancel={() => {}}
          onNext={() => {}}
          onBack={() => {}}
        />
      </div>
    );
  };

  const type = versionId ? "PDF" : resolvedTypePrefix;
  const { user } = useAuth();
  const { showToast } = useToast();
  const canPreview = user?.permissions?.some((p) =>
    [
      "document.preview_document:view",
      "approvals.open_doc_detail:view",
    ].includes(p),
  );
  const canDownload = user?.permissions?.some((p) =>
    [
      "document.download_document:view",
      "submissions.download_document:view",
      "approvals.download_document:view",
    ].includes(p),
  );

  // PDF Renderer
  const renderPDF = () => {
    const docId = doc?.real_id || doc?.id;
    const matchedVersion = doc.versions?.find(
      (v: any) =>
        v.id === versionId || String(v.version_number) === String(versionId),
    );
    const vParam = matchedVersion ? `?v=${matchedVersion.version_number}` : "";
    const fileUrl = versionId
      ? matchedVersion
        ? matchedVersion.download_url ||
          `/api/documents/${docId}/download${vParam}`
        : null
      : doc?.fileUrl || (docId ? `/api/documents/${docId}/download` : null);

    return (
      <div className="bg-slate-200/70 rounded-xl p-4 sm:p-8 border border-slate-200 min-h-[400px] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-t-xl border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-sm">PDF Document Viewer</span>
          </div>
          {docId && canDownload && (
            <button
              type="button"
              onClick={() => {
                downloadDocument(
                  docId,
                  matchedVersion?.version_number,
                  `${doc.doc_number || doc.id}.pdf`,
                ).catch((e) =>
                  showToast(
                    e instanceof Error ? e.message : String(e),
                    "error",
                  ),
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลด (Download)
            </button>
          )}
        </div>
        <div className="flex-1 bg-white rounded-b-xl overflow-hidden relative flex flex-col items-center justify-center">
          {!canPreview ? (
            <p className="p-8 text-slate-500">ไม่มีสิทธิ์พรีวิวเอกสาร</p>
          ) : fileUrl ? (
            <iframe
              src={`${fileUrl}#toolbar=0`}
              className="w-full h-full min-h-[600px] border-none"
              title="PDF Preview"
            />
          ) : (
            <div className="text-center p-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-500">ยังไม่มีไฟล์เอกสารแนบ</p>
              <p className="text-sm mt-1">
                No document file uploaded for this transaction.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={hideHeader ? "" : "space-y-4"}>
      {/* HEADER */}
      {!hideHeader && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Document Content Preview
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              แสดงเนื้อหาแบบฟอร์มเอกสารหรือไฟล์แนบ (Zero-Click Preview)
            </p>
          </div>
        </div>
      )}

      {(!doc._meta || doc._meta.legacy_snapshot) && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          เอกสารรุ่นเดิมอาจไม่มีภาพลายเซ็นหรือข้อมูลต้นฉบับครบถ้วน
          ระบบแสดงเฉพาะข้อมูลที่บันทึกไว้
        </p>
      )}
      {/* CONTENT */}
      {type === "PR"
        ? renderPRForm()
        : type === "PO"
          ? renderPOForm()
          : type === "บันทึก" || type === "BK"
            ? renderBKForm()
            : renderPDF()}
    </div>
  );
}
