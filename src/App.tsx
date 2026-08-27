import { Suspense, lazy, useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from 'react';
import { Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, useLanguage, type SupportedLanguage } from './i18n';
import { usePageTitle } from './hooks/usePageTitle';
import { Header } from './components/Header';
import { ScrollWorldHero } from './components/ScrollWorldHero';
import { GameList } from './components/GameList';
import { Footer } from './components/Footer';
import { SettingsFloatingBall } from './components/SettingsFloatingBall';
import { GameAnalyticsBoundary } from './components/GameAnalyticsBoundary';
import { games } from './data/games';
import { trackEvent } from './analytics';
import './index.css';
import './vibe.css';
import './scroll-world.css';
import './game-chrome.css';

const SnakeGame = lazy(() => import('./pages/SnakeGame').then((module) => ({ default: module.SnakeGame })));
const TetrisGame = lazy(() => import('./pages/TetrisGame').then((module) => ({ default: module.TetrisGame })));
const ChessGame = lazy(() => import('./pages/ChessGame').then((module) => ({ default: module.ChessGame })));
const ChessPlusGame = lazy(() => import('./pages/ChessPlusGame').then((module) => ({ default: module.ChessPlusGame })));
const GomokuGame = lazy(() => import('./pages/GomokuGame').then((module) => ({ default: module.GomokuGame })));
const InternationalChessGame = lazy(() => import('./pages/InternationalChessGame').then((module) => ({ default: module.InternationalChessGame })));
const PixelJumperGame = lazy(() => import('./pages/PixelJumperGame').then((module) => ({ default: module.PixelJumperGame })));
const MagicCubeGame = lazy(() => import('./pages/MagicCubeGame').then((module) => ({ default: module.MagicCubeGame })));
const SmackTheSproutGame = lazy(() => import('./pages/SmackTheSproutGame').then((module) => ({ default: module.SmackTheSproutGame })));

function readFavoriteIds() {
  try {
    const saved = JSON.parse(localStorage.getItem('gameshin:favorites') ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function HomePage() {
  const { t, lang } = useLanguage();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const catalogRef = useRef<HTMLElement>(null);
  const hasTrackedCatalogView = useRef(false);

  useEffect(() => {
    const catalog = catalogRef.current;
    if (!catalog || hasTrackedCatalogView.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || hasTrackedCatalogView.current) return;
      hasTrackedCatalogView.current = true;
      void trackEvent('catalog_view', { locale: lang, filter: 'all' });
      observer.disconnect();
    }, { threshold: 0.25 });

    observer.observe(catalog);
    return () => observer.disconnect();
  }, [lang]);

  useEffect(() => {
    if (location.hash !== '#game-collection') return;

    const frame = requestAnimationFrame(() => {
      document.getElementById('game-collection')?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavoriteIds());
    window.addEventListener('storage', syncFavorites);
    window.addEventListener('gameshin:favorites-changed', syncFavorites);
    return () => {
      window.removeEventListener('storage', syncFavorites);
      window.removeEventListener('gameshin:favorites-changed', syncFavorites);
    };
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    if (category !== activeCategory) {
      void trackEvent('catalog_filter_changed', { locale: lang, category });
    }
    setActiveCategory(category);
  }, [activeCategory, lang]);

  const filteredGames = useMemo(() => {
    const playableGames = games.filter((game) => game.status !== 'coming-soon');
    const favoriteSet = new Set(favoriteIds);
    const filtered = activeCategory === 'all'
      ? playableGames
      : activeCategory === 'favorites'
        ? playableGames.filter((game) => favoriteSet.has(game.id))
        : playableGames.filter((game) => game.category === activeCategory);

    // Featured games to show first (in this order)
    const featured: Record<string, number> = {
      'smack-the-sprout': 1,
      'cat-painter': 2,
      'international-chess': 3,
      'kitten-quest': 4,
      'chess-plus': 5,
      'rightplace': 6,
      'magic-cube': 7,
    };

    return [...filtered].sort((a, b) => {
      const aFeatured = featured[a.id] ?? 99;
      const bFeatured = featured[b.id] ?? 99;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;
      const priority = { active: 0, beta: 1, 'coming-soon': 2 };
      return (priority[a.status] ?? 2) - (priority[b.status] ?? 2);
    });
  }, [activeCategory, favoriteIds]);

  return (
    <div className={`home-shell${location.hash === '#game-collection' ? ' home-shell--catalog-arrival' : ''}`}>
      <a className="skip-link" href="#main-content">{t('home.skipToGames')}</a>
      <ScrollWorldHero onExplore={handleCategoryChange} />
      <div className="site-container">
        <Header activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
        <main id="main-content" tabIndex={-1}>
          <section ref={catalogRef} className="catalog-section" aria-labelledby="catalog-title">
            <div className="catalog-heading">
              <div className="catalog-heading-title">
                <span className="section-eyebrow">{t('home.catalogEyebrow')}</span>
                <h2 id="catalog-title">{t('home.catalogTitle')}</h2>
              </div>
              <p>{t('home.catalogLead')}</p>
            </div>
            <GameList games={filteredGames} isFavorites={activeCategory === 'favorites'} />
          </section>
          <section className="home-faq-section" aria-labelledby="home-faq-title">
            <div className="home-faq-heading">
              <span className="section-eyebrow">{t('home.faqEyebrow')}</span>
              <h2 id="home-faq-title">{t('home.faqTitle')}</h2>
              <p>{t('home.faqLead')}</p>
            </div>
            <div className="home-faq-list">
              {[1, 2, 3].map((item) => (
                <details className="home-faq-item" key={item} open={item === 1 ? true : undefined}>
                  <summary>
                    <span>{t(`home.faq.${item}.q`)}</span>
                    <span className="home-faq-toggle" aria-hidden="true" />
                  </summary>
                  <p>{t(`home.faq.${item}.a`)}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
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
    <Suspense fallback={<div className="route-loading" role="status"><span className="route-loading-spinner" aria-hidden="true" />Loading game…</div>}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:lang/" element={<LanguageRoute><HomePage /></LanguageRoute>} />
        <Route path="/:lang/game/snake" element={<LanguageRoute><TrackedGame gameId="snake" category="action"><SnakeGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/tetris" element={<LanguageRoute><TrackedGame gameId="tetris" category="puzzle"><TetrisGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/chess" element={<LanguageRoute><TrackedGame gameId="chess" category="board"><ChessGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/chess-plus" element={<LanguageRoute><TrackedGame gameId="chess-plus" category="board"><ChessPlusGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/gomoku" element={<LanguageRoute><TrackedGame gameId="gomoku" category="board"><GomokuGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/international-chess" element={<LanguageRoute><TrackedGame gameId="international-chess" category="board"><InternationalChessGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/platformer" element={<LanguageRoute><TrackedGame gameId="platformer" category="action"><PixelJumperGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/magic-cube" element={<LanguageRoute><TrackedGame gameId="magic-cube" category="puzzle"><MagicCubeGame /></TrackedGame></LanguageRoute>} />
        <Route path="/:lang/game/smack-the-sprout" element={<LanguageRoute><TrackedGame gameId="smack-the-sprout" category="action"><SmackTheSproutGame /></TrackedGame></LanguageRoute>} />
        <Route path="/game/:slug" element={<Navigate to={`/${DEFAULT_LANGUAGE}${window.location.pathname}`} replace />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}

function TrackedGame({ gameId, category, children }: { gameId: string; category: string; children: ReactNode }) {
  const location = useLocation();

  // A game must always open at its own start, regardless of the scroll position on the catalog.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return <GameAnalyticsBoundary gameId={gameId} category={category}>{children}</GameAnalyticsBoundary>;
}

export default App;
