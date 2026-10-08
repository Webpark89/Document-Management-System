// ============================================================
// API client for Documents feature
// Calls real backend API
// ============================================================

import { api } from "@/lib";
import type { DashboardStats, Document } from "./types";

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await api.get<DashboardStats>("/api/dashboard/stats");
    return {
      ...res.data,
      documents: [],
      trend: [],
      types: [],
      goals: [],
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

export async function getDocuments(options?: { limit?: number; status?: string }): Promise<Document[]> {
  try {
    const query = new URLSearchParams();
    if (options?.limit) query.append("limit", options.limit.toString());
    if (options?.status) query.append("status", options.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get<any>(`/api/documents${qs}`);
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

export async function uploadNewDocumentVersion(id: string, formData: FormData): Promise<Document> {
  const res = await api.post<Document>(`/api/documents/${id}/upload-new-version`, formData);
  return res.data;
}
export async function updateDocumentFull(id: string, payload: CreateDocumentPayload): Promise<Document> {
  const res = await api.put<Document>(`/api/documents/${id}`, payload);
  return res.data;
}

export async function updateDocumentFullWithFile(id: string, formData: FormData): Promise<Document> {
  const res = await api.put<Document>(`/api/documents/${id}/upload`, formData);
  return res.data;
}
