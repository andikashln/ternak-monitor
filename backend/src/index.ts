import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './config/database.js';
import { authMiddleware, errorHandler, notFoundHandler, requireRoles } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import livestockRoutes from './routes/livestock.js';
import locationsRoutes from './routes/locations.js';
import transactionsRoutes from './routes/transactions.js';
import aiRoutes from './routes/ai.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const isAllowedOrigin = (origin: string) => {
  if (configuredOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost'
      || url.hostname === '127.0.0.1'
      || /^10\./.test(url.hostname)
      || /^192\.168\./.test(url.hostname)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
  } catch {
    return false;
  }
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin tidak diizinkan oleh CORS.'));
  },
  credentials: true,
}));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'TERNAK MONITOR - Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/owner-daily-brief', authMiddleware, requireRoles('OWNER'), aiRoutes);

// Protected routes (require authentication)
app.use('/api/livestock', authMiddleware, requireRoles('OWNER', 'ADMIN'), livestockRoutes);
app.use('/api/locations', authMiddleware, requireRoles('OWNER', 'ADMIN'), locationsRoutes);
app.use('/api/transactions', authMiddleware, requireRoles('OWNER', 'ADMIN'), transactionsRoutes);
app.use('/api/users', authMiddleware, requireRoles('OWNER', 'ADMIN'), usersRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();

    if (connected) {
      console.log('Initializing database schema...');
      await initializeDatabase();
    } else {
      console.warn('Database connection failed. Server will run but database operations may fail.');
    }

    const server = app.listen(Number(PORT), HOST, () => {
      console.log(`✅ Backend server running at http://localhost:${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   - Health Check: GET /api/health`);
      console.log(`   - Auth: POST /api/auth/login`);
      console.log(`   - Livestock: GET /api/livestock`);
    });
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
