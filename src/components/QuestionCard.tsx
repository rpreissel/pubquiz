import type { Question } from '../types';
import { Card } from './Card';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question | Omit<Question, 'correct'>;
  selectedOption?: number;
  onSelectOption?: (optionIndex: number) => void;
  showCorrect?: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  selectedOption,
  onSelectOption,
  showCorrect = false,
  disabled = false,
}: QuestionCardProps) {
  const getOptionClass = (index: number): string => {
    const classes = ['question-option'];

    if (selectedOption === index) {
      classes.push('question-option--selected');
    }

    if (showCorrect && 'correct' in question) {
      if (index === question.correct) {
        classes.push('question-option--correct');
      } else if (selectedOption === index) {
        classes.push('question-option--wrong');
      }
    }

    if (disabled) {
      classes.push('question-option--disabled');
    }

    return classes.join(' ');
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <Card className="question-card">
      <h3 className="question-text">{question.text}</h3>
      <div className="question-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(index)}
            onClick={() => onSelectOption && onSelectOption(index)}
            disabled={disabled || !onSelectOption}
          >
            <span className="option-label">{optionLabels[index]}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
