import { Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Pub Quiz</h1>
      <Routes>
        <Route path="/" element={<div>Home - Coming Soon</div>} />
      </Routes>
    </div>
  );
}

export default App;
