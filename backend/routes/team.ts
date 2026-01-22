import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import type { Team, Answer } from '../../src/types';
import type {
  JoinTeamRequest,
  JoinTeamResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  UpdateAnswerScoreRequest,
  GetTeamResponse,
  ErrorResponse,
} from '../types/api';
import {
  loadQuiz,
  saveTeam,
  loadTeam,
  updateTeamAnswer,
  updateAnswerScore,
  getTeamsByQuizCode,
} from '../utils/storage';
import { validateTeamName } from '../utils/validation';

const router = express.Router();

// POST /api/team/join - Team joins a quiz
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { quiz_code, team_name } = req.body as JoinTeamRequest;

    // Validate team name
    const nameValidation = validateTeamName(team_name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: nameValidation.error,
      } as ErrorResponse);
    }

    // Check if quiz exists
    const quiz = await loadQuiz(quiz_code);
    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    // Check if quiz is active
    if (quiz.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'Quiz is not active',
      } as ErrorResponse);
    }

    // Check if team name already exists in this quiz
    const existingTeams = await getTeamsByQuizCode(quiz_code);
    const trimmedName = team_name.trim();
    const nameExists = existingTeams.some(
      (team) => team.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameExists) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Team name already exists in this quiz',
      } as ErrorResponse);
    }

    // Create team
    const team: Team = {
      id: randomUUID(),
      quiz_code,
      name: trimmedName,
      answers: [],
      total_score: 0,
      joined_at: new Date().toISOString(),
    };

    // Save team
    await saveTeam(team);

    res.status(201).json({
      team,
    } as JoinTeamResponse);
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to join quiz',
    } as ErrorResponse);
  }
});

// POST /api/team/:teamId/answer - Submit answer
router.post('/:teamId/answer', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const { question_id, answer: answerText } = req.body as SubmitAnswerRequest;

    // Validate input types
    if (typeof question_id !== 'number' || typeof answerText !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input format',
      } as ErrorResponse);
    }

    if (!answerText.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Answer cannot be empty',
      } as ErrorResponse);
    }

    // Find team by searching all quiz directories
    // In a production system, we'd store team-to-quiz mapping differently
    let team: Team | null = null;
    let quizCode = '';

    // This is a workaround - in production, consider storing team metadata separately
    // For now, we'll require quiz_code in request or use a different approach
    const { quiz_code } = req.body as { quiz_code?: string };

    if (!quiz_code) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quiz_code is required',
      } as ErrorResponse);
    }

    team = await loadTeam(teamId, quiz_code);
    quizCode = quiz_code;

    if (!team) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Team not found',
      } as ErrorResponse);
    }

    // Load quiz
    const quiz = await loadQuiz(quizCode);
    if (!quiz) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quiz not found',
      } as ErrorResponse);
    }

    // Check if quiz is active
    if (quiz.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'Quiz is not active',
      } as ErrorResponse);
    }

    // Find question
    const question = quiz.questions.find((q) => q.id === question_id);
    if (!question) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Question not found',
      } as ErrorResponse);
    }

    // Check if answer is correct (case-insensitive comparison)
    const isCorrect = question.correct.toLowerCase().trim() === answerText.toLowerCase().trim();

    // Create answer object
    const answer: Answer = {
      question_id,
      answer: answerText.trim(),
      is_correct: isCorrect,
      score: isCorrect ? 1 : 0,
    };

    // Update team answer
    await updateTeamAnswer(teamId, quizCode, answer);

    // Load updated team to get new total score
    const updatedTeam = await loadTeam(teamId, quizCode);

    res.status(200).json({
      answer,
      total_score: updatedTeam?.total_score || 0,
    } as SubmitAnswerResponse);
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit answer',
    } as ErrorResponse);
  }
});

// GET /api/team/:teamId - Get team information
router.get('/:teamId', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const { quiz_code } = req.query as { quiz_code?: string };

    if (!quiz_code) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quiz_code query parameter is required',
      } as ErrorResponse);
    }

    const team = await loadTeam(teamId, quiz_code);

    if (!team) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Team not found',
      } as ErrorResponse);
    }

    res.json({
      team,
    } as GetTeamResponse);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch team',
    } as ErrorResponse);
  }
});

// PATCH /api/team/:teamId/score - Update answer score (for quiz master)
router.patch('/:teamId/score', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.teamId as string;
    const { quiz_code, question_id, score } = req.body as UpdateAnswerScoreRequest;

    // Validate input
    if (!quiz_code || typeof question_id !== 'number') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quiz_code and question_id are required',
      } as ErrorResponse);
    }

    // Validate score value
    if (score !== 0 && score !== 0.5 && score !== 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Score must be 0, 0.5, or 1',
      } as ErrorResponse);
    }

    // Update the answer score
    const updatedTeam = await updateAnswerScore(teamId, quiz_code, question_id, score);

    res.json({
      team: updatedTeam,
      message: 'Score updated successfully',
    });
  } catch (error) {
    console.error('Error updating answer score:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update score',
    } as ErrorResponse);
  }
});

export default router;
