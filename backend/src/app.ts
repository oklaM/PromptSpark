import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import promptRoutes from './routes/promptRoutes';
import authRoutes from './routes/authRoutes';
import collaborationRoutes from './routes/collaborationRoutes';
import aiRoutes from './routes/aiRoutes';
import evalRoutes from './routes/evalRoutes';
import sdkRoutes from './routes/sdkRoutes';
import tokenRoutes from './routes/tokenRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { database } from './db/database';
import { rateLimitGeneral, rateLimitAi, rateLimitAuth } from './middleware/rateLimitMiddleware';
import { monitorPerformance, performanceMonitor } from './middleware/performanceMonitor';

const app: Express = express();

// Middleware
app.use(monitorPerformance);
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// System endpoints
function handleHealthCheck(_req: Request, res: Response): void {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

function handleMetrics(_req: Request, res: Response): void {
  res.json({ success: true, data: performanceMonitor.getSummary() });
}

// API Routes - General rate limit
app.use('/api', rateLimitGeneral, promptRoutes);
app.use('/api', rateLimitGeneral, evalRoutes);
app.use('/api', rateLimitGeneral, tokenRoutes);
app.use('/api/collaboration', rateLimitGeneral, collaborationRoutes);

// API Routes - Auth rate limit
app.use('/api/auth', rateLimitAuth, authRoutes);

// API Routes - AI rate limit
app.use('/api/ai', rateLimitAi, aiRoutes);

// API Routes - SDK (no rate limit for API token usage)
app.use('/api/sdk', sdkRoutes);

// API Routes - Payments (no additional rate limit)
app.use('/api/payments', paymentRoutes);

// System endpoints
app.get('/health', handleHealthCheck);
app.get('/metrics', handleMetrics);

// Error handling middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('Server Error:', message);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? message : undefined,
  });
});

export type { Express, Request, Response };

export { app, database };
