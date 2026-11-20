import { apiClient, consumeAuthResult, setAccessToken, storeCsrfToken } from "./client";
import type { ApiSuccess, AuthResult, PublicUser } from "./types";

export const authApi = {
  async login(input: { identifier: string; password: string }): Promise<AuthResult> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>("/auth/login", input);
    return consumeAuthResult(response.data.data);
  },

  async register(input: { name: string; email?: string; phone?: string; password: string }): Promise<AuthResult> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>("/auth/register/customer", input);
    return consumeAuthResult(response.data.data);
  },

  async google(idToken: string): Promise<AuthResult> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>("/auth/google", { idToken });
    return consumeAuthResult(response.data.data);
  },

  async me(): Promise<PublicUser> {
    const response = await apiClient.get<ApiSuccess<{ user: PublicUser }>>("/auth/me");
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setAccessToken(null);
      storeCsrfToken(null);
    }
  },
};
