import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { QuestionForm } from '../components/QuestionForm';
import { Card } from '../components/Card';
import { createQuiz } from '../services/api';
import { parseCSV, downloadCSVTemplate } from '../utils/csv';
import './CreateQuiz.css';

export function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = (question: Omit<Question, 'id'>) => {
    setQuestions([...questions, question]);
    setShowQuestionForm(false);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedQuestions = parseCSV(csvText);
        setQuestions([...questions, ...parsedQuestions]);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim CSV-Import');
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      setError('Bitte gib einen Quiz-Titel ein');
      return;
    }

    if (questions.length === 0) {
      setError('Bitte füge mindestens eine Frage hinzu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quiz = await createQuiz(title.trim(), questions);
      navigate(`/quiz/${quiz.code}/master`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz">
      <div className="create-quiz-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Zurück
        </Button>
        <h1 className="page-title">Quiz erstellen</h1>
      </div>

      <div className="create-quiz-content">
        <Card className="quiz-settings">
          <Input
            label="Quiz-Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Pub Quiz 2026"
            fullWidth
          />

          <div className="csv-section">
            <div className="csv-actions">
              <label className="csv-upload-button">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  style={{ display: 'none' }}
                />
                <Button type="button" variant="secondary" fullWidth>
                  📄 CSV importieren
                </Button>
              </label>
              <Button type="button" variant="secondary" fullWidth onClick={downloadCSVTemplate}>
                ⬇ Template herunterladen
              </Button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </Card>

        <div className="questions-section">
          <div className="section-header">
            <h2 className="section-title">Fragen ({questions.length})</h2>
            {!showQuestionForm && (
              <Button onClick={() => setShowQuestionForm(true)}>+ Frage hinzufügen</Button>
            )}
          </div>

          {showQuestionForm && (
            <QuestionForm
              onAddQuestion={handleAddQuestion}
              onCancel={() => setShowQuestionForm(false)}
            />
          )}

          {questions.length > 0 && (
            <div className="questions-list">
              {questions.map((question, index) => (
                <Card key={index} className="question-preview">
                  <div className="question-preview-header">
                    <h3 className="question-preview-title">
                      Frage {index + 1}: {question.text}
                    </h3>
                    <button
                      className="remove-question"
                      onClick={() => handleRemoveQuestion(index)}
                      title="Frage entfernen"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="question-preview-options">
                    {question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`preview-option ${i === question.correct ? 'preview-option--correct' : ''}`}
                      >
                        <span className="preview-option-label">{String.fromCharCode(65 + i)}</span>
                        {opt}
                        {i === question.correct && <span className="correct-badge">✓</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <Button
              size="large"
              fullWidth
              onClick={handleCreateQuiz}
              disabled={loading || !title.trim()}
            >
              {loading ? 'Quiz wird erstellt...' : 'Quiz erstellen & Code generieren'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
