"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib";
import { Download, FileText } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import { useSignatures } from '@views/components/providers/SignatureProvider';
import { API_BASE_URL } from '@/lib';
import { formatThaiDate } from '@/lib/format-date';

interface DocumentPreviewProps {
  doc: any;
  hideHeader?: boolean;
  isViewer?: boolean;
  tempSignature?: boolean;
  onSignClick?: () => void;
}

function SignatureDisplay({
  src,
  fallbackName,
  className,
}: {
  src?: string | null;
  fallbackName: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <span className="font-['Brush_Script_MT',cursive,italic] text-xl text-slate-800 text-center leading-tight px-1 truncate max-w-[90%]">
        {fallbackName || "Approver"}
      </span>
    );
  }

  let finalSrc = src;
  if (src.startsWith('/api/')) {
    finalSrc = API_BASE_URL.replace(/\/api\/?$/, '') + src;
  }
  
  const isDataUri = finalSrc.startsWith('data:');

  return (
    <div className="relative inline-flex items-center justify-center overflow-hidden select-none">
      <img
        src={finalSrc}
        alt="signature"
        className={className || "max-h-12 max-w-[90%] object-contain pointer-events-none"}
        {...(!isDataUri ? { crossOrigin: "use-credentials" } : {})}
        onError={(e) => {
          console.error('Signature load error', finalSrc, e);
          setHasError(true);
        }}
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-12deg] opacity-15 text-[8px] font-bold text-rose-500 tracking-tighter uppercase select-none whitespace-nowrap">
        DOCUMENT E-SIGN
      </div>
    </div>
  );
}

export function DocumentPreview({ doc, hideHeader, isViewer, tempSignature, onSignClick }: DocumentPreviewProps) {
  const { user } = useAuth();
  const { signatures, findByApproverName } = useSignatures();

  const [companySettings, setCompanySettings] = useState({
    companyName: "",
    companyAddress: ""
  });

  useEffect(() => {
    api.get<any>("/api/admin/settings").then(res => { if (res.data?.companyName) setCompanySettings(res.data); }).catch(() => {});
  }, []);
  
  const type = doc.type || "OTHER";
  const isApproved = doc.status === "Approved";

  // Attempt to extract approvals from workflow
  const approvals = doc.workflow?.steps?.filter((s: any) => s.status === 'Approved') || [];
  
  const getSignature = (roleOrName: string) => {
    if (approvals.length > 0) {
       const step = approvals.find((s:any) => 
         (s.approver?.role?.name || "").toLowerCase().includes(roleOrName.toLowerCase()) || 
         (s.approver?.first_name || "").toLowerCase().includes(roleOrName.toLowerCase())
       ) || approvals[approvals.length - 1];

       if (step) {
          const approverName = step.approver?.first_name 
            ? `${step.approver.first_name} ${step.approver.last_name}` 
            : step.approver_name || step.approver?.username || "Approver";

          const sigObj = findByApproverName(approverName) || 
            signatures.find(s => s.approverName === approverName || s.imageUrl);

          return {
             name: approverName,
             sig: sigObj,
             date: formatThaiDate(step.actionDate || step.action_date || step.updated_at || doc.submittedDate)
          };
       }
    }
    // Fallback if approved but no workflow step match, or just mock
    if (isApproved) {
       const dummyApprover = doc.sender || user?.full_name || "Administrator";
       return {
          name: dummyApprover,
          sig: findByApproverName(dummyApprover) || signatures.find(s => s.imageUrl) || signatures[0],
          date: formatThaiDate(doc.submittedDate)
       };
    }
    return null;
  };

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
         buyerName: companySettings.companyName,
         buyerAddress: companySettings.companyAddress,
         buyerTaxId: "",
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
         buyerName: companySettings.companyName,
         buyerAddress: companySettings.companyAddress,
         buyerTaxId: "",
      },
      form.items || [],
      grandTotal,
      totalVat,
      doc.department ? `แผนกที่สั่งซื้อ: ${doc.department}` : "-"
    );
  };

  // BK Form Renderer (A4 Style)
  const renderBKForm = () => {
    const creatorSig = {
      name: doc.sender || user?.full_name || "Administrator",
      sig: doc.creator?.signature_url
        ? { imageUrl: doc.creator.signature_url }
        : signatures.find(s => s.imageUrl) || signatures[0],
      date: doc.submittedDate || new Date().toLocaleDateString('th-TH')
    };

    const A4Wrapper = isViewer ? "div" : "div";
    const wrapperClass = isViewer 
      ? "flex justify-center" 
      : "bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200";

    return (
      <A4Wrapper className={wrapperClass}>
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg flex flex-col p-[20mm] text-[14px] text-slate-900 leading-relaxed font-sans relative origin-top mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 border-2 border-slate-800 flex items-center justify-center font-black text-xl text-slate-900 rounded-full">
              ตรา
            </div>
            <h1 className="text-3xl font-bold text-center flex-1 mr-16">บันทึกข้อความ</h1>
          </div>

          <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-x-2 mb-4 items-end">
            <span className="font-bold text-lg">ส่วนราชการ</span>
            <span className="border-b border-dotted border-slate-400 pb-1">{doc.department || "-"}</span>
            <span className="font-bold text-lg ml-4">วันที่</span>
            <span className="border-b border-dotted border-slate-400 pb-1">{doc.submittedDate || new Date().toLocaleDateString('th-TH')}</span>
          </div>

          <div className="grid grid-cols-[60px_1fr] gap-x-2 mb-4 items-end">
            <span className="font-bold text-lg">เรื่อง</span>
            <span className="border-b border-dotted border-slate-400 pb-1">{doc.title || "-"}</span>
          </div>

          <div className="grid grid-cols-[60px_1fr] gap-x-2 mb-8 items-end">
            <span className="font-bold text-lg">เรียน</span>
            <span className="border-b border-dotted border-slate-400 pb-1">ผู้บริหาร / ผู้เกี่ยวข้อง</span>
          </div>

          <div className="flex-1 whitespace-pre-wrap leading-loose indent-10 mt-4">
            {doc.bk_form?.detail || doc.purpose || "ไม่มีรายละเอียด"}
          </div>

          {/* Signatures */}
          <div className="mt-12 flex justify-end">
            <div className="flex flex-col items-center w-64">
              <div className="h-20 w-full flex items-center justify-center border-b border-dotted border-slate-400 mb-2 relative">
                <SignatureDisplay 
                  src={creatorSig.sig?.imageUrl || (doc.creator?.id ? `/api/users/${doc.creator.id}/signature` : null)} 
                  fallbackName={creatorSig.name}
                  className="max-h-16 max-w-full object-contain"
                />
              </div>
              <div className="text-center w-full">
                <p className="font-bold">( {creatorSig.name} )</p>
                <p className="text-sm mt-1">{doc.department || "ผู้จัดทำ"}</p>
              </div>
            </div>
          </div>
          
          {doc.workflow?.steps && doc.workflow.steps.length > 0 ? (
            <div className="mt-12 pt-8 border-t border-slate-200">
               <h3 className="font-bold mb-6 text-center text-slate-800">ความเห็นและคำสั่ง</h3>
               <div className="grid grid-cols-2 gap-8">
                 {doc.workflow.steps.map((step: any, idx: number) => {
                    const isStepApproved = step.status === "Approved";
                    const isCurrentStep = step.step_order === doc.workflow?.current_step;
                    
                    let approverName = step.approver ? `${step.approver.first_name} ${step.approver.last_name}` : (step.approver_name || "Approver");
                    if ((!approverName || approverName === "ยังไม่ระบุตัวบุคคล") && isCurrentStep && user) {
                      approverName = user.full_name || user.username || "Approver";
                    }

                    const roleLabel = step.role || step.role_name || step.approver_role || step.approver?.role?.name || `ผู้อนุมัติ ลำดับที่ ${step.step_order || idx + 1}`;
                    const sigObj = findByApproverName(approverName) || signatures.find(s => s.approverName === approverName || s.imageUrl);
                    const stepSigUrl = step.signature_url || step.approver?.signature_url || (step.approver?.id ? `/api/users/${step.approver.id}/signature` : null) || sigObj?.imageUrl;
                    const stepDate = step.actionDate || step.action_date || (step.updated_at ? new Date(step.updated_at).toLocaleDateString('th-TH') : "");
                    const currentUserSigUrl = user?.signature_url || (user?.id ? `/api/users/${user.id}/signature` : null);

                    return (
                      <div key={step.id || idx} className="flex flex-col items-center border border-slate-300 p-4 rounded-xl relative bg-white">
                        <div className="w-full text-left mb-6 text-slate-600 font-bold text-xs">
                          ความเห็น: {isStepApproved ? <span className="text-emerald-600 font-normal">อนุมัติ / เห็นชอบ</span> : isCurrentStep && tempSignature ? <span className="text-blue-600 font-normal">อนุมัติ / เห็นชอบ (ร่าง)</span> : "............................................."}
                        </div>
                        <div className="h-16 w-48 flex items-center justify-center border-b border-dotted border-slate-400 mb-2 relative">
                           {isStepApproved ? (
                              <SignatureDisplay src={stepSigUrl} fallbackName={approverName} className="max-h-12 object-contain" />
                           ) : isCurrentStep && tempSignature ? (
                              <SignatureDisplay src={currentUserSigUrl || sigObj?.imageUrl} fallbackName={user?.full_name || user?.username || approverName} className="max-h-12 object-contain" />
                           ) : isCurrentStep && onSignClick ? (
                              <button 
                                type="button"
                                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/60 rounded-lg transition-colors group"
                                onClick={(e) => { e.stopPropagation(); onSignClick(); }}
                              >
                                <span className="text-xs text-blue-600 font-bold group-hover:underline">✍️ คลิกเพื่อวางลายเซ็น</span>
                              </button>
                           ) : (
                              <span className="text-slate-300 text-xs font-semibold">ยังไม่อนุมัติ</span>
                           )}
                        </div>
                        <p className="font-bold text-slate-800 text-xs">( {approverName} )</p>
                        <p className="text-xs text-slate-500">{roleLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">วันที่ {isStepApproved && stepDate ? formatThaiDate(stepDate) : isCurrentStep && tempSignature ? formatThaiDate(new Date()) : "..../..../...."}</p>
                      </div>
                    );
                 })}
               </div>
            </div>
          ) : (
             <div className="mt-12 pt-8 border-t border-slate-200">
               <h3 className="font-bold mb-6 text-center text-slate-800">ความเห็นและคำสั่ง</h3>
               <div className="flex justify-center">
                 <div className="flex flex-col items-center border border-slate-300 p-4 rounded-xl w-64 bg-white">
                   <div className="w-full text-left mb-6 text-slate-600 font-bold text-xs">
                     ความเห็น: {tempSignature ? <span className="text-blue-600 font-normal">อนุมัติ / เห็นชอบ</span> : "............................................."}
                   </div>
                   <div className="h-16 w-48 flex items-center justify-center border-b border-dotted border-slate-400 mb-2 relative">
                      {tempSignature ? (
                         (() => {
                           const displayName = user?.full_name || user?.username || "";
                           const mySig = findByApproverName(displayName) || signatures.find(s => s.approverName === displayName || s.imageUrl);
                           return mySig?.imageUrl ? (
                             <SignatureDisplay src={mySig.imageUrl} fallbackName={displayName} className="max-h-12 object-contain" />
                           ) : (
                             <span className="font-['Brush_Script_MT',cursive,italic] text-xl text-blue-700">{displayName || "Approver"}</span>
                           );
                         })()
                      ) : onSignClick ? (
                         <button 
                           type="button"
                           className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/60 rounded-lg transition-colors group"
                           onClick={(e) => { e.stopPropagation(); onSignClick(); }}
                         >
                           <span className="text-xs text-blue-600 font-bold group-hover:underline">✍️ คลิกเพื่อวางลายเซ็น</span>
                         </button>
                      ) : (
                         <span className="text-slate-300 text-xs font-semibold">ยังไม่อนุมัติ</span>
                      )}
                   </div>
                   <p className="font-bold text-slate-800 text-xs">( {user?.full_name || user?.username || "ผู้อนุมัติ"} )</p>
                   <p className="text-xs text-slate-500">ผู้อนุมัติ</p>
                   <p className="text-xs text-slate-500 mt-1">วันที่ {tempSignature ? formatThaiDate(new Date()) : "..../..../...."}</p>
                 </div>
               </div>
             </div>
          )}

        </div>
      </A4Wrapper>
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
      sig: doc.creator?.signature_url
        ? { imageUrl: doc.creator.signature_url }
        : signatures.find(s => s.imageUrl) || signatures[0],
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
              <div>
                <h1 className={`font-bold text-lg ${primaryText}`}>{meta.buyerName}</h1>
                <p className="text-slate-700 mt-1 max-w-[200px] leading-tight whitespace-pre-wrap">{meta.buyerAddress}</p>
                {meta.buyerTaxId && <p className="text-slate-700 mt-1 font-semibold">เลขประจำตัวผู้เสียภาษี: {meta.buyerTaxId}</p>}
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

          {/* Signatures (Dynamic based on workflow steps) */}
          {(() => {
            const steps = doc.workflow?.steps || [];
            const hasSteps = steps.length > 0;
            const totalCols = 1 + (hasSteps ? steps.length : 1) + (typeAlias === "PO" ? 1 : 0);
            const gridColClass = 
              totalCols === 2 ? "grid-cols-2" : 
              totalCols === 3 ? "grid-cols-3" : 
              totalCols === 4 ? "grid-cols-4" : 
              "grid-cols-3";

            return (
              <div className={`mt-6 grid ${gridColClass} gap-4 text-center page-break-inside-avoid`}>
                {/* Issuer */}
                <div className="border border-slate-800 p-1 flex flex-col h-28">
                  <div className="flex-1 flex items-center justify-center relative overflow-hidden w-full">
                    {creatorSig.sig?.imageUrl ? (
                      <SignatureDisplay src={creatorSig.sig.imageUrl} fallbackName={creatorSig.name} className="max-h-12 max-w-[90%] object-contain" />
                    ) : (
                      <span className="font-['Brush_Script_MT',cursive,italic] text-xl text-slate-400 text-center leading-tight px-1">{creatorSig.name}</span>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-800 pt-1 shrink-0 text-center bg-white z-10">
                    <p className="font-bold text-slate-900 text-[11px]">ผู้จัดทำ (Prepared By)</p>
                    <p className="text-[10px] text-slate-700 mt-0.5" suppressHydrationWarning>วันที่ {formatThaiDate(creatorSig.date)}</p>
                  </div>
                </div>

                {/* Workflow Steps Approvers */}
                {hasSteps ? (
                  steps.map((step: any, idx: number) => {
                    const isStepApproved = step.status === "Approved";
                    const isCurrentStep = step.step_order === doc.workflow?.current_step;
                    
                    let approverName = step.approver 
                      ? `${step.approver.first_name} ${step.approver.last_name}` 
                      : step.approver_name || step.approver?.username || "Approver";
                    
                    if ((!approverName || approverName === "ยังไม่ระบุตัวบุคคล") && isCurrentStep && user) {
                      approverName = user.full_name || user.username || "Approver";
                    }

                    const sigObj = findByApproverName(approverName) || 
                      signatures.find(s => s.approverName === approverName || s.imageUrl);

                    const stepDate = formatThaiDate(step.actionDate || step.action_date || step.updated_at);
                    const roleLabel = step.role || step.role_name || step.approver_role || step.approver?.role?.name || (steps.length === 1 ? "ผู้อนุมัติ" : `ผู้อนุมัติ ลำดับที่ ${step.step_order || idx + 1}`);

                    const stepSigUrl = step.signature_url || step.approver?.signature_url || (step.approver?.id ? `/api/users/${step.approver.id}/signature` : null) || sigObj?.imageUrl;
                    const currentUserSigUrl = user?.signature_url || (user?.id ? `/api/users/${user.id}/signature` : null);

                    return (
                      <div key={step.id || idx} className="border border-slate-800 p-1 flex flex-col h-28">
                        {isStepApproved ? (
                          <div className="flex-1 flex items-center justify-center relative overflow-hidden w-full">
                            <SignatureDisplay src={stepSigUrl} fallbackName={approverName} className="max-h-12 max-w-[90%] object-contain" />
                          </div>
                        ) : isCurrentStep && tempSignature ? (
                          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                            <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5">Signed & Approved</span>
                            <SignatureDisplay src={currentUserSigUrl || sigObj?.imageUrl} fallbackName={user?.full_name || user?.username || approverName} className="max-h-10 max-w-[90%] object-contain" />
                          </div>
                        ) : isCurrentStep && onSignClick ? (
                          <div 
                            className="flex-1 flex flex-col items-center justify-center w-full cursor-pointer hover:bg-blue-50/50 transition-colors group"
                            onClick={(e) => { e.stopPropagation(); onSignClick(); }}
                          >
                            <p className="text-[10px] text-blue-500 font-bold group-hover:underline text-center px-2">คลิกเพื่อวางลายเซ็น<br/><span className="text-[8px] font-normal text-slate-400">(Click to Sign)</span></p>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center w-full">
                            <span className="text-slate-400 font-bold text-xs">ยังไม่อนุมัติ</span>
                          </div>
                        )}

                        <div className="w-full border-t border-slate-800 pt-1 shrink-0 text-center bg-white z-10">
                          <p className="font-bold text-slate-900 text-[11px] truncate" title={roleLabel}>{roleLabel}</p>
                          <p className="text-[10px] text-slate-700 mt-0.5" suppressHydrationWarning>
                            วันที่ {isStepApproved ? stepDate : isCurrentStep && tempSignature ? formatThaiDate(new Date()) : "____/____/____"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Fallback Single Approver */
                  <div className="border border-slate-800 p-1 flex flex-col h-28">
                    {approverSig ? (
                      <div className="flex-1 flex items-center justify-center relative overflow-hidden w-full">
                        {approverSig.sig?.imageUrl ? (
                          <SignatureDisplay src={approverSig.sig.imageUrl} fallbackName={approverSig.name} className="max-h-12 max-w-[90%] object-contain" />
                        ) : (
                          <span className={`font-['Brush_Script_MT',cursive,italic] text-xl text-center leading-tight px-1 ${primaryText}`}>{approverSig.name}</span>
                        )}
                      </div>
                    ) : tempSignature ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="text-[8px] font-extrabold text-emerald-600 uppercase text-center leading-none mb-0.5">Signed & Approved</span>
                        {(() => {
                          const displayName = user?.full_name || user?.username || "";
                          const mySig = findByApproverName(displayName) || signatures.find(s => s.approverName === displayName || s.imageUrl);
                          return mySig?.imageUrl ? (
                            <SignatureDisplay src={mySig.imageUrl} fallbackName={displayName} className="max-h-10 max-w-[90%] object-contain" />
                          ) : (
                            <span className={`font-['Brush_Script_MT',cursive,italic] text-sm leading-tight text-center px-1 truncate max-w-[90%] ${primaryText}`}>{displayName || "Approver"}</span>
                          );
                        })()}
                      </div>
                    ) : onSignClick ? (
                      <div 
                        className="flex-1 flex flex-col items-center justify-center w-full cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        onClick={(e) => { e.stopPropagation(); onSignClick(); }}
                      >
                        <p className="text-[10px] text-blue-500 font-bold group-hover:underline text-center px-2">คลิกเพื่อวางลายเซ็น<br/><span className="text-[8px] font-normal text-slate-400">(Click to Sign)</span></p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center w-full">
                        <span className="text-slate-400 font-bold text-xs">ยังไม่อนุมัติ</span>
                      </div>
                    )}
                    
                    <div className="w-full border-t border-slate-800 pt-1 shrink-0 text-center bg-white z-10">
                      <p className="font-bold text-slate-900 text-[11px]">ผู้อนุมัติ (Authorized By)</p>
                      <p className="text-[10px] text-slate-700 mt-0.5" suppressHydrationWarning>วันที่ {approverSig ? formatThaiDate(approverSig.date) : tempSignature ? formatThaiDate(new Date()) : "____/____/____"}</p>
                    </div>
                  </div>
                )}

                {/* Vendor Accept (if PO) */}
                {typeAlias === "PO" && (
                  <div className="border border-slate-800 p-1 flex flex-col h-28">
                    <div className="flex-1 w-full"></div>
                    <div className="w-full border-t border-slate-800 pt-1 shrink-0 text-center bg-white z-10">
                      <p className="font-bold text-slate-900 text-[11px]">ผู้ขายรับสั่งซื้อ (Accepted By)</p>
                      <p className="text-[10px] text-slate-700 mt-0.5">วันที่ ____/____/____</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
      {type === "PR" ? renderPRForm() : type === "PO" ? renderPOForm() : (type === "บันทึก" || type === "BK") ? renderBKForm() : renderPDF()}
    </div>
  );
}
