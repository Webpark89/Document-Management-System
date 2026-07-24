// ============================================================
// document-type-icon.tsx — compat layer for friend's @/lib/document-type-icon
// Renders a colored icon badge based on document type
// ============================================================

import React from "react";
import { FileText, ShoppingCart, Award, File } from "lucide-react";
import type { DocumentType } from '@views/features/documents/types';

interface DocumentTypeIconProps {
  type: DocumentType;
  size?: "sm" | "md" | "lg";
}

const TYPE_CONFIG: Record<
  DocumentType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  PR: { icon: ShoppingCart, bg: "bg-blue-50", color: "text-blue-600" },
  PO: { icon: FileText, bg: "bg-purple-50", color: "text-purple-600" },
  Certificate: { icon: Award, bg: "bg-emerald-50", color: "text-emerald-600" },
  General: { icon: File, bg: "bg-slate-100", color: "text-slate-500" },
};

const SIZE_CLASSES = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
};

const ICON_SIZE_CLASSES = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-5.5",
};

export function DocumentTypeIcon({ type, size = "md" }: DocumentTypeIconProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.General;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center justify-center rounded-xl flex-shrink-0 ${SIZE_CLASSES[size]} ${config.bg}`}
    >
      <Icon className={`${ICON_SIZE_CLASSES[size]} ${config.color}`} />
    </div>
  );
}
