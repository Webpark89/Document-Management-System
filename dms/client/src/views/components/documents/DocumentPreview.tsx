"use client";

import React from "react";
import { Download, FileText } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import { useSignatures } from '@views/components/providers/SignatureProvider';

interface DocumentPreviewProps {
  doc: any;
  hideHeader?: boolean;
  isViewer?: boolean;
  tempSignature?: boolean;
  onSignClick?: () => void;
}

export function DocumentPreview({ doc, hideHeader, isViewer, tempSignature, onSignClick }: DocumentPreviewProps) {
  const { user } = useAuth();
  const { signatures, findByApproverName } = useSignatures();
  
  const type = doc.type || "OTHER";
  const isApproved = doc.status === "Approved";

  // Attempt to extract approvals from workflow
  const approvals = doc.workflow?.steps?.filter((s: any) => s.status === 'Approved') || [];
  
  const getSignature = (roleOrName: string) => {
    if (approvals.length > 0) {
       const step = approvals.find((s:any) => 
         (s.approver?.role?.name || "").includes(roleOrName) || 
         (s.approver?.first_name || "").includes(roleOrName)
       );
       if (step) {
          const approverName = step.approver?.first_name 
            ? `${step.approver.first_name} ${step.approver.last_name}` 
            : step.approver?.username || "Approver";
          return {
             name: approverName,
             sig: findByApproverName(approverName) || signatures[0],
             date: step.updated_at ? new Date(step.updated_at).toLocaleDateString('th-TH') : doc.submittedDate
          }
       }
    }
    // Fallback if approved but no workflow step match, or just mock
    if (isApproved) {
       const dummyApprover = doc.sender || user?.full_name || "Administrator";
       return {
          name: dummyApprover,
          sig: findByApproverName(dummyApprover) || signatures[0],
          date: doc.submittedDate
       }
    }
    return null;
  }

  // PR Form Renderer (A4 Style)
  const renderPRForm = () => {
    const form = doc.pr_form;
    if (!form) return <div className="text-center p-8 text-slate-500">ไม่พบข้อมูล PR Form</div>;
    
    return renderA4Template(
      "ใบขออนุมัติจัดซื้อ/จัดจ้าง",
      "PURCHASE REQUEST",
      "PR",
      {
         vendorName: "-",
         vendorContact: "-",
         buyerName: "บริษัท นิสซุย (ประเทศไทย) จำกัด",
         buyerAddress: "เลขที่ 123 อาคารนิสซุย ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
         buyerTaxId: "0105559000123",
      },
      form.items || [],
      form.total_amount,
      0, // PR usually has no VAT in the request stage
      form.purpose
    );
  };

  // PO Form Renderer (A4 Style)
  const renderPOForm = () => {
    const form = doc.po_form;
    if (!form) return <div className="text-center p-8 text-slate-500">ไม่พบข้อมูล PO Form</div>;
    
    // Calculate total VAT if it exists in items, else assume 7% on total
    let totalVat = 0;
    let preTaxAmount = 0;
    (form.items || []).forEach((item: any) => {
       const vatRate = item.vat || 7; // default 7% if not specified but PO should have it
       // In this simple model, total_price might include VAT or not depending on how it was saved.
       // Let's calculate backwards if needed, or assume unit_price is pre-tax
       const itemPreTax = Number(item.quantity) * Number(item.unit_price);
       preTaxAmount += itemPreTax;
       totalVat += itemPreTax * (vatRate / 100);
     });

    // If backend already calculated total_amount including VAT, we use it.
    const grandTotal = Number(form.total_amount);
    
    // Adjust if preTaxAmount + totalVat doesn't match grandTotal perfectly
    if (Math.abs((preTaxAmount + totalVat) - grandTotal) > 1) {
       preTaxAmount = grandTotal / 1.07;
       totalVat = grandTotal - preTaxAmount;
    }

    return renderA4Template(
      "ใบสั่งซื้อ",
      "PURCHASE ORDER",
      "PO",
      {
         vendorName: form.vendor_name || "บริษัท คู่ค้า จำกัด",
         vendorContact: "-",
         buyerName: "บริษัท นิสซุย (ประเทศไทย) จำกัด",
         buyerAddress: "เลขที่ 123 อาคารนิสซุย ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
         buyerTaxId: "0105559000123",
      },
      form.items || [],
      grandTotal,
      totalVat,
      doc.department ? `แผนกที่สั่งซื้อ: ${doc.department}` : "-"
    );
  };

  const renderA4Template = (
    titleTH: string, 
    titleEN: string, 
    typeAlias: string, 
    meta: any, 
    items: any[], 
    grandTotal: number, 
    vatAmount: number, 
    remark: string
  ) => {
    const preTaxAmount = grandTotal - vatAmount;
    
    const approverSig = getSignature("Approver");
    const creatorSig = {
      name: doc.sender,
      sig: signatures.find(s => s.imageUrl) || signatures[0],
      date: doc.submittedDate
    };

    // Color Theme Logic based on document type
    const isPO = typeAlias === "PO";
    
    // Industrial Standard formal borders and colors
    const primaryText = isPO ? "text-purple-900" : "text-blue-900";
    const primaryBorder = isPO ? "border-purple-800" : "border-blue-800";
    const primaryBg = isPO ? "bg-purple-800 text-white" : "bg-blue-800 text-white";
    const primaryBgLight = isPO ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900";
    const primaryBgFaint = isPO ? "bg-purple-50" : "bg-blue-50";

    const A4Wrapper = isViewer ? "div" : "div";
    const wrapperClass = isViewer 
      ? "flex justify-center" 
      : "bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200";

    return (
      <A4Wrapper className={wrapperClass}>
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg flex flex-col p-[12mm] text-[12px] text-slate-800 leading-snug font-sans relative origin-top">
          
          {/* Header Block (Industrial Style) */}
          <div className={`flex justify-between items-start border-b-2 ${primaryBorder} pb-4 mb-4`}>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 border-2 ${primaryBorder} flex items-center justify-center font-black text-xl ${primaryText}`}>
                LOGO
              </div>
              <div>
                <h1 className={`font-bold text-lg ${primaryText}`}>{meta.buyerName}</h1>
                <p className="text-slate-700 mt-1 max-w-[200px] leading-tight">{meta.buyerAddress}</p>
                <p className="text-slate-700 mt-1 font-semibold">เลขประจำตัวผู้เสียภาษี: {meta.buyerTaxId}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className={`border-2 ${primaryBorder} px-4 py-2 mb-2 text-center w-64 ${primaryBgLight}`}>
                 <h2 className="text-xl font-black">{titleTH}</h2>
                 <p className="text-xs font-bold uppercase">{titleEN}</p>
              </div>
              
              <table className="border-collapse border border-slate-800 text-left text-[11px] w-64">
                <tbody>
                  <tr>
                    <th className={`border border-slate-800 px-2 py-1 ${primaryBgFaint} font-bold w-1/3`}>เลขที่ / No.</th>
                    <td className="border border-slate-800 px-2 py-1 font-bold text-slate-900 text-center">{doc.id}</td>
                  </tr>
                  <tr>
                    <th className={`border border-slate-800 px-2 py-1 ${primaryBgFaint} font-bold`}>วันที่ / Date</th>
                    <td className="border border-slate-800 px-2 py-1 text-center">{doc.submittedDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Parties Info */}
          {typeAlias === "PR" ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div className="border border-slate-800 p-2">
                  <p className={`font-bold border-b border-slate-800 pb-1 mb-2 ${primaryText}`}>ผู้เสนอขอจัดซื้อ / Requester</p>
                  <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                    <span className="text-slate-600 font-bold">ชื่อ / Name:</span>
                    <span className="font-bold text-slate-900">{doc.sender}</span>
                    <span className="text-slate-600 font-bold">แผนก / Dept:</span>
                    <span className="font-bold text-slate-900">{doc.department || "-"}</span>
                  </div>
               </div>
               <div className="border border-slate-800 p-2">
                  <p className={`font-bold border-b border-slate-800 pb-1 mb-2 ${primaryText}`}>วัตถุประสงค์ / Purpose</p>
                  <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                    <span className="text-slate-600 font-bold">วัตถุประสงค์:</span>
                    <span className="font-semibold text-slate-900 whitespace-pre-wrap">{doc.pr_form?.purpose || "-"}</span>
                    <span className="text-slate-600 font-bold">วันที่ต้องการ:</span>
                    <span className="font-bold text-slate-900">
                      {doc.pr_form?.required_date 
                        ? new Date(doc.pr_form.required_date).toLocaleDateString('th-TH') 
                        : "ตามที่ระบุในรายการ"}
                    </span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div className="border border-slate-800 p-2">
                  <p className={`font-bold border-b border-slate-800 pb-1 mb-2 ${primaryText}`}>ผู้ขาย / Vendor</p>
                  <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-[11px]">
                    <span className="text-slate-600 font-bold">ชื่อบริษัท:</span>
                    <span className="font-bold text-slate-900">{meta.vendorName}</span>
                    <span className="text-slate-600 font-bold">ที่อยู่:</span>
                    <span className="leading-tight">{meta.vendorContact === "-" ? "ไม่ระบุ" : meta.vendorContact}</span>
                  </div>
               </div>
               <div className="border border-slate-800 p-2">
                  <p className={`font-bold border-b border-slate-800 pb-1 mb-2 ${primaryText}`}>จัดส่งถึง / Ship To</p>
                  <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-[11px]">
                    <span className="text-slate-600 font-bold">ชื่อบริษัท:</span>
                    <span className="font-bold text-slate-900">{meta.buyerName}</span>
                    <span className="text-slate-600 font-bold">ที่อยู่:</span>
                    <span className="leading-tight">{meta.buyerAddress}</span>
                  </div>
               </div>
            </div>
          )}

          {/* Items Table - Strict Borders */}
          <div className="flex-1">
            <table className="w-full border-collapse border-2 border-slate-800">
              <thead>
                <tr className={`${primaryBgLight} border-b-2 border-slate-800 ${primaryText}`}>
                  <th className="border-r border-slate-800 py-2 px-2 text-center w-12 font-bold">ลำดับ<br/><span className="text-[9px] font-normal">No.</span></th>
                  <th className="border-r border-slate-800 py-2 px-2 text-center font-bold">รายการ<br/><span className="text-[9px] font-normal">Description</span></th>
                  <th className="border-r border-slate-800 py-2 px-2 text-center w-20 font-bold">จำนวน<br/><span className="text-[9px] font-normal">Qty</span></th>
                  <th className="border-r border-slate-800 py-2 px-2 text-center w-24 font-bold">ราคา/หน่วย<br/><span className="text-[9px] font-normal">Unit Price</span></th>
                  {typeAlias === "PO" && (
                    <th className="border-r border-slate-800 py-2 px-2 text-center w-16 font-bold">VAT<br/><span className="text-[9px] font-normal">%</span></th>
                  )}
                  <th className="py-2 px-2 text-center w-28 font-bold">จำนวนเงิน<br/><span className="text-[9px] font-normal">Amount</span></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                   <tr>
                     <td colSpan={typeAlias === "PO" ? 6 : 5} className="py-8 text-center text-slate-400">ไม่มีรายการ</td>
                   </tr>
                ) : (
                  items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-400">
                      <td className="border-r border-slate-800 py-2 px-2 text-center align-top">{idx + 1}</td>
                      <td className="border-r border-slate-800 py-2 px-2 align-top font-bold text-slate-900">{item.item_name}</td>
                      <td className="border-r border-slate-800 py-2 px-2 text-center align-top">{item.quantity} {item.unit || "ชิ้น"}</td>
                      <td className="border-r border-slate-800 py-2 px-2 text-right align-top">{Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      {typeAlias === "PO" && (
                        <td className="border-r border-slate-800 py-2 px-2 text-center align-top">{item.vat || 7}%</td>
                      )}
                      <td className="py-2 px-2 text-right align-top font-bold text-slate-900">
                        {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Totals */}
          <div className="mt-4 grid grid-cols-[1fr_auto] border-2 border-slate-800 items-stretch">
             <div className="p-3 border-r-2 border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900">หมายเหตุ / Remarks:</span>
                  <p className="mt-1 text-slate-700 whitespace-pre-wrap text-[11px]">{remark || "-"}</p>
                </div>
             </div>
             <div className="w-[200px]">
                <div className="grid grid-cols-[100px_1fr] p-2 border-b border-slate-800">
                  <span className="font-bold text-[11px]">รวมเป็นเงิน<br/><span className="text-[9px] font-normal">Subtotal</span></span>
                  <span className="text-right font-bold self-center">{preTaxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                {typeAlias === "PO" && (
                  <div className="grid grid-cols-[100px_1fr] p-2 border-b border-slate-800">
                    <span className="font-bold text-[11px]">ภาษีมูลค่าเพิ่ม<br/><span className="text-[9px] font-normal">VAT 7%</span></span>
                    <span className="text-right font-bold self-center">{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className={`grid grid-cols-[100px_1fr] p-2 ${primaryBg} font-bold`}>
                  <span>ยอดสุทธิ<br/><span className="text-[9px] font-normal">Grand Total</span></span>
                  <span className="text-right self-center">{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>

          {/* Signatures */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {/* Issuer */}
            <div className="border border-slate-800 p-2 flex flex-col items-center justify-end h-28 relative">
              {creatorSig.sig?.imageUrl ? (
                <img src={creatorSig.sig.imageUrl} className="max-h-10 object-contain mb-1 absolute top-2" alt="signature" />
              ) : (
                <span className="font-['Brush_Script_MT',cursive,italic] text-2xl text-slate-400 absolute top-4">{creatorSig.name}</span>
              )}
              <div className="w-full border-t border-slate-800 pt-1">
                <p className="font-bold text-slate-900 text-[11px]">ผู้จัดทำ (Prepared By)</p>
                <p className="text-[10px] text-slate-700 mt-0.5">วันที่ {creatorSig.date}</p>
              </div>
            </div>

            {/* Approver */}
            <div className="border border-slate-800 p-2 flex flex-col items-center justify-end h-28 relative">
              {approverSig ? (
                 <>
                  {approverSig.sig?.imageUrl ? (
                    <img src={approverSig.sig.imageUrl} className="max-h-10 object-contain mb-1 absolute top-2" alt="signature" />
                  ) : (
                    <span className={`font-['Brush_Script_MT',cursive,italic] text-2xl absolute top-4 ${primaryText}`}>{approverSig.name}</span>
                  )}
                 </>
              ) : tempSignature ? (
                 <div className="absolute top-1 left-0 right-0 h-16 flex flex-col items-center justify-center z-10 bg-white/50">
                    <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5">Signed & Approved</span>
                    {(() => {
                      const displayName = user?.full_name || user?.username || "";
                      const mySig = findByApproverName(displayName) || signatures.find(s => s.approverName === displayName || s.imageUrl);
                      return mySig?.imageUrl ? (
                        <img src={mySig.imageUrl} className="max-h-10 object-contain mb-1" alt="signature" />
                      ) : (
                        <span className={`font-['Brush_Script_MT',cursive,italic] text-sm leading-none truncate max-w-[90%] ${primaryText}`}>{displayName || "Approver"}</span>
                      );
                    })()}
                 </div>
              ) : onSignClick ? (
                 <div 
                   className="absolute top-1 left-0 right-0 h-16 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors z-10 group"
                   onClick={(e) => { e.stopPropagation(); onSignClick(); }}
                 >
                   <p className="text-[10px] text-blue-500 font-bold group-hover:underline text-center px-2">คลิกเพื่อวางลายเซ็น<br/><span className="text-[8px] font-normal text-slate-400">(Click to Sign)</span></p>
                 </div>
              ) : (
                <span className="text-slate-400 font-bold absolute top-6">ยังไม่อนุมัติ</span>
              )}
              <div className="w-full border-t border-slate-800 pt-1">
                <p className="font-bold text-slate-900 text-[11px]">ผู้อนุมัติ (Authorized By)</p>
                <p className="text-[10px] text-slate-700 mt-0.5">วันที่ {approverSig ? approverSig.date : tempSignature ? new Date().toLocaleDateString("th-TH") : "____/____/____"}</p>
              </div>
            </div>

            {/* Vendor Accept (if PO) */}
            {typeAlias === "PO" ? (
               <div className="border border-slate-800 p-2 flex flex-col items-center justify-end h-28 relative">
                 <div className="w-full border-t border-slate-800 pt-1">
                   <p className="font-bold text-slate-900 text-[11px]">ผู้ขายรับสั่งซื้อ (Accepted By)</p>
                   <p className="text-[10px] text-slate-700 mt-0.5">วันที่ ____/____/____</p>
                 </div>
               </div>
            ) : (
               <div className="border border-white p-2" />
            )}
            
          </div>

        </div>
      </A4Wrapper>
    );
  };

  // PDF Renderer
  const renderPDF = () => {
    // Fallback to local mock PDF for testing
    const fileUrl = doc.versions?.[0]?.file_path || "/mock.pdf";
    
    return (
      <div className="bg-slate-200/70 rounded-xl p-4 sm:p-8 border border-slate-200 min-h-[400px] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-t-xl border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-sm">PDF Document Viewer</span>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Open / Download
            </a>
          )}
        </div>
        <div className="flex-1 bg-white rounded-b-xl overflow-hidden relative flex flex-col items-center justify-center">
          {fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0`} 
              className="w-full h-full min-h-[600px] border-none"
              title="PDF Preview"
            />
          ) : (
            <div className="text-center p-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-500">ยังไม่มีไฟล์เอกสารแนบ</p>
              <p className="text-sm mt-1">No document file uploaded for this transaction.</p>
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

      {/* CONTENT */}
      {type === "PR" ? renderPRForm() : type === "PO" ? renderPOForm() : renderPDF()}
    </div>
  );
}
