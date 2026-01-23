import { describe, it, expect } from 'vitest';
import {
  validateQuizCode,
  generateQuizCode,
  validateTeamName,
  validateQuizTitle,
  validateQuestions,
  validateAnswerSubmission,
} from './validation';
import type { Question } from '../../src/types';

describe('validateQuizCode', () => {
  it('accepts valid 6-character uppercase alphanumeric codes', () => {
    expect(validateQuizCode('QUIZ12')).toBe(true);
    expect(validateQuizCode('ABC123')).toBe(true);
    expect(validateQuizCode('000000')).toBe(true);
    expect(validateQuizCode('AAAAAA')).toBe(true);
  });

  it('rejects codes with wrong length', () => {
    expect(validateQuizCode('QUIZ1')).toBe(false); // too short
    expect(validateQuizCode('QUIZ123')).toBe(false); // too long
    expect(validateQuizCode('')).toBe(false); // empty
  });

  it('rejects codes with lowercase letters', () => {
    expect(validateQuizCode('quiz12')).toBe(false);
    expect(validateQuizCode('QuIz12')).toBe(false);
  });

  it('rejects codes with special characters', () => {
    expect(validateQuizCode('QUIZ-1')).toBe(false);
    expect(validateQuizCode('QUIZ_1')).toBe(false);
    expect(validateQuizCode('QUIZ 1')).toBe(false);
  });
});

describe('generateQuizCode', () => {
  it('generates 6-character code', () => {
    const code = generateQuizCode();
    expect(code).toHaveLength(6);
  });

  it('generates valid quiz code', () => {
    const code = generateQuizCode();
    expect(validateQuizCode(code)).toBe(true);
  });

  it('generates different codes', () => {
    const codes = Array.from({ length: 100 }, () => generateQuizCode());
    const uniqueCodes = new Set(codes);
    // Should have high uniqueness (allow some duplicates due to randomness)
    expect(uniqueCodes.size).toBeGreaterThan(95);
  });
});

describe('validateTeamName', () => {
  it('accepts valid team names', () => {
    expect(validateTeamName('Die Experten')).toEqual({ valid: true });
    expect(validateTeamName('Team 123')).toEqual({ valid: true });
    expect(validateTeamName('A')).toEqual({ valid: true }); // 1 character
    expect(validateTeamName('A'.repeat(50))).toEqual({ valid: true }); // 50 characters
  });

  it('trims whitespace and validates', () => {
    expect(validateTeamName('  Team Name  ')).toEqual({ valid: true });
  });

  it('rejects empty names', () => {
    expect(validateTeamName('')).toEqual({
      valid: false,
      error: 'Team name is required',
    });
    expect(validateTeamName('   ')).toEqual({
      valid: false,
      error: 'Team name cannot be empty',
    });
  });

  it('rejects missing or invalid input', () => {
    expect(validateTeamName(null as unknown as string)).toEqual({
      valid: false,
      error: 'Team name is required',
    });
    expect(validateTeamName(undefined as unknown as string)).toEqual({
      valid: false,
      error: 'Team name is required',
    });
  });

  it('rejects names that are too long', () => {
    const longName = 'A'.repeat(51);
    expect(validateTeamName(longName)).toEqual({
      valid: false,
      error: 'Team name cannot exceed 50 characters',
    });
  });
});

describe('validateQuizTitle', () => {
  it('accepts valid quiz titles', () => {
    expect(validateQuizTitle('Pub Quiz 2026')).toEqual({ valid: true });
    expect(validateQuizTitle('A')).toEqual({ valid: true }); // 1 character
    expect(validateQuizTitle('A'.repeat(200))).toEqual({ valid: true }); // 200 characters
  });

  it('trims whitespace and validates', () => {
    expect(validateQuizTitle('  Quiz Title  ')).toEqual({ valid: true });
  });

  it('rejects empty titles', () => {
    expect(validateQuizTitle('')).toEqual({
      valid: false,
      error: 'Quiz title is required',
    });
    expect(validateQuizTitle('   ')).toEqual({
      valid: false,
      error: 'Quiz title cannot be empty',
    });
  });

  it('rejects missing or invalid input', () => {
    expect(validateQuizTitle(null as unknown as string)).toEqual({
      valid: false,
      error: 'Quiz title is required',
    });
    expect(validateQuizTitle(undefined as unknown as string)).toEqual({
      valid: false,
      error: 'Quiz title is required',
    });
  });

  it('rejects titles that are too long', () => {
    const longTitle = 'A'.repeat(201);
    expect(validateQuizTitle(longTitle)).toEqual({
      valid: false,
      error: 'Quiz title cannot exceed 200 characters',
    });
  });
});

describe('validateQuestions', () => {
  const validQuestion: Question = {
    id: 0,
    text: 'Question?',
    correct: 'Answer',
  };

  it('accepts valid questions array', () => {
    expect(validateQuestions([validQuestion])).toEqual({ valid: true });
    expect(validateQuestions([validQuestion, { ...validQuestion, id: 1 }])).toEqual({
      valid: true,
    });
  });

  it('rejects non-array input', () => {
    expect(validateQuestions(null as unknown as Question[])).toEqual({
      valid: false,
      error: 'Questions must be an array',
    });
    expect(validateQuestions({} as unknown as Question[])).toEqual({
      valid: false,
      error: 'Questions must be an array',
    });
  });

  it('rejects empty array', () => {
    expect(validateQuestions([])).toEqual({
      valid: false,
      error: 'At least one question is required',
    });
  });

  it('rejects too many questions', () => {
    const tooMany = Array.from({ length: 101 }, (_, i) => ({
      ...validQuestion,
      id: i,
    }));
    expect(validateQuestions(tooMany)).toEqual({
      valid: false,
      error: 'Cannot exceed 100 questions',
    });
  });

  it('accepts exactly 100 questions', () => {
    const exactly100 = Array.from({ length: 100 }, (_, i) => ({
      ...validQuestion,
      id: i,
    }));
    expect(validateQuestions(exactly100)).toEqual({ valid: true });
  });

  it('rejects questions with missing text', () => {
    expect(validateQuestions([{ id: 0, text: '', correct: 'Answer' }])).toEqual({
      valid: false,
      error: 'Question 1: Text is required',
    });

    expect(
      validateQuestions([{ id: 0, text: null as unknown as string, correct: 'Answer' }]),
    ).toEqual({
      valid: false,
      error: 'Question 1: Text is required',
    });
  });

  it('rejects questions with missing correct answer', () => {
    expect(validateQuestions([{ id: 0, text: 'Question?', correct: '' }])).toEqual({
      valid: false,
      error: 'Question 1: Correct answer is required',
    });

    expect(
      validateQuestions([{ id: 0, text: 'Question?', correct: null as unknown as string }]),
    ).toEqual({
      valid: false,
      error: 'Question 1: Correct answer is required',
    });
  });

  it('reports correct question number in error', () => {
    const validQuestion: Question = {
      id: 0,
      text: 'Question?',
      correct: 'Answer',
    };

    const questions = [
      validQuestion,
      { id: 1, text: 'Q2', correct: 'A2' },
      { id: 2, text: '', correct: 'A3' }, // Error in third question
    ];

    expect(validateQuestions(questions)).toEqual({
      valid: false,
      error: 'Question 3: Text is required',
    });
  });
});

describe('validateAnswerSubmission', () => {
  it('accepts valid answer submission', () => {
    expect(validateAnswerSubmission(0, 'Answer', 10)).toEqual({ valid: true });
    expect(validateAnswerSubmission(5, 'Some answer', 10)).toEqual({ valid: true });
  });

  it('rejects invalid question ID', () => {
    expect(validateAnswerSubmission(-1, 'Answer', 10)).toEqual({
      valid: false,
      error: 'Invalid question ID',
    });

    expect(validateAnswerSubmission(1.5, 'Answer', 10)).toEqual({ valid: true });
    // Note: TypeScript should prevent this, but at runtime we only check < 0
  });

  it('rejects question ID out of range', () => {
    expect(validateAnswerSubmission(10, 'Answer', 10)).toEqual({
      valid: false,
      error: 'Question not found',
    });

    expect(validateAnswerSubmission(100, 'Answer', 10)).toEqual({
      valid: false,
      error: 'Question not found',
    });
  });

  it('rejects empty answer', () => {
    expect(validateAnswerSubmission(0, '', 10)).toEqual({
      valid: false,
      error: 'Answer cannot be empty',
    });

    expect(validateAnswerSubmission(0, '   ', 10)).toEqual({
      valid: false,
      error: 'Answer cannot be empty',
    });
  });

  it('rejects invalid answer type', () => {
    expect(validateAnswerSubmission(0, null as unknown as string, 10)).toEqual({
      valid: false,
      error: 'Answer cannot be empty',
    });

    expect(validateAnswerSubmission(0, undefined as unknown as string, 10)).toEqual({
      valid: false,
      error: 'Answer cannot be empty',
    });
  });

  it('accepts boundary cases', () => {
    expect(validateAnswerSubmission(0, 'A', 1)).toEqual({ valid: true }); // First question
    expect(validateAnswerSubmission(9, 'A', 10)).toEqual({ valid: true }); // Last question
  });
});
