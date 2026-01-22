import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import './Home.css';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-header">
        <h1 className="home-title">🎯 Pub Quiz</h1>
        <p className="home-subtitle">Erstelle ein Quiz oder tritt einem bei</p>
      </div>

      <div className="home-options">
        <Card className="home-option-card">
          <h2 className="option-title">Quiz Master</h2>
          <p className="option-description">Erstelle ein neues Quiz und stelle Fragen</p>
          <Button fullWidth onClick={() => navigate('/quiz/create')}>
            Quiz erstellen
          </Button>
        </Card>

        <Card className="home-option-card">
          <h2 className="option-title">Team</h2>
          <p className="option-description">Trete einem Quiz mit deinem Team bei</p>
          <Button fullWidth variant="secondary" onClick={() => navigate('/quiz/join')}>
            Quiz beitreten
          </Button>
        </Card>
      </div>
    </div>
  );
}
