import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { ApiFailure, ApiSuccess, AuthResult } from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1")
  .replace(/\/$/, "");
const csrfStorageKey = "salon.csrf";

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResult> | null = null;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const storeCsrfToken = (token: string | null): void => {
  if (token) sessionStorage.setItem(csrfStorageKey, token);
  else sessionStorage.removeItem(csrfStorageKey);
};

const readCookie = (name: string): string | null => {
  const encodedName = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));
  return match ? decodeURIComponent(match.slice(encodedName.length)) : null;
};

const getCsrfToken = (): string | null =>
  sessionStorage.getItem(csrfStorageKey) ||
  readCookie(import.meta.env.VITE_AUTH_CSRF_COOKIE_NAME || "salon_csrf");

export const hasStoredAuthSession = (): boolean => Boolean(getCsrfToken());

const applyAuthResult = (result: AuthResult): AuthResult => {
  setAccessToken(result.authentication.accessToken);
  storeCsrfToken(result.authentication.csrfToken);
  return result;
};

export const refreshAccessToken = async (): Promise<AuthResult> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiSuccess<AuthResult>>(
        "/auth/refresh",
        {},
        {
          headers: getCsrfToken()
            ? { "X-CSRF-Token": getCsrfToken() as string }
            : undefined,
        },
      )
      .then((response) => applyAuthResult(response.data.data))
      .catch((error: unknown) => {
        setAccessToken(null);
        storeCsrfToken(null);
        window.dispatchEvent(new CustomEvent("salon:session-expired"));
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

apiClient.interceptors.request.use((request) => {
  if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`;
  request.headers["X-Request-Id"] = crypto.randomUUID();
  return request;
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _salonRetried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiFailure>) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthEntryPoint = request?.url?.startsWith("/auth/login") ||
      request?.url?.startsWith("/auth/register") ||
      request?.url?.startsWith("/auth/google") ||
      request?.url?.startsWith("/auth/refresh");

    if (error.response?.status === 401 && request && !request._salonRetried && !isAuthEntryPoint) {
      request._salonRetried = true;
      try {
        const result = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${result.authentication.accessToken}`;
        return apiClient(request);
      } catch {
        // Return the original protected-request failure to the caller.
      }
    }
    return Promise.reject(error);
  },
);

export const apiErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (axios.isAxiosError<ApiFailure>(error)) {
    const validationMessages = apiValidationErrors(error);
    if (Object.keys(validationMessages).length > 0) {
      return [...new Set(Object.values(validationMessages))].join(" ");
    }
    return error.response?.data?.error?.message ||
      (error.code === "ECONNABORTED" ? "The request timed out. Please try again." : error.message) ||
      fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const apiValidationErrors = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError<ApiFailure>(error)) return {};
  const details = error.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};

  return details.reduce<Record<string, string>>((messages, issue) => {
    if (!issue || typeof issue !== "object") return messages;
    const path = "path" in issue && typeof issue.path === "string" ? issue.path : "";
    const message = "message" in issue && typeof issue.message === "string" ? issue.message : "";
    if (!path || !message) return messages;
    const field = path.split(".").filter(Boolean).at(-1);
    if (field && !messages[field]) messages[field] = message;
    return messages;
  }, {});
};

export const consumeAuthResult = applyAuthResult;
