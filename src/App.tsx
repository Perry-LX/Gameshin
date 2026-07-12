import { useState, useMemo, type ReactNode } from 'react';
import { Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, useLanguage, type SupportedLanguage } from './i18n';
import { usePageTitle } from './hooks/usePageTitle';
import { Header } from './components/Header';
import { GameList } from './components/GameList';
import { Footer } from './components/Footer';
import { SettingsFloatingBall } from './components/SettingsFloatingBall';
import { SnakeGame } from './pages/SnakeGame';
import { TetrisGame } from './pages/TetrisGame';
import { ChessGame } from './pages/ChessGame';
import { ChessPlusGame } from './pages/ChessPlusGame';
import { GomokuGame } from './pages/GomokuGame';
import { InternationalChessGame } from './pages/InternationalChessGame';
import { PixelJumperGame } from './pages/PixelJumperGame';
import { MagicCubeGame } from './pages/MagicCubeGame';
import { games } from './data/games';
import './index.css';

function HomePage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredGames = useMemo(() => {
    const filtered = activeCategory === 'all'
      ? games
      : games.filter((game) => game.category === activeCategory);

    // Featured games to show first (in this order)
    const featured: Record<string, number> = {
      'international-chess': 1,
      'kitten-quest': 2,
      'chess-plus': 3,
      'rightplace': 4,
      'magic-cube': 5,
    };

    return [...filtered].sort((a, b) => {
      const aFeatured = featured[a.id] ?? 99;
      const bFeatured = featured[b.id] ?? 99;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;
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
        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <span className="catalog-kicker">{t('home.featuredLabel')}</span>
            <h2 id="catalog-title">{t('home.catalogTitle')}</h2>
            <p>{t('home.catalogLead')}</p>
          </div>
          <GameList games={filteredGames} />
        </section>
        <section className="home-faq-section" aria-labelledby="home-faq-title">
          <h2 id="home-faq-title">{t('home.faqTitle')}</h2>
          <div className="home-faq-grid">
            {[1, 2, 3].map((item) => (
              <article className="home-faq-item" key={item}>
                <h3>{t(`home.faq.${item}.q`)}</h3>
                <p>{t(`home.faq.${item}.a`)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <SettingsFloatingBall />
    </div>
  );
}

function LanguageRoute({ children }: { children: ReactNode }) {
  const { lang } = useParams();
  const location = useLocation();
  if (!SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}${location.pathname}${location.search}`} replace />;
  }
  return children;
}

function RootRedirect() {
  const fallback = (() => {
    try {
      const stored = localStorage.getItem('gameshin:language');
      if (SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) return stored as SupportedLanguage;
    } catch {
      // localStorage unavailable
    }
    return DEFAULT_LANGUAGE;
  })();
  return <Navigate to={`/${fallback}/`} replace />;
}

function App() {
  usePageTitle();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang/" element={<LanguageRoute><HomePage /></LanguageRoute>} />
      <Route path="/:lang/game/snake" element={<LanguageRoute><SnakeGame /></LanguageRoute>} />
      <Route path="/:lang/game/tetris" element={<LanguageRoute><TetrisGame /></LanguageRoute>} />
      <Route path="/:lang/game/chess" element={<LanguageRoute><ChessGame /></LanguageRoute>} />
      <Route path="/:lang/game/chess-plus" element={<LanguageRoute><ChessPlusGame /></LanguageRoute>} />
      <Route path="/:lang/game/gomoku" element={<LanguageRoute><GomokuGame /></LanguageRoute>} />
      <Route path="/:lang/game/international-chess" element={<LanguageRoute><InternationalChessGame /></LanguageRoute>} />
      <Route path="/:lang/game/platformer" element={<LanguageRoute><PixelJumperGame /></LanguageRoute>} />
      <Route path="/:lang/game/magic-cube" element={<LanguageRoute><MagicCubeGame /></LanguageRoute>} />
      <Route path="/game/:slug" element={<Navigate to={`/${DEFAULT_LANGUAGE}${window.location.pathname}`} replace />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
