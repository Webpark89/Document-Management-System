"use client";

import React from "react";

export interface DocTypeInfo {
  code: string;
  label: string;
  badgeClass: string;
}

export function resolveDocType(docId?: string, type?: unknown): DocTypeInfo {
  let raw = "";
  if (typeof type === "string") {
    raw = type;
  } else if (type && typeof type === "object") {
    raw =
      (type as any).prefix ||
      (type as any).code ||
      (type as any).type_name ||
      (type as any).name ||
      "";
  }
  if (!raw && docId) {
    const parts = docId.split("-");
    raw = parts[0] || "";
  }

  const upper = (raw || "").trim().toUpperCase();
  const upperId = (docId || "").trim().toUpperCase();

  if (upper.startsWith("PR") || upperId.startsWith("PR")) {
    return {
      code: "PR",
      label: "PR",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  if (upper.startsWith("PO") || upperId.startsWith("PO")) {
    return {
      code: "PO",
      label: "PO",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }

  if (
    upper.startsWith("BK") ||
    upperId.startsWith("BK") ||
    upper.includes("MEMO") ||
    upper.includes("บันทึก")
  ) {
    return {
      code: "BK",
      label: "BK",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (upper.startsWith("CERT") || upperId.startsWith("CERT")) {
    return {
      code: "CERT",
      label: "CERT",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    };
  }

  if (
    upper.startsWith("DOC") ||
    upperId.startsWith("DOC") ||
    upper === "OTHER" ||
    upper === "GENERAL" ||
    upper.includes("ทั่วไป")
  ) {
    return {
      code: "DOC",
      label: "DOC",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  const fallbackLabel = upper ? upper.slice(0, 4) : "DOC";
  return {
    code: fallbackLabel,
    label: fallbackLabel,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

interface DocTypeBadgeProps {
  docId?: string;
  type?: unknown;
  className?: string;
}

export default function DocTypeBadge({
  docId,
  type,
  className = "",
}: DocTypeBadgeProps) {
  const info = resolveDocType(docId, type);

  return (
    <div
      className={`w-12 h-8 rounded-xl shrink-0 border flex items-center justify-center font-bold text-xs select-none shadow-2xs transition-colors ${info.badgeClass} ${className}`}
      title={`ประเภท: ${info.label}`}
    >
      {info.label}
    </div>
  );
}
