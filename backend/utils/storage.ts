import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Quiz, Team, Answer } from '../../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const QUIZZES_DIR = path.join(DATA_DIR, 'quizzes');
const TEAMS_DIR = path.join(DATA_DIR, 'teams');

// Ensure data directories exist
export async function ensureDataDirectories(): Promise<void> {
  try {
    await fs.mkdir(QUIZZES_DIR, { recursive: true });
    await fs.mkdir(TEAMS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directories:', error);
    throw error;
  }
}

// Quiz operations
export async function saveQuiz(quiz: Quiz): Promise<void> {
  try {
    const filePath = path.join(QUIZZES_DIR, `${quiz.code}.json`);
    await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save quiz ${quiz.code}:`, error);
    throw error;
  }
}

export async function loadQuiz(code: string): Promise<Quiz | null> {
  try {
    const filePath = path.join(QUIZZES_DIR, `${code}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Quiz;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Failed to load quiz ${code}:`, error);
    throw error;
  }
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const files = await fs.readdir(QUIZZES_DIR);
    const quizzes: Quiz[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(QUIZZES_DIR, file), 'utf-8');
        quizzes.push(JSON.parse(data) as Quiz);
      }
    }

    return quizzes.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (error) {
    console.error('Failed to load all quizzes:', error);
    throw error;
  }
}

export async function updateQuizStatus(code: string, status: Quiz['status']): Promise<void> {
  try {
    const quiz = await loadQuiz(code);
    if (!quiz) {
      throw new Error(`Quiz ${code} not found`);
    }

    quiz.status = status;
    await saveQuiz(quiz);
  } catch (error) {
    console.error(`Failed to update quiz ${code} status:`, error);
    throw error;
  }
}

export async function quizExists(code: string): Promise<boolean> {
  try {
    const filePath = path.join(QUIZZES_DIR, `${code}.json`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function updateCurrentQuestion(code: string, questionIndex: number): Promise<void> {
  try {
    const quiz = await loadQuiz(code);
    if (!quiz) {
      throw new Error(`Quiz ${code} not found`);
    }

    quiz.current_question_index = questionIndex;
    await saveQuiz(quiz);
  } catch (error) {
    console.error(`Failed to update current question for quiz ${code}:`, error);
    throw error;
  }
}

// Team operations
export async function saveTeam(team: Team): Promise<void> {
  try {
    const quizTeamsDir = path.join(TEAMS_DIR, team.quiz_code);
    await fs.mkdir(quizTeamsDir, { recursive: true });

    const filePath = path.join(quizTeamsDir, `${team.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(team, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save team ${team.id}:`, error);
    throw error;
  }
}

export async function loadTeam(teamId: string, quizCode: string): Promise<Team | null> {
  try {
    const filePath = path.join(TEAMS_DIR, quizCode, `${teamId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Team;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Failed to load team ${teamId}:`, error);
    throw error;
  }
}

export async function getTeamsByQuizCode(quizCode: string): Promise<Team[]> {
  try {
    const quizTeamsDir = path.join(TEAMS_DIR, quizCode);

    try {
      await fs.access(quizTeamsDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(quizTeamsDir);
    const teams: Team[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(quizTeamsDir, file), 'utf-8');
        teams.push(JSON.parse(data) as Team);
      }
    }

    return teams.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  } catch (error) {
    console.error(`Failed to load teams for quiz ${quizCode}:`, error);
    throw error;
  }
}

export async function updateTeamAnswer(
  teamId: string,
  quizCode: string,
  answer: Answer,
): Promise<void> {
  try {
    const team = await loadTeam(teamId, quizCode);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Check if answer for this question already exists
    const existingAnswerIndex = team.answers.findIndex((a) => a.question_id === answer.question_id);

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      team.answers[existingAnswerIndex] = answer;
    } else {
      // Add new answer
      team.answers.push(answer);
    }

    // Recalculate total score based on individual answer scores
    team.total_score = team.answers.reduce(
      (sum, a) => sum + (a.score ?? (a.is_correct ? 1 : 0)),
      0,
    );

    await saveTeam(team);
  } catch (error) {
    console.error(`Failed to update team ${teamId} answer:`, error);
    throw error;
  }
}

export async function updateAnswerScore(
  teamId: string,
  quizCode: string,
  questionId: number,
  score: number,
): Promise<Team> {
  try {
    const team = await loadTeam(teamId, quizCode);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const answerIndex = team.answers.findIndex((a) => a.question_id === questionId);
    if (answerIndex < 0) {
      throw new Error(`Answer for question ${questionId} not found`);
    }

    // Update score and is_correct based on score value
    team.answers[answerIndex].score = score;
    team.answers[answerIndex].is_correct = score === 1;

    // Recalculate total score
    team.total_score = team.answers.reduce(
      (sum, a) => sum + (a.score ?? (a.is_correct ? 1 : 0)),
      0,
    );

    await saveTeam(team);
    return team;
  } catch (error) {
    console.error(`Failed to update answer score for team ${teamId}:`, error);
    throw error;
  }
}

export async function teamExists(teamId: string, quizCode: string): Promise<boolean> {
  try {
    const filePath = path.join(TEAMS_DIR, quizCode, `${teamId}.json`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
