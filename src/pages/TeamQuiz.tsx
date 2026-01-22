import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, Team, Answer } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { getTeamBySessionToken, submitAnswerByToken } from '../services/api';
import { loadTeamSession, clearTeamSession } from '../utils/storage';
import { ApiError } from '../services/api';
import './TeamQuiz.css';

export function TeamQuiz() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Omit<Quiz, 'master_token'> | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    // Verify session token from URL matches stored session
    const session = loadTeamSession();
    if (!session || session.sessionToken !== sessionToken) {
      setError('Ungultige Team-Sitzung');
      setLoading(false);
      return;
    }

    loadData();

    // Poll for quiz updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [sessionToken]);

  const loadData = async () => {
    if (!sessionToken) {
      return;
    }

    try {
      const data = await getTeamBySessionToken(sessionToken);

      setQuiz(data.quiz);
      setTeam(data.team);
      setError('');

      // Initialize answers from team data
      const existingAnswers: Record<number, string> = {};
      data.team.answers.forEach((a: Answer) => {
        existingAnswers[a.question_id] = a.answer;
      });
      setAnswers((prev) => {
        // Only update if we don't have local changes
        const updated = { ...prev };
        Object.keys(existingAnswers).forEach((key) => {
          const qId = Number(key);
          if (!updated[qId]) {
            updated[qId] = existingAnswers[qId];
          }
        });
        return updated;
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Laden der Daten');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    if (!sessionToken || !quiz) {
      return;
    }

    const answer = answers[questionId]?.trim();
    if (!answer) {
      return;
    }

    setSubmittingQuestion(questionId);

    try {
      await submitAnswerByToken(sessionToken, questionId, answer);
      await loadData();
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Speichern der Antwort');
      }
    } finally {
      setSubmittingQuestion(null);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleLeaveQuiz = () => {
    clearTeamSession();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="team-quiz">
        <div className="loading">Quiz wird geladen...</div>
      </div>
    );
  }

  if (error || !quiz || !team) {
    return (
      <div className="team-quiz">
        <Card>
          <div className="error-state">
            <h2>Fehler</h2>
            <p>{error || 'Quiz oder Team nicht gefunden'}</p>
            <Button onClick={handleLeaveQuiz}>Zur Startseite</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if quiz is finished
  if (quiz.status === 'finished') {
    return (
      <div className="team-quiz">
        <Card className="finished-card">
          <h2 className="finished-title">Quiz beendet!</h2>
          <p className="finished-text">
            Danke furs Mitspielen, <strong>{team.name}</strong>!
          </p>
          <p className="score-display">
            Deine Punktzahl: <strong>{team.total_score}</strong>
          </p>
          <div className="finished-actions">
            <Button variant="secondary" onClick={handleLeaveQuiz} fullWidth>
              Zur Startseite
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if quiz is active
  if (quiz.status !== 'active') {
    return (
      <div className="team-quiz">
        <Card className="waiting-card">
          <h2 className="waiting-title">Warte auf Quiz-Start...</h2>
          <p className="waiting-text">
            Willkommen, <strong>{team.name}</strong>!
          </p>
          <p className="waiting-text">Der Quiz Master startet das Quiz in Kurze.</p>
          <Button variant="secondary" onClick={handleLeaveQuiz} fullWidth>
            Quiz verlassen
          </Button>
        </Card>
      </div>
    );
  }

  // Only show questions up to current_question_index (released by QuizMaster)
  const releasedQuestions = quiz.questions.slice(0, quiz.current_question_index + 1);
  const answeredCount = team.answers.filter((a) =>
    releasedQuestions.some((q) => q.id === a.question_id),
  ).length;

  return (
    <div className="team-quiz">
      <div className="team-quiz-header">
        <div className="team-info">
          <h1 className="team-name">{team.name}</h1>
          <div className="score">Score: {team.total_score}</div>
        </div>
        <Button variant="secondary" size="small" onClick={handleLeaveQuiz}>
          Verlassen
        </Button>
      </div>

      <div className="progress-bar">
        <div className="progress-info">
          <span>
            Frage {quiz.current_question_index + 1} von {quiz.questions.length}
          </span>
          <span>
            {answeredCount} / {releasedQuestions.length} beantwortet
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(answeredCount / releasedQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <Card className="error-notice">
          <p>{error}</p>
        </Card>
      )}

      <div className="questions-list">
        {releasedQuestions.map((question, index) => {
          const existingAnswer = team.answers.find((a) => a.question_id === question.id);
          const currentValue = answers[question.id] || '';
          const hasChanged = existingAnswer
            ? currentValue !== existingAnswer.answer
            : !!currentValue;
          const isSubmitting = submittingQuestion === question.id;

          return (
            <Card key={question.id} className="question-item">
              <div className="question-header">
                <span className="question-number">Frage {index + 1}</span>
                {existingAnswer && !hasChanged && (
                  <span className="answered-badge">Beantwortet</span>
                )}
              </div>
              <h3 className="question-text">{question.text}</h3>
              <form
                className="answer-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitAnswer(question.id);
                }}
              >
                <Input
                  value={currentValue}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Deine Antwort eingeben..."
                  fullWidth
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={!currentValue.trim() || isSubmitting || !hasChanged}
                  size="small"
                >
                  {isSubmitting ? 'Speichert...' : existingAnswer ? 'Andern' : 'Speichern'}
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
