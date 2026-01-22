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

export async function getQuiz(code: string): Promise<Quiz> {
  const response = await fetch(`${API_BASE_URL}/quiz/${code}`);
  const data = await handleResponse<{ quiz: Quiz }>(response);
  return data.quiz;
}

export async function getQuizMaster(
  code: string,
): Promise<{ quiz: Quiz; teams: TeamAnswerStatus[] }> {
  const response = await fetch(`${API_BASE_URL}/quiz/${code}/master`);
  return handleResponse(response);
}

export async function updateQuizStatus(
  code: string,
  status: 'draft' | 'active' | 'finished',
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quiz/${code}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  await handleResponse(response);
}

export async function updateCurrentQuestion(code: string, questionIndex: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quiz/${code}/question`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIndex }),
  });

  await handleResponse(response);
}

export async function getQuizResults(code: string): Promise<{ quiz: Quiz; teams: Team[] }> {
  const response = await fetch(`${API_BASE_URL}/quiz/${code}/results`);
  return handleResponse(response);
}

// Team API
export async function joinTeam(quizCode: string, teamName: string): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/team/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_code: quizCode, team_name: teamName }),
  });

  const data = await handleResponse<{ team: Team }>(response);
  return data.team;
}

export async function submitAnswer(
  teamId: string,
  quizCode: string,
  questionId: number,
  answer: string,
): Promise<{ answer: Answer; total_score: number }> {
  const response = await fetch(`${API_BASE_URL}/team/${teamId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quiz_code: quizCode,
      question_id: questionId,
      answer,
    }),
  });

  return handleResponse(response);
}

export async function getTeam(teamId: string, quizCode: string): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/team/${teamId}?quiz_code=${quizCode}`);
  const data = await handleResponse<{ team: Team }>(response);
  return data.team;
}

export { ApiError };
