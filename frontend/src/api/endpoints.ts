import { api } from './client';
import type { AuditEntry, SessionInfo, Stats, SuspiciousEntry, User } from '../types';

export const authApi = {
  register: (email: string, password: string) => api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<{ mfaRequired: boolean; mfaToken?: string; accessToken?: string }>('/auth/login', { email, password }),
  loginMfa: (mfaToken: string, code: string) => api.post<{ accessToken: string }>('/auth/2fa', { mfaToken, code }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
};

export const twofaApi = {
  setup: () => api.post<{ secret: string; qrDataUrl: string }>('/2fa/setup'),
  enable: (code: string) => api.post<{ backupCodes: string[] }>('/2fa/enable', { code }),
  disable: (password: string) => api.post('/2fa/disable', { password }),
};

export const sessionsApi = {
  list: () => api.get<SessionInfo[]>('/sessions'),
  revoke: (id: string) => api.delete(`/sessions/${id}`),
};

export const adminApi = {
  stats: () => api.get<Stats>('/admin/stats'),
  suspicious: () => api.get<SuspiciousEntry[]>('/admin/suspicious'),
  audit: (limit = 50) => api.get<AuditEntry[]>(`/admin/audit?limit=${limit}`),
  users: () => api.get<User[]>('/admin/users'),
  setRole: (id: string, role: 'user' | 'admin') => api.patch(`/admin/users/${id}/role`, { role }),
  revokeUserSessions: (id: string) => api.post(`/admin/users/${id}/revoke-sessions`),
};
