// Quiz type definitions
export interface Question {
  id: number;
  text: string;
  correct: string;
}

export interface Quiz {
  code: string;
  title: string;
  questions: Question[];
  status: 'draft' | 'active' | 'finished';
  current_question_index: number;
  created_at: string;
}

// Team type definitions
export interface Answer {
  question_id: number;
  answer: string;
  is_correct: boolean;
}

export interface Team {
  id: string;
  quiz_code: string;
  name: string;
  answers: Answer[];
  total_score: number;
  joined_at: string;
}

// QuizMaster view types
export interface TeamAnswerStatus {
  id: string;
  name: string;
  hasAnswered: boolean;
}
