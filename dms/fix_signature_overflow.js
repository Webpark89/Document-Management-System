const fs = require('fs');

['PRForm', 'POForm', 'BKForm'].forEach(f => {
  const file = 'd:/Document Management/dms/client/src/views/components/forms/' + f + '.tsx';
  let c = fs.readFileSync(file, 'utf8');

  // Replace Box 1 (Prepared By)
  const box1Start = '{/* Signatures Placeholder */}';
  const parts = c.split(box1Start);
  if (parts.length > 1) {
    const before = parts[0];
    const rest = parts[1];
    
    // Find where workflowSteps.map starts
    const mapStartStr = '{workflowSteps.map(';
    const box1Parts = rest.split(mapStartStr);
    
    if (box1Parts.length > 1) {
      const box1Content = box1Parts[0];
      const afterMap = mapStartStr + box1Parts.slice(1).join(mapStartStr);

      const newBox1 = `{/* Signatures Placeholder */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">
                    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                      {(() => {
                        const creatorId = initialData?.creator_id || initialData?.creator?.id || user?.id;
                        const creatorSig = initialData?.creator?.signature_url || (creatorId ? \`/api/users/\${creatorId}/signature\` : null);
                        return creatorSig ? (
                          <img src={creatorSig} className="absolute inset-0 w-full h-full object-contain opacity-95 scale-115 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                        ) : (
                          <span className="text-[10px] text-slate-400">(ระบบจะดึงลายเซ็นต์อัตโนมัติ)</span>
                        );
                      })()}
                    </div>
                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white z-10 shrink-0">
                      <p className="font-bold text-slate-900 text-[11px]">ผู้จัดทำ (Prepared By)</p>
                      <p className="text-[10px] text-slate-700 mt-0.5">วันที่ {initialData?.created_at ? formatThaiDate(initialData.created_at) : formatThaiDate(new Date())}</p>
                    </div>
                  </div>
                  `;

      c = before + newBox1 + afterMap;
    }
  }

  // Replace Approvers loop
  const loopStart = '{workflowSteps.map((step: any, idx: number) => {';
  const loopParts = c.split(loopStart);
  if (loopParts.length > 1) {
    const beforeLoop = loopParts[0];
    const restLoop = loopParts[1];
    const endLoopParts = restLoop.split(')})}');
    const afterLoop = endLoopParts.slice(1).join(')})}');

    const loopReplace = `{workflowSteps.map((step: any, idx: number) => {
                  const isApproved = step.status === 'Approved';
                  const isCurrentStep = step.isCurrentStep;
                  const approverId = step.approver_id || step.approver?.id;
                  const sigSrc = step.signature_url || step.approver?.signature_url || (approverId ? \`/api/users/\${approverId}/signature\` : (isCurrentStep && user?.id ? \`/api/users/\${user.id}/signature\` : null));

                  return (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">
                    {isApproved || (isCurrentStep && tempSignature) ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="absolute top-1 left-1.5 text-[7px] font-extrabold text-emerald-600 uppercase tracking-tighter z-10 bg-emerald-50/90 px-1 rounded border border-emerald-200/60 shadow-2xs">Signed & Approved</span>
                        {sigSrc ? (
                          <img src={sigSrc} className="absolute inset-0 w-full h-full object-contain opacity-95 scale-115 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                        ) : (
                          <span className="font-['Brush_Script_MT',cursive,italic] text-base leading-tight text-center px-1 truncate max-w-[90%] text-blue-900">{step.approverName || user?.full_name || "Approver"}</span>
                        )}
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

                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white z-10 shrink-0">
                      <p className="font-bold text-slate-900 text-[11px] truncate px-1" title={step.roleName || \`ผู้อนุมัติลำดับที่ \${idx + 1}\`}>{step.roleName || \`ผู้อนุมัติลำดับที่ \${idx + 1}\`}</p>
                      {(step.approverName) && (
                        <p className="text-[10px] text-blue-600 font-bold leading-tight">{step.approverName}</p>
                      )}
                      <p className="text-[10px] text-slate-700 mt-0.5">
                        วันที่ {isApproved && step.date ? new Date(step.date).toLocaleDateString('th-TH') : (isCurrentStep && tempSignature ? new Date().toLocaleDateString('th-TH') : "____/____/____")}
                      </p>
                    </div>
                  </div>
                )})}`;

    c = beforeLoop + loopReplace + afterLoop;
  }

  fs.writeFileSync(file, c, 'utf8');
});
