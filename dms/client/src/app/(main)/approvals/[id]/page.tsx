"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, History } from "lucide-react";
import { getDocumentById } from '@views/features/documents/api';
import type { Document } from '@views/features/documents/types';
import { getWorkflow, WorkflowData } from '@views/features/workflow/api';
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';
import { Badge } from '@views/components/ui/badge';
import { getStatusVariant } from "@/lib/document-status";
import { WorkflowTracker } from '@views/components/workflow/WorkflowTracker';
import { ApprovalActions } from '@views/components/workflow/ApprovalActions';
import { DocumentSignerViewer } from '@views/components/workflow/DocumentSignerViewer';

import { useAuth } from "@views/components/providers/AuthProvider";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApprovalDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [doc, setDoc] = useState<Document | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaturePlaced, setSignaturePlaced] = useState(false);

  useEffect(() => {
    Promise.all([getDocumentById(id), getWorkflow(id)]).then(([found, wf]) => {
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
        <div className="p-4 bg-red-50 text-red-600 rounded-full mb-5 ring-8 ring-red-50/50">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่พบเอกสาร หรือไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
          ไม่สามารถแสดงรายละเอียดของเอกสาร <span className="font-bold text-slate-700">{id}</span> ได้
          อาจเป็นไปได้ว่าเอกสารถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์ในการเข้าถึงเอกสารฉบับนี้
        </p>
        <Link
          href="/approvals"
          className="mt-8 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
        >
          กลับไปยังหน้ารายการอนุมัติ
        </Link>
      </div>
    );
  }

  const hasPerm = (itemKey: string, action: string = 'view') =>
    !!user?.permissions?.includes(`approvals.${itemKey}:${action}`);

  const isMonetaryDoc = doc.amount && doc.amount !== "-";

  // Find active step in workflow
  const currentStepObj = workflow?.steps.find(
    (s) => s.stepOrder === workflow.currentStep && s.status === "Pending"
  );
  const activeApproverName = currentStepObj?.approverName || currentStepObj?.roleName || "ผู้อนุมัติประจำขั้นตอน";

  // Check if current user has permission to approve this step (business logic)
  const isAssignedApprover = (() => {
    if (!doc || doc.status !== "Pending" || !workflow || workflow.status !== "Pending" || !currentStepObj) {
      return false;
    }
    if (!user) return false;

    // Direct ID match
    if (currentStepObj.approverId && currentStepObj.approverId === user.id) return true;

    // Role match
    if (currentStepObj.roleName && user.role && currentStepObj.roleName.toLowerCase() === user.role.toLowerCase()) {
      return true;
    }

    // Name match fallback
    if (user.full_name && currentStepObj.approverName && currentStepObj.approverName.toLowerCase().includes(user.full_name.toLowerCase())) {
      return true;
    }
    if (user.username && currentStepObj.approverName && currentStepObj.approverName.toLowerCase().includes(user.username.toLowerCase())) {
      return true;
    }

    return false;
  })();

  // Final permission gates (permission key AND business logic combined)
  const canApprove = isAssignedApprover && hasPerm('approve_document', 'approve');
  const canReject  = isAssignedApprover && hasPerm('reject_document', 'approve');
  const canReturn  = isAssignedApprover && hasPerm('return_document', 'approve');
  const canSign    = isAssignedApprover && hasPerm('place_signature', 'approve');
  const canComment = hasPerm('add_comment', 'edit');

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

          {/* E-SIGNATURE PDF VIEWER */}
          <DocumentSignerViewer
            documentId={doc.id}
            documentName={doc.name}
            version={doc.version}
            initialStatus={doc.status}
            signaturePlaced={signaturePlaced}
            onSignatureChange={setSignaturePlaced}
            doc={doc}
            canSign={canSign}
            activeApproverName={activeApproverName}
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
            canApprove={canApprove}
            canReject={canReject}
            canReturn={canReturn}
            canComment={canComment}
            activeApproverName={activeApproverName}
            currentStep={workflow?.currentStep || 1}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
