"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, History } from "lucide-react";
import { getDocuments } from '@views/features/documents/api';
import type { Document } from '@views/features/documents/types';
import { getWorkflow, WorkflowData } from '@views/features/workflow/api';
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import { Badge } from '@views/components/ui/badge';
import { getStatusVariant } from "@/lib/document-status";
import { WorkflowTracker } from '@views/components/workflow/WorkflowTracker';
import { ApprovalActions } from '@views/components/workflow/ApprovalActions';
import { DocumentSignerViewer } from '@views/components/workflow/DocumentSignerViewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApprovalDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [doc, setDoc] = useState<Document | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaturePlaced, setSignaturePlaced] = useState(false);

  useEffect(() => {
    Promise.all([getDocuments(), getWorkflow(id)]).then(([docs, wf]) => {
      const found = docs.find(
        (d) => d.id === id || (d as any).real_id === id || (d as any).doc_number === id
      );
      setDoc(found || null);
      setWorkflow(wf);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400 font-bold text-sm">
        กำลังโหลดข้อมูลเอกสาร...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center h-[60vh]">
        <div className="p-3 bg-red-50 text-red-600 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Document Not Found</h3>
        <p className="text-sm text-slate-400 font-semibold mt-1">
          The document ID "{id}" could not be located in the database.
        </p>
        <Link
          href="/approvals"
          className="mt-6 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-colors"
        >
          Back to Approvals
        </Link>
      </div>
    );
  }

  const isMonetaryDoc = doc.amount && doc.amount !== "-";

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      <div className="flex justify-between items-center">
        <Link
          href="/approvals"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปยัง Inbox (Back to Approvals)
        </Link>

        <Link
          href={`/documents/${doc.id}/versions`}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <History className="w-4 h-4" />
          Version History
        </Link>
      </div>

      <PageHeader
        size="compact"
        title={`Review: ${doc.id}`}
        subtitle="ตรวจสอบรายละเอียดเอกสารและประทับลายเซ็นเพื่อดำเนินการพิจารณา"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main Info & Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {doc.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Submitted by {doc.sender} on {doc.submittedDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Type
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {doc.type}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </p>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(doc.status)}>
                    {doc.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Valuation
                </p>
                <p
                  className={`text-sm font-bold mt-1 ${
                    isMonetaryDoc ? "text-blue-600 font-mono" : "text-slate-400"
                  }`}
                >
                  {isMonetaryDoc ? doc.amount : "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Version
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-bold text-slate-800">{doc.version}</p>
                  <Link
                    href={`/documents/${doc.id}/versions`}
                    title="View Version History"
                    className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* E-SIGNATURE PDF VIEWER (MOCK) */}
          <DocumentSignerViewer
            documentId={doc.id}
            documentName={doc.name}
            version={doc.version}
            initialStatus={doc.status}
            signaturePlaced={signaturePlaced}
            onSignatureChange={setSignaturePlaced}
          />
        </div>

        {/* RIGHT COLUMN: Workflow Tracker & Action Controls */}
        <div className="space-y-6">
          {workflow ? (
            <WorkflowTracker workflow={workflow} />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm text-center text-slate-500 text-sm">
              ไม่พบข้อมูลสายอนุมัติ
            </div>
          )}

          <ApprovalActions
            documentId={doc.id}
            signaturePlaced={signaturePlaced}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
