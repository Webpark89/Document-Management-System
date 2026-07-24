// ============================================================
// TypeScript domain types — compat layer for friend's UI
// Mirrors @/features/documents/types
// ============================================================

export type DocumentStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Returned for Revision"
  | "Cancelled";

export type DocumentType = "PR" | "PO" | "MEMO" | "OTHER" | "Certificate" | "General" | "Data Record" | "PDF" | "Other" | string;

export interface Document {
  id: string;              // doc_number, e.g. "PR-2026-0001"
  real_id?: string;
  name: string;            // title
  title?: string;
  type: DocumentType;
  type_name?: string;
  sender: string;          // creator_name
  creator_name?: string;
  department?: string;
  submittedDate: string;   // formatted date string
  created_at?: string;
  status: DocumentStatus | string;
  amount: string;          // formatted amount or "-"
  version: string;         // e.g. "v1.0"
  pr_form?: any;
  po_form?: any;
  workflow?: any;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: string;
  uploaded_by: string;
  created_at: string;
  file_size_kb: number;
  remarks: string;
  is_active: boolean;
  file_preview_url?: string;
}

export interface DashboardStats {
  total: number;
  approved: number;
  pending: number;
  actionRequired: number;
  documents: Document[];
  trend: DocumentTrendPoint[];
  types: DocumentTypeBreakdown[];
  goals: GoalMetric[];
  activity: ActivityItem[];
}

export interface DocumentTrendPoint {
  day: string;
  documents: number;
  approvals: number;
}

export interface DocumentTypeBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface GoalMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  colorClass: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  delta: string;
}
