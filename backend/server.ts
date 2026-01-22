import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Quiz routes
app.post('/api/quiz/create', (_req: Request, res: Response) => {
  res.json({ message: 'Quiz creation - Coming soon' });
});

app.get('/api/quiz/:code', (_req: Request, res: Response) => {
  res.json({ message: 'Quiz retrieval - Coming soon' });
});

// Team routes
app.post('/api/team/join', (_req: Request, res: Response) => {
  res.json({ message: 'Team join - Coming soon' });
});

app.post('/api/team/:teamId/answer', (_req: Request, res: Response) => {
  res.json({ message: 'Answer submission - Coming soon' });
});

app.get('/api/quiz/:code/results', (_req: Request, res: Response) => {
  res.json({ message: 'Results - Coming soon' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
