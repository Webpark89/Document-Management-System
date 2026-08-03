// ============================================================
// API client for Documents feature
// Calls real backend API
// ============================================================

import { api } from "@/lib";
import type { DashboardStats, Document } from "./types";

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const docs = await getDocuments();
    return {
      total: docs.length,
      approved: docs.filter((d) => d.status === "Approved").length,
      pending: docs.filter((d) => d.status === "Pending").length,
      actionRequired: docs.filter((d) => d.status === "Pending").length,
      documents: docs,
      trend: [],
      types: [],
      goals: [],
      activity: [],
    };
  } catch {
    return {
      total: 0,
      approved: 0,
      pending: 0,
      actionRequired: 0,
      documents: [],
      trend: [],
      types: [],
      goals: [],
      activity: [],
    };
  }
}

export async function getDocuments(): Promise<Document[]> {
  try {
    const res = await api.get<any>("/api/documents");
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  } catch (err) {
    console.warn("[getDocuments] Failed to fetch documents", err);
    return [];
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const res = await api.get<Document>(`/api/documents/${id}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn(`[getDocumentById] Failed to fetch ${id}`, err);
  }
  const docs = await getDocuments();
  return (
    docs.find(
      (d) => d.id === id || (d as any).real_id === id || (d as any).doc_number === id
    ) || null
  );
}

export interface CreateDocumentPayload {
  title: string;
  prefix: string;
  purpose?: string;
  items?: {
    item_name: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    remark?: string;
  }[];
  workflow_steps?: {
    step_order: number;
    approver_id: string;
  }[];
}

export async function addDocument(payload: CreateDocumentPayload): Promise<Document> {
  if (!payload.prefix || !payload.title) {
    throw new Error("Invalid payload: prefix and title are required.");
  }
  const res = await api.post<Document>("/api/documents", payload);
  return res.data;
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const res = await api.delete<{ success: boolean }>(`/api/documents/${id}`);
    return res.data?.success ?? true;
  } catch (err) {
    console.error("[deleteDocument] Failed to delete document", err);
    return false;
  }
}
