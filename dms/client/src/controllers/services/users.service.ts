import { api } from "@/lib";

export const usersService = {
  async uploadSignature(file: File): Promise<{ success: boolean; path: string; url?: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<{ success: boolean; path: string; url?: string }>("/api/users/me/signature", formData);
    return res.data;
  },

  async getMySignatureUrl(): Promise<{ url: string | null }> {
    const res = await api.get<{ url: string | null }>("/api/users/me/signature-url");
    return res.data;
  },
};
