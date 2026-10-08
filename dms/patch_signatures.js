const fs = require('fs');

function patchForm(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add props (this already worked if it matched, but it might have failed)
  content = content.replace(
    /isViewer\?: boolean;\r?\n\s*\}/,
    'isViewer?: boolean;\n  tempSignature?: boolean;\n  onSignClick?: () => void;\n}'
  );

  // 2. Destructure props
  content = content.replace(
    /isViewer = false\r?\n\}\:/,
    'isViewer = false,\n  tempSignature,\n  onSignClick\n}:'
  );
  
  content = content.replace(
    /isViewer = false\s*\}\:/,
    'isViewer = false, tempSignature, onSignClick }:'
  );

  // 3. Update loadWorkflow
  content = content.replace(
    /async function loadWorkflow\(\) \{[\s\S]+?const workflows = \(await adminService\.getApprovalWorkflowsList\(\)\) as any\[\];/,
    `async function loadWorkflow() {
        if (isViewer && initialData?.workflow?.steps) {
          setWorkflowSteps(initialData.workflow.steps.map((s: any) => ({
            id: String(s.step_order),
            stepOrder: s.step_order,
            roleName: s.role_name || s.role || "",
            approverName: s.approver ? \`\${s.approver.first_name} \${s.approver.last_name}\` : "",
            status: s.status,
            signature_url: s.approver?.signature_url,
            isCurrentStep: s.step_order === initialData.workflow.current_step,
            date: s.approved_at || null,
          })));
          return;
        }
        try {
          const { adminService } = await import("@/controllers/services/admin.service");
          const workflows = (await adminService.getApprovalWorkflowsList()) as any[];`
  );

  // 4. Update the map rendering
  content = content.replace(
    /\{workflowSteps\.map\(\(step, idx\) => \([\s\S]+?\{\/\* Signatures Placeholder \*\/\}/,
    `{/* Signatures Placeholder */}` // Remove to avoid duplicate replacement
  ); // wait, this regex is backwards

  content = content.replace(
    /\{workflowSteps\.map\(\(step, idx\) => \([\s\S]+?\}\)\)\}/,
    `{workflowSteps.map((step: any, idx: number) => {
                  const isApproved = step.status === 'Approved';
                  const isCurrentStep = step.isCurrentStep;
                  
                  return (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28 relative group">
                    {isApproved ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5 z-10">Signed & Approved</span>
                        {step.signature_url && <img src={step.signature_url} className="absolute inset-0 w-full h-full object-contain opacity-80" alt="Signature" />}
                        {!step.signature_url && <span className="font-['Brush_Script_MT',cursive,italic] text-sm leading-tight text-center px-1 truncate max-w-[90%] text-blue-900">{step.approverName || "Approver"}</span>}
                      </div>
                    ) : isCurrentStep && tempSignature ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5 z-10">Signed & Approved</span>
                      </div>
                    ) : isCurrentStep && onSignClick ? (
                      <div 
                        className="flex-1 flex flex-col items-center justify-center w-full cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSignClick(); }}
                      >
                        <p className="text-[10px] text-blue-500 font-bold group-hover:underline text-center px-2">คลิกเพื่อวางลายเซ็น<br/><span className="text-[8px] font-normal text-slate-400">(Click to Sign)</span></p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                        (รออนุมัติตามสายงาน)
                      </div>
                    )}

                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white z-10">
                      <p className="font-bold text-slate-900 text-[11px] truncate px-1" title={step.roleName}>{step.roleName}</p>
                      {(step.approverName) && (
                        <p className="text-[10px] text-blue-600 font-bold leading-tight">{step.approverName}</p>
                      )}
                      <p className="text-[10px] text-slate-700 mt-0.5">
                        วันที่ {isApproved && step.date ? new Date(step.date).toLocaleDateString('th-TH') : (isCurrentStep && tempSignature ? new Date().toLocaleDateString('th-TH') : "____/____/____")}
                      </p>
                    </div>
                  </div>
                )})} `
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

patchForm('d:/Document Management/dms/client/src/views/components/forms/PRForm.tsx');
patchForm('d:/Document Management/dms/client/src/views/components/forms/POForm.tsx');
patchForm('d:/Document Management/dms/client/src/views/components/forms/BKForm.tsx');
