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
      documents: res.data.documents || [],
      trend: res.data.trend || [],
      types: res.data.types || [],
      goals: res.data.goals || [],
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

export async function getDocuments(options?: {
  limit?: number;
  status?: string;
}): Promise<Document[]> {
  const limit = Math.min(options?.limit || 200, 1000),
    all: Document[] = [];
  let page = 1;
  while (true) {
    const query = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });
    if (options?.status) query.set("status", options.status);
    const res = await api.get<{
      data: Document[];
      meta: { totalPages: number };
    }>(`/api/documents?${query}`);
    all.push(...res.data.data);
    if (options?.limit || page >= res.data.meta.totalPages) return all;
    page++;
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  return (await api.get<Document>(`/api/documents/${encodeURIComponent(id)}`))
    .data;
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

export async function addDocument(
  payload: CreateDocumentPayload,
): Promise<Document> {
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

export async function uploadNewDocumentVersion(
  id: string,
  formData: FormData,
): Promise<Document> {
  const res = await api.post<Document>(
    `/api/documents/${id}/upload-new-version`,
    formData,
  );
  return res.data;
}
export async function updateDocumentFull(
  id: string,
  payload: CreateDocumentPayload,
): Promise<Document> {
  const res = await api.put<Document>(`/api/documents/${id}`, payload);
  return res.data;
}

export async function updateDocumentFullWithFile(
  id: string,
  formData: FormData,
): Promise<Document> {
  const res = await api.put<Document>(`/api/documents/${id}/upload`, formData);
  return res.data;
}

export async function uploadDocumentFile(
  formData: FormData,
): Promise<Document> {
  const res = await api.post<Document>("/api/documents/upload", formData);
  return res.data;
}

export async function downloadDocument(
  docId: string,
  versionNumber?: number,
  suggestedFilename?: string,
): Promise<void> {
  const query = new URLSearchParams();
  if (versionNumber) query.append("v", versionNumber.toString());
  query.append("download", "true");

  const qs = query.toString() ? `?${query.toString()}` : "";
  const url = `/api/documents/${docId}/download${qs}`;

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = "ดาวน์โหลดเอกสารไม่สำเร็จ";
    try {
      const data = await res.json();
      if (data?.message) {
        errorMsg = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  let filename = suggestedFilename;
  if (!filename) {
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename*=")) {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (match && match[1]) {
        try {
          filename = decodeURIComponent(match[1]);
        } catch {}
      }
    }
    if (!filename && disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = match[1];
      }
    }
  }

  if (!filename) {
    filename = `${docId}${versionNumber ? `_v${versionNumber}` : ""}.pdf`;
  }
  if (!filename.toLowerCase().endsWith(".pdf")) {
    filename += ".pdf";
  }

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}
