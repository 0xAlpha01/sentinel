export type Role = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
  createdAt: string;
}

export interface Stats {
  activeSessions: number;
  failedLogins24h: number;
  twoFaPercent: number;
  suspicious24h: number;
  totalUsers: number;
}

export interface AuditEntry {
  id: number;
  email: string | null;
  event: string;
  ip: string | null;
  createdAt: string;
}

export interface SuspiciousEntry extends AuditEntry {
  userId: string | null;
}

export interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  current: boolean;
}
