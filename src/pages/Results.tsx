import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, Team } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { getQuizResults } from '../services/api';
import { ApiError } from '../services/api';
import './Results.css';

export function Results() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) {
      return;
    }

    loadResults();
  }, [code]);

  const loadResults = async () => {
    if (!code) {
      return;
    }

    try {
      const data = await getQuizResults(code);
      setQuiz(data.quiz);
      setTeams(data.teams);
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Laden der Ergebnisse');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results">
        <div className="loading">Ergebnisse werden geladen...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="results">
        <Card>
          <div className="error-state">
            <h2>❌ Fehler</h2>
            <p>{error || 'Quiz nicht gefunden'}</p>
            <Button onClick={() => navigate('/')}>Zur Startseite</Button>
          </div>
        </Card>
      </div>
    );
  }

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="results">
      <div className="results-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Zur Startseite
        </Button>
        <h1 className="results-title">🏆 Ergebnisse</h1>
        <div className="quiz-info">
          <h2 className="quiz-name">{quiz.title}</h2>
          <p className="quiz-meta">
            {quiz.questions.length} Fragen • {teams.length} Teams
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card className="no-teams">
          <p>Noch keine Teams haben teilgenommen.</p>
        </Card>
      ) : (
        <div className="scoreboard">
          <h2 className="scoreboard-title">Rangliste</h2>
          <div className="teams-list">
            {teams.map((team, index) => {
              const rank = index + 1;
              const medal = getMedalEmoji(rank);

              return (
                <Card key={team.id} className={`team-result rank-${rank}`}>
                  <div className="team-rank">
                    {medal || <span className="rank-number">#{rank}</span>}
                  </div>
                  <div className="team-details">
                    <h3 className="team-name">{team.name}</h3>
                    <div className="team-stats">
                      <span className="stat">
                        {team.answers.filter((a) => a.is_correct).length} / {quiz.questions.length}{' '}
                        richtig
                      </span>
                      <span className="stat-separator">•</span>
                      <span className="stat">{team.total_score} Punkte</span>
                    </div>
                  </div>
                  <div className="team-score">{team.total_score}</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="quiz-details">
        <h3 className="details-title">Quiz-Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Fragen:</span>
            <span className="detail-value">{quiz.questions.length}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Teams:</span>
            <span className="detail-value">{teams.length}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Quiz-Code:</span>
            <span className="detail-value">{quiz.code}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">
              {quiz.status === 'finished' ? 'Beendet' : quiz.status}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
