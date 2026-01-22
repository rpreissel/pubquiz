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
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(initialData?.correct ?? -1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!questionText.trim()) {
      newErrors.question = 'Frage darf nicht leer sein';
    }

    options.forEach((opt, index) => {
      if (!opt.trim()) {
        newErrors[`option${index}`] =
          `Option ${String.fromCharCode(65 + index)} darf nicht leer sein`;
      }
    });

    if (correctIndex === -1) {
      newErrors.correct = 'Bitte markiere die korrekte Antwort';
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
      options: options.map((opt) => opt.trim()),
      correct: correctIndex,
    });

    // Reset form if not in edit mode
    if (!editMode) {
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectIndex(-1);
      setErrors({});
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

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
          placeholder="z.B. Welche Farbe ist der Himmel?"
          error={errors.question}
          fullWidth
        />

        <div className="options-section">
          <label className="section-label">Antwortoptionen</label>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${optionLabels[index]}`}
                error={errors[`option${index}`]}
                fullWidth
              />
              <button
                type="button"
                className={`correct-marker ${correctIndex === index ? 'correct-marker--active' : ''}`}
                onClick={() => setCorrectIndex(index)}
                title="Als korrekte Antwort markieren"
              >
                {correctIndex === index ? '✓' : '○'}
              </button>
            </div>
          ))}
          {errors.correct && <span className="input-error">{errors.correct}</span>}
        </div>

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
