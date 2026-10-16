"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, PenLine } from "lucide-react";
import { usersService } from "@/controllers/services/users.service";
import { DocumentPreview } from "../documents/DocumentPreview";
import type { ApprovalSignatureInput } from "@models";

interface Props {
  documentId: string;
  documentName: string;
  version: string;
  initialStatus: string;
  signaturePlaced: boolean;
  onSignatureChange?: (placed: boolean, input?: ApprovalSignatureInput) => void;
  doc?: unknown;
  canSign?: boolean;
  activeApproverName?: string;
  currentStep?: number;
}
export function DocumentSignerViewer({
  documentId,
  doc,
  canSign = false,
  signaturePlaced,
  onSignatureChange,
  currentStep = 1,
  activeApproverName,
}: Props) {
  const [signature, setSignature] = useState<string | null>(null);
  const [input, setInput] = useState<ApprovalSignatureInput>({
    signature_page: 1,
    signature_width: 120,
    signature_height: 60,
    signature_x: 36 + ((currentStep - 1) % 3) * 170,
    signature_y: 60 + Math.floor((currentStep - 1) / 3) * 90,
    annotation_text: "",
    date_stamp: false,
  });
  const document = doc as
    | {
        real_id?: string;
        type?: string;
        versions?: { version_number: number; file_extension?: string }[];
      }
    | undefined;
  const uploaded =
    !!document &&
    !["PR", "PO", "BK", "MEMO", "บันทึก"].includes(document.type ?? "");
  useEffect(() => {
    if (canSign)
      usersService
        .getMySignatureUrl()
        .then((value) => setSignature(value.url))
        .catch(() => setSignature(null));
  }, [canSign]);
  const change = (patch: Partial<ApprovalSignatureInput>) => {
    const next = { ...input, ...patch };
    setInput(next);
    onSignatureChange?.(signaturePlaced, next);
  };
  const place = () => {
    if (canSign && signature) onSignatureChange?.(true, input);
  };
  const url = `/api/documents/${encodeURIComponent(document?.real_id || documentId)}/download`;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <h3 className="font-bold text-slate-800">เอกสารและลายเซ็นอนุมัติ</h3>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-700 flex items-center gap-2"
        >
          <Download className="size-4" />
          เปิด PDF ฉบับจริง
        </a>
      </div>
      {canSign ? (
        <div className="space-y-3 rounded-xl bg-blue-50 p-4">
          {signature ? (
            <div className="flex gap-4 items-center">
              <img
                src={signature}
                alt="ลายเซ็นของคุณ"
                className="h-14 max-w-40 object-contain"
              />
              <button
                type="button"
                onClick={place}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white flex gap-2 items-center"
              >
                <PenLine className="size-4" />
                {signaturePlaced ? "เลือกลายเซ็นแล้ว" : "ใช้ลายเซ็นนี้อนุมัติ"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-amber-800">
              กรุณา{" "}
              <Link className="underline" href="/profile">
                บันทึกลายเซ็นในโปรไฟล์
              </Link>{" "}
              ก่อนอนุมัติ
            </p>
          )}
          {uploaded && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <label>
                หน้า PDF
                <input
                  aria-label="หน้าลายเซ็น"
                  type="number"
                  min="1"
                  value={input.signature_page}
                  onChange={(e) =>
                    change({ signature_page: Number(e.target.value) })
                  }
                  className="block w-full border rounded-lg p-2 mt-1"
                />
              </label>
              <label>
                X จากซ้าย (point)
                <input
                  aria-label="พิกัด X"
                  type="number"
                  min="0"
                  value={input.signature_x}
                  onChange={(e) =>
                    change({ signature_x: Number(e.target.value) })
                  }
                  className="block w-full border rounded-lg p-2 mt-1"
                />
              </label>
              <label>
                Y จากล่าง (point)
                <input
                  aria-label="พิกัด Y"
                  type="number"
                  min="0"
                  value={input.signature_y}
                  onChange={(e) =>
                    change({ signature_y: Number(e.target.value) })
                  }
                  className="block w-full border rounded-lg p-2 mt-1"
                />
              </label>
            </div>
          )}
          <label className="block text-sm">
            ข้อความที่บันทึกลง PDF
            <textarea
              aria-label="ข้อความบน PDF"
              maxLength={1000}
              value={input.annotation_text}
              onChange={(e) => change({ annotation_text: e.target.value })}
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.date_stamp}
              onChange={(e) => change({ date_stamp: e.target.checked })}
            />
            เพิ่มวันที่และเวลาลงนามลง PDF
          </label>
          <p className="text-xs text-slate-600">
            {uploaded
              ? "ลายเซ็นจะบันทึกบนหน้าและพิกัดที่ระบุเมื่อกดอนุมัติ"
              : "ลายเซ็นจะลงในช่องของผู้อนุมัติขั้นปัจจุบัน และบันทึกเป็น PDF version ใหม่"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          ดูเอกสาร:{" "}
          {activeApproverName
            ? `รอ ${activeApproverName}`
            : "ยังไม่ถึงขั้นของคุณ"}
        </p>
      )}
      {uploaded ? (
        <iframe
          src={url}
          title="PDF สำหรับอนุมัติ"
          className="h-[650px] w-full border rounded-lg"
        />
      ) : (
        <DocumentPreview
          doc={doc}
          hideHeader
          isViewer
          tempSignature={signaturePlaced}
          onSignClick={place}
        />
      )}
    </section>
  );
}
