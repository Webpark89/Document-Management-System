const fs = require('fs');

['PRForm', 'POForm', 'BKForm'].forEach(f => {
  const file = 'd:/Document Management/dms/client/src/views/components/forms/' + f + '.tsx';
  let c = fs.readFileSync(file, 'utf8');

  // Fix roleName mapping logic (already done? Let's make sure it's done correctly)
  c = c.replace(
    /roleName: s\.role_name \|\| s\.role \|\| "",/g,
    'roleName: s.approver?.role?.name || s.role_name || s.role || "",'
  );

  // Replace the rendering loop
  // I will use split and join!
  const prefix = '{workflowSteps.map((step, idx) => (';
  const parts = c.split(prefix);
  if (parts.length > 1) {
    const before = parts[0];
    const rest = parts[1];
    const endParts = rest.split('))}');
    const innerLoop = endParts[0];
    const after = endParts.slice(1).join('))}');

    const replaceStr = `{workflowSteps.map((step: any, idx: number) => {
                  const isApproved = step.status === 'Approved';
                  const isCurrentStep = step.isCurrentStep;
                  
                  return (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">
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

    c = before + replaceStr + after;
  } else {
    console.log('Not found in ' + file);
  }

  fs.writeFileSync(file, c, 'utf8');
});
