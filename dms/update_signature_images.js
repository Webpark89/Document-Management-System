const fs = require('fs');

['PRForm', 'POForm', 'BKForm'].forEach(f => {
  const file = 'd:/Document Management/dms/client/src/views/components/forms/' + f + '.tsx';
  let c = fs.readFileSync(file, 'utf8');

  // 1. Update loadWorkflow signature_url & approver_id mapping
  c = c.replace(
    /signature_url:\s*s\.approver\?\.signature_url,/g,
    'signature_url: s.signature_url || s.approver?.signature_url || (s.approver?.id ? `/api/users/${s.approver.id}/signature` : (s.approver_id ? `/api/users/${s.approver_id}/signature` : null)), approver_id: s.approver_id || s.approver?.id,'
  );

  // 2. Update Creator Box (Prepared By)
  const creatorBoxSearch = /<div className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">\s*<div className="flex-1 flex items-center justify-center text-\[10px\] text-slate-400">\s*\(.*?\)\s*<\/div>/s;
  
  c = c.replace(
    /<div className="flex-1 flex items-center justify-center text-\[10px\] text-slate-400">\s*\(ผู้ขอซื้อ\)\s*<\/div>/g,
    `<div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 relative">
                  {(() => {
                    const creatorId = initialData?.creator_id || initialData?.creator?.id || user?.id;
                    const creatorSig = initialData?.creator?.signature_url || (creatorId ? \`/api/users/\${creatorId}/signature\` : null);
                    return creatorSig ? (
                      <img src={creatorSig} className="absolute inset-0 w-full h-full object-contain opacity-90 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                    ) : (
                      <span>(ระบบจะดึงลายเซ็นต์อัตโนมัติ)</span>
                    );
                  })()}
                </div>`
  );

  c = c.replace(
    /<div className="flex-1 flex items-center justify-center text-\[10px\] text-slate-400">\s*\(ระบบจะดึงลายเซ็นต์อัตโนมัติ\)\s*<\/div>/g,
    `<div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 relative">
                  {(() => {
                    const creatorId = initialData?.creator_id || initialData?.creator?.id || user?.id;
                    const creatorSig = initialData?.creator?.signature_url || (creatorId ? \`/api/users/\${creatorId}/signature\` : null);
                    return creatorSig ? (
                      <img src={creatorSig} className="absolute inset-0 w-full h-full object-contain opacity-90 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                    ) : (
                      <span>(ระบบจะดึงลายเซ็นต์อัตโนมัติ)</span>
                    );
                  })()}
                </div>`
  );

  // 3. Update Approvers Box loop
  const loopSearch = /\{workflowSteps\.map\(\(step: any, idx: number\) => \{[\s\S]+?\}\)\)\}/;
  
  const loopReplace = `{workflowSteps.map((step: any, idx: number) => {
                  const isApproved = step.status === 'Approved';
                  const isCurrentStep = step.isCurrentStep;
                  const approverId = step.approver_id || step.approver?.id;
                  const sigSrc = step.signature_url || step.approver?.signature_url || (approverId ? \`/api/users/\${approverId}/signature\` : (isCurrentStep && user?.id ? \`/api/users/\${user.id}/signature\` : null));

                  return (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">
                    {isApproved || (isCurrentStep && tempSignature) ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5 z-10">Signed & Approved</span>
                        {sigSrc ? (
                          <img src={sigSrc} className="absolute inset-0 w-full h-full object-contain opacity-90 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                        ) : (
                          <span className="font-['Brush_Script_MT',cursive,italic] text-sm leading-tight text-center px-1 truncate max-w-[90%] text-blue-900">{step.approverName || user?.full_name || "Approver"}</span>
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

                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white z-10">
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

  c = c.replace(loopSearch, loopReplace);

  fs.writeFileSync(file, c, 'utf8');
});
