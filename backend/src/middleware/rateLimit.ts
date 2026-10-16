import rateLimit from 'express-rate-limit';

const message = { error: 'Too many requests. Please try again later.' };

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message });

// Strict limiter for credential endpoints (login, register, 2FA).
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message });
