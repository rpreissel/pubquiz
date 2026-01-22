import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, Team } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { getQuizResults, updateAnswerScore } from '../services/api';
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

  const handleScoreChange = async (teamId: string, questionId: number, score: number) => {
    if (!code) return;

    try {
      const updatedTeam = await updateAnswerScore(teamId, code, questionId, score);

      // Update the teams state with the updated team
      setTeams((prevTeams) =>
        prevTeams
          .map((team) => (team.id === teamId ? updatedTeam : team))
          .sort((a, b) => b.total_score - a.total_score),
      );
    } catch (err) {
      console.error('Failed to update score:', err);
    }
  };

  const getScoreClass = (score: number | undefined): string => {
    if (score === 1) return 'answer-correct';
    if (score === 0.5) return 'answer-half';
    return 'answer-wrong';
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
        <>
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
                          {team.answers.filter((a) => a.is_correct).length} /{' '}
                          {quiz.questions.length} richtig
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

          <Card className="answers-overview">
            <h3 className="answers-title">Antworten aller Teams</h3>
            <div className="answers-table-container">
              <table className="answers-table">
                <thead>
                  <tr>
                    <th className="question-column">Frage</th>
                    {teams.map((team) => (
                      <th key={team.id} className="team-column">
                        {team.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quiz.questions.map((question, qIndex) => (
                    <tr key={question.id}>
                      <td className="question-cell">
                        <div className="question-number">Frage {qIndex + 1}</div>
                        <div className="question-text-small">{question.text}</div>
                        <div className="correct-answer-small">
                          Korrekt: <strong>{question.correct}</strong>
                        </div>
                      </td>
                      {teams.map((team) => {
                        const answer = team.answers.find((a) => a.question_id === question.id);
                        const currentScore = answer?.score ?? (answer?.is_correct ? 1 : 0);
                        return (
                          <td
                            key={team.id}
                            className={`answer-cell ${getScoreClass(currentScore)}`}
                          >
                            <div className="answer-text-cell">{answer?.answer || '-'}</div>
                            {answer && (
                              <div className="score-buttons">
                                <button
                                  className={`score-btn ${currentScore === 0 ? 'active' : ''}`}
                                  onClick={() => handleScoreChange(team.id, question.id, 0)}
                                  title="0 Punkte"
                                >
                                  0
                                </button>
                                <button
                                  className={`score-btn ${currentScore === 0.5 ? 'active' : ''}`}
                                  onClick={() => handleScoreChange(team.id, question.id, 0.5)}
                                  title="0.5 Punkte"
                                >
                                  ½
                                </button>
                                <button
                                  className={`score-btn ${currentScore === 1 ? 'active' : ''}`}
                                  onClick={() => handleScoreChange(team.id, question.id, 1)}
                                  title="1 Punkt"
                                >
                                  1
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
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
