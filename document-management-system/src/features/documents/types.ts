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
  name: string;            // title
  type: DocumentType;
  sender: string;          // creator_name
  submittedDate: string;   // formatted date string
  status: DocumentStatus;
  amount: string;          // formatted amount or "-"
  version: string;         // e.g. "v1.0"
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
