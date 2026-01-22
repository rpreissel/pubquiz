import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, Team } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { QuestionCard } from '../components/QuestionCard';
import { getQuiz, getTeam, submitAnswer } from '../services/api';
import { loadTeamSession, clearTeamSession } from '../utils/storage';
import { ApiError } from '../services/api';
import './TeamQuiz.css';

export function TeamQuiz() {
  const { code, teamId } = useParams<{ code: string; teamId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verify team session
    const session = loadTeamSession();
    if (!session || session.teamId !== teamId || session.quizCode !== code) {
      setError('Ungültige Team-Sitzung');
      setLoading(false);
      return;
    }

    loadData();

    // Poll for quiz updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [code, teamId]);

  const loadData = async () => {
    if (!code || !teamId) {
      return;
    }

    try {
      const [quizData, teamData] = await Promise.all([getQuiz(code), getTeam(teamId, code)]);

      setQuiz(quizData);
      setTeam(teamData);
      setError('');
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

  const handleSubmitAnswer = async (answer: string) => {
    if (!code || !teamId || !quiz) {
      return;
    }

    const currentQuestionIndex = quiz.current_question_index;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) {
      return;
    }

    setSubmitting(true);

    try {
      await submitAnswer(teamId, code, currentQuestion.id, answer);
      await loadData();
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Speichern der Antwort');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveQuiz = () => {
    clearTeamSession();
    navigate('/');
  };

  const handleViewResults = () => {
    navigate(`/quiz/${code}/results`);
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
            Danke fürs Mitspielen, <strong>{team.name}</strong>!
          </p>
          <p className="score-display">
            Deine Punktzahl: <strong>{team.total_score}</strong>
          </p>
          <div className="finished-actions">
            <Button onClick={handleViewResults} size="large" fullWidth>
              Ergebnisse anzeigen
            </Button>
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
          <p className="waiting-text">Der Quiz Master startet das Quiz in Kürze.</p>
          <Button variant="secondary" onClick={handleLeaveQuiz} fullWidth>
            Quiz verlassen
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestionIndex = quiz.current_question_index;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const existingAnswer = team.answers.find((a) => a.question_id === currentQuestion.id);
  const hasAnswered = !!existingAnswer;

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
            Frage {currentQuestionIndex + 1} von {quiz.questions.length}
          </span>
          <span>
            {team.answers.length} / {quiz.questions.length} beantwortet
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(team.answers.length / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        answer={existingAnswer?.answer}
        onSubmitAnswer={hasAnswered ? undefined : handleSubmitAnswer}
        disabled={hasAnswered || submitting}
      />

      {error && (
        <Card className="error-notice">
          <p>{error}</p>
        </Card>
      )}

      {hasAnswered && (
        <Card className="answer-actions">
          <div className="answered-notice">
            <p>Antwort wurde gespeichert</p>
            <p className="waiting-text">Warte auf die nächste Frage vom Quiz Master...</p>
          </div>
        </Card>
      )}
    </div>
  );
}
