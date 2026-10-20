import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * The Express application mounts every public route below `/api`.
 *
 * In development, a relative `/api` is proxied by Vite. In production the
 * Vercel variable may be either the Render origin or its `/api` path; normalize
 * both forms so request callers never have to repeat the prefix.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || '/api';
const baseURL = configuredApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? configuredApiUrl.replace(/\/+$/, '')
  : `${configuredApiUrl.replace(/\/+$/, '')}/api`;

export const api = axios.create({ baseURL, withCredentials: true });

// The access token lives only in memory (never localStorage), so XSS can't steal a long-lived credential.
let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const setOnAuthLost = (fn: () => void) => { onAuthLost = fn; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// One refresh at a time: concurrent requests share the same promise, so a rotated token is never replayed.
let refreshing: Promise<string | null> | null = null;
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= axios
    .post<{ accessToken: string }>(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then((r) => { setAccessToken(r.data.accessToken); return r.data.accessToken; })
    .catch(() => { setAccessToken(null); return null; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

type Retryable = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as Retryable | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      onAuthLost?.();
    }
    return Promise.reject(error);
  },
);
