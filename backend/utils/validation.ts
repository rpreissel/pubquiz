import type { Question } from '../../src/types';

// Quiz code format: 6 alphanumeric characters
const QUIZ_CODE_REGEX = /^[A-Z0-9]{6}$/;

// Team name: 1-50 characters, no leading/trailing whitespace
const TEAM_NAME_MIN_LENGTH = 1;
const TEAM_NAME_MAX_LENGTH = 50;

// Quiz validation
const QUIZ_TITLE_MIN_LENGTH = 1;
const QUIZ_TITLE_MAX_LENGTH = 200;
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 100;

export function validateQuizCode(code: string): boolean {
  return QUIZ_CODE_REGEX.test(code);
}

export function generateQuizCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function validateTeamName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Team name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < TEAM_NAME_MIN_LENGTH) {
    return { valid: false, error: 'Team name cannot be empty' };
  }

  if (trimmedName.length > TEAM_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Team name cannot exceed ${TEAM_NAME_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validateQuizTitle(title: string): {
  valid: boolean;
  error?: string;
} {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Quiz title is required' };
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length < QUIZ_TITLE_MIN_LENGTH) {
    return { valid: false, error: 'Quiz title cannot be empty' };
  }

  if (trimmedTitle.length > QUIZ_TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Quiz title cannot exceed ${QUIZ_TITLE_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validateQuestions(questions: Question[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'Questions must be an array' };
  }

  if (questions.length < MIN_QUESTIONS) {
    return { valid: false, error: 'At least one question is required' };
  }

  if (questions.length > MAX_QUESTIONS) {
    return {
      valid: false,
      error: `Cannot exceed ${MAX_QUESTIONS} questions`,
    };
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    if (!question.text || typeof question.text !== 'string') {
      return { valid: false, error: `Question ${i + 1}: Text is required` };
    }

    if (question.text.trim().length === 0) {
      return { valid: false, error: `Question ${i + 1}: Text cannot be empty` };
    }

    if (!question.correct || typeof question.correct !== 'string') {
      return { valid: false, error: `Question ${i + 1}: Correct answer is required` };
    }

    if (question.correct.trim().length === 0) {
      return { valid: false, error: `Question ${i + 1}: Correct answer cannot be empty` };
    }
  }

  return { valid: true };
}

export function validateAnswerSubmission(
  questionId: number,
  answer: string,
  totalQuestions: number,
): { valid: boolean; error?: string } {
  if (typeof questionId !== 'number' || questionId < 0) {
    return { valid: false, error: 'Invalid question ID' };
  }

  if (questionId >= totalQuestions) {
    return { valid: false, error: 'Question not found' };
  }

  if (typeof answer !== 'string' || answer.trim().length === 0) {
    return { valid: false, error: 'Answer cannot be empty' };
  }

  return { valid: true };
}
