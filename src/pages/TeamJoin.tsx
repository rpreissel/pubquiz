import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { joinTeam } from '../services/api';
import { saveTeamSession } from '../utils/storage';
import { ApiError } from '../services/api';
import './TeamJoin.css';

export function TeamJoin() {
  const navigate = useNavigate();
  const [quizCode, setQuizCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizCode.trim()) {
      setError('Bitte gib einen Quiz-Code ein');
      return;
    }

    if (!teamName.trim()) {
      setError('Bitte gib einen Team-Namen ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const team = await joinTeam(quizCode.trim().toUpperCase(), teamName.trim());

      // Save team session with the secure token
      saveTeamSession({
        sessionToken: team.session_token,
        teamName: team.name,
      });

      // Navigate to team quiz page using the secure token
      navigate(`/play/${team.session_token}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Fehler beim Beitreten des Quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="team-join">
      <div className="team-join-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Zurück
        </Button>
      </div>

      <div className="team-join-content">
        <Card className="join-card">
          <h1 className="join-title">🎯 Quiz beitreten</h1>
          <p className="join-subtitle">Gib den Quiz-Code und deinen Team-Namen ein</p>

          <form onSubmit={handleJoin}>
            <Input
              label="Quiz-Code"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              placeholder="z.B. ABC123"
              maxLength={6}
              fullWidth
              autoFocus
            />

            <Input
              label="Team-Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="z.B. Die Experten"
              fullWidth
            />

            {error && <div className="error-message">{error}</div>}

            <Button type="submit" size="large" fullWidth disabled={loading}>
              {loading ? 'Beitritt läuft...' : 'Quiz beitreten'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
