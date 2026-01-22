// Quiz type definitions
export interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
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
  selected_option: number;
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
