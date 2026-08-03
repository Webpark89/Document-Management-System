import { api } from "@/lib";
import type { Document } from '@models';

export const documentsService = {
  async getDocuments(): Promise<Document[]> {
    const res = await api.get<any>("/api/documents");
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  },

  async getDocumentById(id: string): Promise<Document | undefined> {
    const res = await api.get<Document>(`/api/documents/${id}`);
    return res.data;
  },

  async softDeleteDocument(id: string): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/api/documents/${id}`);
    return res.data.success;
  },

  async createDocument(dto: {
    title: string;
    prefix: string;
    purpose?: string;
    items?: Array<{
      item_name: string;
      quantity: number;
      unit?: string;
      unit_price: number;
      remark?: string;
    }>;
  }): Promise<Document> {
    const res = await api.post<Document>("/api/documents", dto);
    return res.data;
  },

  async updateDocument(id: string, dto: {
    title?: string;
    purpose?: string;
    items?: Array<{
      item_name: string;
      quantity: number;
      unit?: string;
      unit_price: number;
      remark?: string;
    }>;
  }): Promise<Document> {
    const res = await api.patch<Document>(`/api/documents/${id}`, dto);
    return res.data;
  },

  async uploadDocument(formData: FormData): Promise<Document> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`อัปโหลดล้มเหลว: ${res.statusText}`);
    }

    return res.json();
  },

  async getDocumentSignedUrl(id: string): Promise<{ url: string; expires_in: number } | null> {
    try {
      const res = await api.get<{ url: string; expires_in: number }>(`/api/documents/${id}/signed-url`);
      return res.data;
    } catch {
      return null;
    }
  },
};
