import { api } from "@/lib";

export const usersService = {
  async uploadSignature(file: File): Promise<{ success: boolean; path: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<{ success: boolean; path: string }>("/api/users/me/signature", formData);
    return res.data;
  },
};
