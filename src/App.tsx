import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { GameList } from './components/GameList';
import { Footer } from './components/Footer';
import { SnakeGame } from './pages/SnakeGame';
import { TetrisGame } from './pages/TetrisGame';
import { games } from './data/games';
import './index.css';

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredGames = useMemo(() => {
    if (activeCategory === 'all') return games;
    return games.filter((game) => game.status === activeCategory);
  }, [activeCategory]);

  return (
    <div className="pixel-container">
      <Header
        title="探索Vibe-Games，开启游戏之旅"
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <main>
        <GameList games={filteredGames} />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/snake" element={<SnakeGame />} />
      <Route path="/game/tetris" element={<TetrisGame />} />
    </Routes>
  );
}

export default App;