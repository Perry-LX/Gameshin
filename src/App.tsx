import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './i18n';
import { usePageTitle } from './hooks/usePageTitle';
import { Header } from './components/Header';
import { GameList } from './components/GameList';
import { Footer } from './components/Footer';
import { SnakeGame } from './pages/SnakeGame';
import { TetrisGame } from './pages/TetrisGame';
import { ChessGame } from './pages/ChessGame';
import { ChessPlusGame } from './pages/ChessPlusGame';
import { GomokuGame } from './pages/GomokuGame';
import { InternationalChessGame } from './pages/InternationalChessGame';
import { PixelJumperGame } from './pages/PixelJumperGame';
import { games } from './data/games';
import './index.css';

function HomePage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredGames = useMemo(() => {
    const filtered = activeCategory === 'all'
      ? games
      : games.filter((game) => game.category === activeCategory);

    return [...filtered].sort((a, b) => {
      const priority = { active: 0, beta: 1, 'coming-soon': 2 };
      return (priority[a.status] ?? 2) - (priority[b.status] ?? 2);
    });
  }, [activeCategory]);

  return (
    <div className="pixel-container">
      <Header
        title={t('header.title')}
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
  usePageTitle();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/snake" element={<SnakeGame />} />
      <Route path="/game/tetris" element={<TetrisGame />} />
      <Route path="/game/chess" element={<ChessGame />} />
      <Route path="/game/chess-plus" element={<ChessPlusGame />} />
      <Route path="/game/gomoku" element={<GomokuGame />} />
      <Route path="/game/international-chess" element={<InternationalChessGame />} />
      <Route path="/game/platformer" element={<PixelJumperGame />} />
    </Routes>
  );
}

export default App;