import type { Quiz, Question, Team, Answer, TeamAnswerStatus } from '../types';

const API_BASE_URL = '/api';

// Error handling helper
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown Error',
      message: 'An unexpected error occurred',
    }));
    throw new ApiError(error.message || 'Request failed', response.status);
  }
  return response.json();
}

// Quiz API
export async function createQuiz(title: string, questions: Omit<Question, 'id'>[]): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quiz/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, questions }),
  });

  const data = await handleResponse<{ quiz: Quiz }>(response);
  return data.quiz;
}

// Token-based Quiz Master API
export async function getQuizByMasterToken(
  masterToken: string,
): Promise<{ quiz: Quiz; teams: TeamAnswerStatus[] }> {
  const response = await fetch(`${API_BASE_URL}/quiz/master/${masterToken}`);
  return handleResponse(response);
}

export async function updateQuizStatusByToken(
  masterToken: string,
  status: 'draft' | 'active' | 'finished',
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quiz/master/${masterToken}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  await handleResponse(response);
}

export async function updateCurrentQuestionByToken(
  masterToken: string,
  questionIndex: number,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quiz/master/${masterToken}/question`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIndex }),
  });

  await handleResponse(response);
}

export async function getQuizResultsByToken(
  masterToken: string,
): Promise<{ quiz: Quiz; teams: Team[] }> {
  const response = await fetch(`${API_BASE_URL}/quiz/master/${masterToken}/results`);
  return handleResponse(response);
}

// Team API - for joining (still uses quiz code)
export async function joinTeam(quizCode: string, teamName: string): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/team/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_code: quizCode, team_name: teamName }),
  });

  const data = await handleResponse<{ team: Team }>(response);
  return data.team;
}

// Token-based Team API
export async function getTeamBySessionToken(
  sessionToken: string,
): Promise<{ team: Team; quiz: Omit<Quiz, 'master_token'> }> {
  const response = await fetch(`${API_BASE_URL}/team/session/${sessionToken}`);
  return handleResponse(response);
}

export async function submitAnswerByToken(
  sessionToken: string,
  questionId: number,
  answer: string,
): Promise<{ answer: Answer; total_score: number }> {
  const response = await fetch(`${API_BASE_URL}/team/session/${sessionToken}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      answer,
    }),
  });

  return handleResponse(response);
}

// Score update (still uses team ID + quiz code for now, called from results page)
export async function updateAnswerScore(
  teamId: string,
  quizCode: string,
  questionId: number,
  score: number,
): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/team/${teamId}/score`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quiz_code: quizCode,
      question_id: questionId,
      score,
    }),
  });

  const data = await handleResponse<{ team: Team }>(response);
  return data.team;
}

export { ApiError };
