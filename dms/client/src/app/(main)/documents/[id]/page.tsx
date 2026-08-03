"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, History, FileText, Download, Check, AlertCircle } from "lucide-react";
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
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
        Loading document details...
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
          href="/documents"
          className="mt-6 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-colors"
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
          <ResubmitButton
            documentId={doc.id}
            docStatus={doc.status}
            onSuccess={() => {
              setDoc((prev: any) => ({ ...prev, status: "Pending" }));
            }}
          />
          <CancelDocumentButton document={doc} />
          
          <Link
            href={`/documents/${doc.id}/versions`}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            Version History
          </Link>
        </div>
      </div>

      <PageHeader
        size="compact"
        title={`Document: ${doc.id}`}
        subtitle="Review document properties, transaction metadata, and workflow logs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm space-y-6">
            
            <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{doc.name}</h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Submitted by {doc.sender} on {doc.submittedDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{doc.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valuation</p>
                <p className={`text-sm font-bold mt-1 ${doc.amount && doc.amount !== "-" ? "text-blue-600 font-mono" : "text-slate-400"}`}>
                  {doc.amount && doc.amount !== "-" ? doc.amount : "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</p>
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

          {/* DOCUMENT PREVIEW */}
          <DocumentPreview doc={doc} />
        </div>

        {/* RIGHT COLUMN: Activity/Workflow */}
        <div className="space-y-6">
          {workflow ? (
            <WorkflowTracker workflow={workflow} />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm text-center text-slate-500 text-sm">
              ไม่พบข้อมูลสายอนุมัติ
            </div>
          )}
        </div>

      </div>

      </div>
    </div>
  );
}
