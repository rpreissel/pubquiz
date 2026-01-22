import { useState } from 'react';
import type { Question } from '../types';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question | Omit<Question, 'correct'>;
  answer?: string;
  onSubmitAnswer?: (answer: string) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  answer,
  onSubmitAnswer,
  showCorrect = false,
  disabled = false,
}: QuestionCardProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onSubmitAnswer) {
      onSubmitAnswer(inputValue.trim());
    }
  };

  const hasCorrect = 'correct' in question;
  const isCorrect =
    hasCorrect && showCorrect && answer?.toLowerCase() === question.correct.toLowerCase();
  const isWrong =
    hasCorrect && showCorrect && answer && answer.toLowerCase() !== question.correct.toLowerCase();

  return (
    <Card className="question-card">
      <h3 className="question-text">{question.text}</h3>

      {disabled && answer ? (
        <div
          className={`answer-display ${isCorrect ? 'answer-display--correct' : ''} ${isWrong ? 'answer-display--wrong' : ''}`}
        >
          <span className="answer-label">Deine Antwort:</span>
          <span className="answer-text">{answer}</span>
          {showCorrect && hasCorrect && (
            <div className="correct-answer">
              <span className="answer-label">Korrekte Antwort:</span>
              <span className="answer-text">{question.correct}</span>
            </div>
          )}
        </div>
      ) : disabled ? (
        <p className="waiting-text">Warte auf die Frage...</p>
      ) : (
        <form onSubmit={handleSubmit} className="answer-form">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Deine Antwort eingeben..."
            fullWidth
            disabled={disabled}
          />
          <Button type="submit" disabled={!inputValue.trim()}>
            Antwort abschicken
          </Button>
        </form>
      )}
    </Card>
  );
}
