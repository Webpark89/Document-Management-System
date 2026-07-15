import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, History, FileText, Download, Check, AlertCircle } from "lucide-react";
import { getDocuments } from "@/features/documents/api";
import { getWorkflow } from "@/features/workflow/api";
import { WorkflowTracker } from "@/components/workflow/WorkflowTracker";
import { DocumentSignerViewer } from "@/components/workflow/DocumentSignerViewer";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getStatusVariant } from "@/lib/document-status";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch documents from Mock API
  const documents = await getDocuments();
  const doc = documents.find((d) => d.id === id);
  const workflow = await getWorkflow(id);

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
    <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <Link
          href="/documents"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
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
                <p className="text-sm font-bold text-slate-800 mt-1">{doc.amount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{doc.version}</p>
              </div>
            </div>

          </div>

          {/* E-SIGNATURE PDF VIEWER (MOCK) */}
          <DocumentSignerViewer 
            documentId={doc.id}
            documentName={doc.name}
            version={doc.version}
            initialStatus={doc.status}
          />
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
  );
}
