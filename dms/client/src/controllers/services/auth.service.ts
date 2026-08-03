import { api } from "@/lib";
import type { User } from '@models';

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await api.get<User>("/api/auth/me");
      return res.data;
    } catch {
      return null;
    }
  },

  async login(username: string, password: string): Promise<{ user: User }> {
    const res = await api.post<{ user: User }>("/api/auth/login", { username, password });
    return {
      user: res.data.user,
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>("/api/auth/reset-password", { token, newPassword });
    return res.data;
  },
};
