import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import twofaRoutes from './modules/twofa/twofa.routes';
import sessionRoutes from './modules/sessions/sessions.routes';
import adminRoutes from './modules/admin/admin.routes';

export const app = express();

app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twofaRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);
