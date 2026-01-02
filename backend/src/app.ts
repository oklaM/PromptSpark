import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import promptRoutes from './routes/promptRoutes';
import authRoutes from './routes/authRoutes';
import collaborationRoutes from './routes/collaborationRoutes';
import aiRoutes from './routes/aiRoutes';
import evalRoutes from './routes/evalRoutes';
import sdkRoutes from './routes/sdkRoutes';
import tokenRoutes from './routes/tokenRoutes';
import { database } from './db/database';

const app: Express = express();

// Middleware
app.use(morgan('dev')); // Log requests to console
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api', promptRoutes);
app.use('/api', evalRoutes);
app.use('/api', tokenRoutes);
app.use('/api/sdk', sdkRoutes); // /api/sdk/prompts/:key
app.use('/api/auth', authRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Server Error:', err); // Enhanced error logging
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export { app, database };
