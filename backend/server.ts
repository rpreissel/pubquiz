import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import quizRoutes from './routes/quiz';
import teamRoutes from './routes/team';
import { ensureDataDirectories } from './utils/storage';
import type { ErrorResponse } from './types/api';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
  } as ErrorResponse);
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

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
