"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, FileText, AlertCircle } from "lucide-react";
import { getDocumentById } from '@views/features/documents/api';
import { getWorkflow } from '@views/features/workflow/api';
import { WorkflowTracker } from '@views/components/workflow/WorkflowTracker';
import { DocumentPreview } from '@views/components/documents/DocumentPreview';
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import { Badge } from '@views/components/ui/badge';
import { getStatusVariant } from "@/lib/document-status";
import { CancelDocumentButton } from '@views/components/documents/CancelDocumentButton';
import { ResubmitButton } from '@views/components/documents/ResubmitButton';
import { useAuth } from '@views/components/providers/AuthProvider';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const hasPerm = (itemKey: string, action: string = 'view') =>
    !!user?.permissions?.includes(`document.${itemKey}:${action}`);
  const [doc, setDoc] = useState<any>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDocumentById(id), getWorkflow(id)]).then(([d, w]) => {
      setDoc(d);
      setWorkflow(w);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[60vh] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-xs font-semibold">กำลังโหลดข้อมูลเอกสาร...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-[60vh] text-slate-500">
        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm font-bold text-slate-700">ไม่พบเอกสารนี้</p>
        <Link
          href="/documents"
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      <div className="flex justify-between items-center">
        <Link
          href="/documents"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>

        <div className="flex items-center gap-3">
          {hasPerm('edit_document', 'edit') && (doc.status === "Pending" || doc.status === "Returned" || doc.status === "Draft" || doc.status === "Rejected") && (
            <Link
              href={`/submissions/create?edit=${doc.id}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              ✏️ แก้ไขเอกสาร (Edit Document)
            </Link>
          )}

          {hasPerm('submit_document', 'create') && (
            <ResubmitButton
              documentId={doc.id}
              docStatus={doc.status}
              onSuccess={() => {
                setDoc((prev: any) => ({ ...prev, status: "Pending" }));
              }}
            />
          )}
          {hasPerm('recall_document', 'edit') && (
            <CancelDocumentButton document={doc} />
          )}
          
          {hasPerm('view_version_history') && (
            <Link
              href={`/documents/${doc.id}/versions`}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4" />
              Version History
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title={`Document: ${doc.doc_number || doc.id}`}
        subtitle="Review document properties, transaction metadata, and workflow logs."
      />

      {/* 2 COLUMNS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Metadata + Viewer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Card */}
          {hasPerm('view_detail') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{doc.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted by {doc.creator?.full_name || doc.creator?.username || doc.creator_id} on{" "}
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Type</span>
                <span className="text-xs font-bold text-slate-700">{doc.type?.name || doc.type?.prefix || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <Badge variant={getStatusVariant(doc.status)}>
                  {doc.status}
                </Badge>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Valuation</span>
                <span className="text-xs font-bold text-slate-700">
                  {doc.pr_form?.total_amount ? `฿${Number(doc.pr_form.total_amount).toLocaleString()}` : doc.po_form?.total_amount ? `฿${Number(doc.po_form.total_amount).toLocaleString()}` : "-"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Version</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-700">
                    {doc.versions && doc.versions.length > 0 ? `v${doc.versions[0].version_number}.0` : "v1.0"}
                  </span>
                  {hasPerm('view_version_history') && (
                    <Link href={`/documents/${doc.id}/versions`} className="text-blue-500 hover:text-blue-600">
                      <History className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

          </div>
          )}

          {/* DOCUMENT PREVIEW */}
          {hasPerm('preview_document') && (
            <DocumentPreview
              doc={doc}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Activity/Workflow */}
        <div className="space-y-6">
          {/* EDIT DOCUMENT BUTTON CARD FOR RETURNED / REJECTED / DRAFT / PENDING */}
          {["Returned", "Rejected", "Draft", "Returned for Revision", "Pending"].includes(doc.status) && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">เอกสารต้องการการแก้ไขส่งใหม่</h4>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    เอกสารนี้อยู่ในสถานะ {doc.status} คุณสามารถกดแก้ไขเพื่อปรับปรุงข้อมูลและส่งอนุมัติใหม่ได้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/submissions/create?edit=${doc.id}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                ✏️ แก้ไขเอกสารเพื่อส่งใหม่ (Edit & Resubmit)
              </button>
            </div>
          )}

          {hasPerm('view_timeline') ? (
            workflow ? (
              <WorkflowTracker workflow={workflow} />
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm text-center text-slate-500 text-sm">
                ไม่พบข้อมูลสายอนุมัติ
              </div>
            )
          ) : null}
        </div>

      </div>
      </div>
    </div>
  );
}
