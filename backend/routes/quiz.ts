import express, { Request, Response } from 'express';
import type { Quiz, Question } from '../../src/types';
import type {
  CreateQuizRequest,
  CreateQuizResponse,
  GetQuizResponse,
  GetQuizMasterResponse,
  QuizResultsResponse,
  UpdateQuizStatusRequest,
  ErrorResponse,
} from '../types/api';
import {
  saveQuiz,
  loadQuiz,
  getAllQuizzes,
  updateQuizStatus,
  quizExists,
  getTeamsByQuizCode,
} from '../utils/storage';
import {
  generateQuizCode,
  validateQuizTitle,
  validateQuestions,
  validateQuizCode,
} from '../utils/validation';

const router = express.Router();

// POST /api/quiz/create - Create new quiz
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { title, questions } = req.body as CreateQuizRequest;

    // Validate title
    const titleValidation = validateQuizTitle(title);
    if (!titleValidation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: titleValidation.error,
      } as ErrorResponse);
    }

    // Validate questions
    const questionsValidation = validateQuestions(questions);
    if (!questionsValidation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: questionsValidation.error,
      } as ErrorResponse);
    }

    // Generate unique quiz code
    let code = generateQuizCode();
    while (await quizExists(code)) {
      code = generateQuizCode();
    }

    // Assign IDs to questions
    const questionsWithIds: Question[] = questions.map((q, index) => ({
      ...q,
      id: index,
    }));

    // Create quiz object
    const quiz: Quiz = {
      code,
      title: title.trim(),
      questions: questionsWithIds,
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    // Save quiz
    await saveQuiz(quiz);

    res.status(201).json({
      quiz,
    } as CreateQuizResponse);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create quiz',
    } as ErrorResponse);
  }
});

// GET /api/quiz/:code - Get quiz (without correct answers for teams)
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;

    if (!validateQuizCode(code)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid quiz code format',
      } as ErrorResponse);
    }

    const quiz = await loadQuiz(code);

    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    // Remove correct answers from questions for team view
    const questionsWithoutAnswers = quiz.questions.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ correct, ...question }) => question,
    );

    res.json({
      quiz: {
        code: quiz.code,
        title: quiz.title,
        status: quiz.status,
        created_at: quiz.created_at,
        questions: questionsWithoutAnswers,
      },
    } as GetQuizResponse);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz',
    } as ErrorResponse);
  }
});

// GET /api/quiz/:code/master - Get quiz with correct answers (for quiz master)
router.get('/:code/master', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;

    if (!validateQuizCode(code)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid quiz code format',
      } as ErrorResponse);
    }

    const quiz = await loadQuiz(code);

    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    res.json({
      quiz,
    } as GetQuizMasterResponse);
  } catch (error) {
    console.error('Error fetching quiz for master:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz',
    } as ErrorResponse);
  }
});

// GET /api/quiz/:code/results - Get quiz results with team rankings
router.get('/:code/results', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;

    if (!validateQuizCode(code)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid quiz code format',
      } as ErrorResponse);
    }

    const quiz = await loadQuiz(code);

    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    const teams = await getTeamsByQuizCode(code);

    // Sort teams by score (descending)
    const sortedTeams = teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        total_score: team.total_score,
        answers: team.answers,
      }))
      .sort((a, b) => b.total_score - a.total_score);

    res.json({
      quiz,
      teams: sortedTeams,
    } as QuizResultsResponse);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quiz results',
    } as ErrorResponse);
  }
});

// PATCH /api/quiz/:code/status - Update quiz status
router.patch('/:code/status', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const { status } = req.body as UpdateQuizStatusRequest;

    if (!validateQuizCode(code)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid quiz code format',
      } as ErrorResponse);
    }

    if (!status || !['draft', 'active', 'finished'].includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status value',
      } as ErrorResponse);
    }

    const quiz = await loadQuiz(code);

    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    await updateQuizStatus(code, status);

    res.json({
      message: 'Quiz status updated successfully',
      status,
    });
  } catch (error) {
    console.error('Error updating quiz status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update quiz status',
    } as ErrorResponse);
  }
});

// GET /api/quizzes - Get all quizzes (optional, for listing)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const quizzes = await getAllQuizzes();

    res.json({
      quizzes: quizzes.map((quiz) => ({
        code: quiz.code,
        title: quiz.title,
        status: quiz.status,
        created_at: quiz.created_at,
        question_count: quiz.questions.length,
      })),
    });
  } catch (error) {
    console.error('Error fetching all quizzes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch quizzes',
    } as ErrorResponse);
  }
});

export default router;
