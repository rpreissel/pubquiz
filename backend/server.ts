import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import quizRoutes from './routes/quiz';
import teamRoutes from './routes/team';
import { ensureDataDirectories } from './utils/storage';
import type { ErrorResponse } from './types/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/team', teamRoutes);

// 404 handler for API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Route not found',
    } as ErrorResponse);
  } else if (isProduction) {
    // Serve frontend for all non-API routes in production
    const distPath = path.join(__dirname, '..', 'dist', 'index.html');
    res.sendFile(distPath);
  } else {
    next();
  }
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  } as ErrorResponse);
});

// Initialize data directories and start server
async function startServer() {
  try {
    await ensureDataDirectories();
    // eslint-disable-next-line no-console
    console.log('Data directories initialized');

    const host = isProduction ? '0.0.0.0' : 'localhost';
    app.listen(PORT, host, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on ${host}:${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Health check: http://${host}:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
