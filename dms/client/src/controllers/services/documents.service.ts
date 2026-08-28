import { api } from "@/lib";
import type { Document } from '@models';

export const documentsService = {
  async getDocuments(): Promise<Document[]> {
    const res = await api.get<{ data: Document[]; meta: any }>("/api/documents");
    return res.data?.data || [];
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
    const res = await api.post<Document>("/api/documents/upload", formData);
    return res.data;
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
