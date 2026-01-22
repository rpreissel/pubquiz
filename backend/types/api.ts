import type { Quiz, Question, Team, Answer } from '../../src/types';

// Request types
export interface CreateQuizRequest {
  title: string;
  questions: Question[];
}

export interface UpdateQuizStatusRequest {
  status: 'draft' | 'active' | 'finished';
}

export interface JoinTeamRequest {
  quiz_code: string;
  team_name: string;
}

export interface SubmitAnswerRequest {
  question_id: number;
  answer: string;
}

// Response types
export interface CreateQuizResponse {
  quiz: Quiz;
}

export interface GetQuizResponse {
  quiz: Omit<Quiz, 'questions'> & {
    questions: Omit<Question, 'correct'>[];
  };
}

export interface TeamAnswerStatus {
  id: string;
  name: string;
  hasAnswered: boolean;
}

export interface GetQuizMasterResponse {
  quiz: Quiz;
  teams: TeamAnswerStatus[];
}

export interface JoinTeamResponse {
  team: Team;
}

export interface SubmitAnswerResponse {
  answer: Answer;
  total_score: number;
}

export interface GetTeamResponse {
  team: Team;
}

export interface QuizResultsResponse {
  quiz: Quiz;
  teams: TeamResult[];
}

export interface TeamResult {
  id: string;
  name: string;
  total_score: number;
  answers: Answer[];
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
}
