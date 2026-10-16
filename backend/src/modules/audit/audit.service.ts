import type { Request } from 'express';
import { pool } from '../../db/pool';

export interface AuditInput {
  userId?: string | null;
  email?: string | null;
  meta?: Record<string, unknown>;
}

export async function logEvent(event: string, req: Request | undefined, input: AuditInput = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, email, event, ip, user_agent, meta) VALUES ($1,$2,$3,$4,$5,$6)`,
      [input.userId ?? null, input.email ?? null, event, req?.ip ?? null, req?.get('user-agent') ?? null, input.meta ?? {}],
    );
  } catch (err) {
    console.error('audit log failed', err); // never break a request because logging failed
  }
}
