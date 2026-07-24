import { api } from "@/lib";
import type { Document } from '@models';

export const documentsService = {
  async getDocuments(): Promise<Document[]> {
    const res = await api.get<Document[]>("/api/documents");
    return res.data;
  },

  async getDocumentById(id: string): Promise<Document | undefined> {
    const res = await api.get<Document>(`/api/documents/${id}`);
    return res.data;
  },

  async softDeleteDocument(id: string): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/api/documents/${id}`);
    return res.data.success;
  },
};
