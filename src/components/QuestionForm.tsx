import { useState } from 'react';
import type { Question } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import './QuestionForm.css';

interface QuestionFormProps {
  onAddQuestion: (question: Omit<Question, 'id'>) => void;
  onCancel?: () => void;
  initialData?: Omit<Question, 'id'>;
  editMode?: boolean;
}

export function QuestionForm({
  onAddQuestion,
  onCancel,
  initialData,
  editMode = false,
}: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(initialData?.text || '');
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correct || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!questionText.trim()) {
      newErrors.question = 'Frage darf nicht leer sein';
    }

    if (!correctAnswer.trim()) {
      newErrors.correct = 'Korrekte Antwort darf nicht leer sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onAddQuestion({
      text: questionText.trim(),
      correct: correctAnswer.trim(),
    });

    // Reset form if not in edit mode
    if (!editMode) {
      setQuestionText('');
      setCorrectAnswer('');
      setErrors({});
    }
  };

  return (
    <Card className="question-form">
      <h3 className="question-form-title">
        {editMode ? 'Frage bearbeiten' : 'Neue Frage hinzufügen'}
      </h3>

      <form onSubmit={handleSubmit}>
        <Input
          label="Frage"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="z.B. Welche Farbe hat der Himmel?"
          error={errors.question}
          fullWidth
        />

        <Input
          label="Korrekte Antwort"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder="z.B. Blau"
          error={errors.correct}
          fullWidth
        />

        <div className="form-actions">
          <Button type="submit" fullWidth>
            {editMode ? 'Speichern' : 'Frage hinzufügen'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
              Abbrechen
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
