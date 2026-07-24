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

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await api.post<{ user: User; access_token: string }>("/api/auth/login", { username, password });
    return {
      user: res.data.user,
      token: res.data.access_token,
    };
  },
};
