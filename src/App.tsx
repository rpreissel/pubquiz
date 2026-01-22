import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateQuiz } from './pages/CreateQuiz';
import { QuizMaster } from './pages/QuizMaster';
import { TeamJoin } from './pages/TeamJoin';
import { TeamQuiz } from './pages/TeamQuiz';
import { Results } from './pages/Results';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/create" element={<CreateQuiz />} />
        <Route path="/quiz/join" element={<TeamJoin />} />
        <Route path="/quiz/:code/master" element={<QuizMaster />} />
        <Route path="/quiz/:code/team/:teamId" element={<TeamQuiz />} />
        <Route path="/quiz/:code/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
