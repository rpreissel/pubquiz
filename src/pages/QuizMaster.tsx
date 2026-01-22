import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, TeamAnswerStatus } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { QuestionCard } from '../components/QuestionCard';
import { getQuizMaster, updateQuizStatus, updateCurrentQuestion } from '../services/api';
import { ApiError } from '../services/api';
import './QuizMaster.css';

export function QuizMaster() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [teams, setTeams] = useState<TeamAnswerStatus[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) {
      return;
    }

    loadQuiz();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadQuiz, 5000);
    return () => clearInterval(interval);
  }, [code]);

  const loadQuiz = async () => {
    if (!code) {
      return;
    }

    try {
      const data = await getQuizMaster(code);
      setQuiz(data.quiz);
      setTeams(data.teams);
      // Sync local state with server state
      setCurrentQuestionIndex(data.quiz.current_question_index);
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Laden des Quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!code || !quiz) {
      return;
    }

    try {
      await updateQuizStatus(code, 'active');
      await loadQuiz();
    } catch (err) {
      setError('Fehler beim Starten des Quiz');
    }
  };

  const handleFinishQuiz = async () => {
    if (!code || !quiz) {
      return;
    }

    try {
      await updateQuizStatus(code, 'finished');
      navigate(`/quiz/${code}/results`);
    } catch (err) {
      setError('Fehler beim Beenden des Quiz');
    }
  };

  const handleNextQuestion = async () => {
    if (!code || !quiz || currentQuestionIndex >= quiz.questions.length - 1) {
      return;
    }

    const newIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(newIndex);

    try {
      await updateCurrentQuestion(code, newIndex);
    } catch (err) {
      setError('Fehler beim Aktualisieren der Frage');
    }
  };

  const handlePrevQuestion = async () => {
    if (!code || currentQuestionIndex <= 0) {
      return;
    }

    const newIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(newIndex);

    try {
      await updateCurrentQuestion(code, newIndex);
    } catch (err) {
      setError('Fehler beim Aktualisieren der Frage');
    }
  };

  if (loading) {
    return (
      <div className="quiz-master">
        <div className="loading">Quiz wird geladen...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-master">
        <Card>
          <div className="error-state">
            <h2>❌ Fehler</h2>
            <p>{error || 'Quiz nicht gefunden'}</p>
            <Button onClick={() => navigate('/')}>Zurück zur Startseite</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="quiz-master">
      <div className="quiz-master-header">
        <div className="header-top">
          <h1 className="quiz-title">{quiz.title}</h1>
          <div className={`status-badge status-badge--${quiz.status}`}>
            {quiz.status === 'draft' && 'Entwurf'}
            {quiz.status === 'active' && 'Aktiv'}
            {quiz.status === 'finished' && 'Beendet'}
          </div>
        </div>
        <div className="quiz-code-display">
          <span className="code-label">Quiz-Code:</span>
          <span className="code-value">{quiz.code}</span>
          <button
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(quiz.code);
            }}
            title="Code kopieren"
          >
            📋
          </button>
        </div>
      </div>

      {quiz.status === 'draft' && (
        <>
          <Card className="draft-notice">
            <h3>Quiz ist bereit!</h3>
            <p>
              Teile den Code <strong>{quiz.code}</strong> mit den Teams. Sobald alle beigetreten
              sind, starte das Quiz.
            </p>
            <Button size="large" onClick={handleStartQuiz}>
              Quiz starten
            </Button>
          </Card>

          <Card className="team-status">
            <h3>Beigetretene Teams ({teams.length})</h3>
            {teams.length === 0 ? (
              <p className="no-teams">Noch keine Teams beigetreten</p>
            ) : (
              <ul className="team-list">
                {teams.map((team) => (
                  <li key={team.id} className="team-item waiting">
                    <span className="team-name">{team.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {quiz.status === 'active' && (
        <>
          <Card className="question-navigation">
            <div className="navigation-info">
              <span className="question-counter">
                Frage {currentQuestionIndex + 1} von {quiz.questions.length}
              </span>
              <div className="navigation-buttons">
                <Button
                  variant="secondary"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Vorherige
                </Button>
                {!isLastQuestion ? (
                  <Button onClick={handleNextQuestion}>Nächste →</Button>
                ) : (
                  <Button variant="danger" onClick={handleFinishQuiz}>
                    Quiz beenden
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <QuestionCard question={currentQuestion} showCorrect disabled />

          <Card className="master-controls">
            <h3>Quiz Master Ansicht</h3>
            <div className="correct-answer-info">
              <strong>Korrekte Antwort:</strong>{' '}
              <span className="correct-answer-text">{currentQuestion.correct}</span>
            </div>
          </Card>

          <Card className="team-status">
            <h3>
              Teams ({teams.filter((t) => t.hasAnswered).length}/{teams.length} beantwortet)
            </h3>
            {teams.length === 0 ? (
              <p className="no-teams">Noch keine Teams beigetreten</p>
            ) : (
              <ul className="team-list">
                {teams.map((team) => (
                  <li
                    key={team.id}
                    className={`team-item ${team.hasAnswered ? 'answered' : 'waiting'}`}
                  >
                    <span className="team-name">{team.name}</span>
                    <span className="team-status-indicator">{team.hasAnswered ? '✓' : '...'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {quiz.status === 'finished' && (
        <Card>
          <div className="finished-state">
            <h2>✅ Quiz beendet</h2>
            <p>Das Quiz wurde erfolgreich beendet.</p>
            <Button onClick={() => navigate(`/quiz/${code}/results`)}>Ergebnisse anzeigen</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
