import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stripLanguageFromPath, useLanguage } from '../i18n';

const SITE = 'Gameshin';
const BASE_URL = 'https://gameshin.com';

const GAME_TITLE_KEYS: Record<string, string> = {
  '/game/snake': 'game.snake.title',
  '/game/tetris': 'game.tetris.title',
  '/game/chess': 'game.chess.title',
  '/game/chess-plus': 'game.chess-plus.title',
  '/game/gomoku': 'game.gomoku.title',
  '/game/international-chess': 'game.international-chess.title',
  '/game/platformer': 'game.platformer.title',
  '/game/magic-cube': 'game.magic-cube.title',
};

const GAME_DESCRIPTION_KEYS: Record<string, string> = {
  '/game/snake': 'game.snake.description',
  '/game/tetris': 'game.tetris.description',
  '/game/chess': 'game.chess.description',
  '/game/chess-plus': 'game.chess-plus.description',
  '/game/gomoku': 'game.gomoku.description',
  '/game/international-chess': 'game.international-chess.description',
  '/game/platformer': 'game.platformer.description',
  '/game/magic-cube': 'game.magic-cube.description',
};

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const node = document.head.querySelector(selector);
  if (node) node.setAttribute(attr, value);
}

export function usePageTitle() {
  const location = useLocation();
  const { lang, t, pathFor } = useLanguage();

  useEffect(() => {
    const routePath = stripLanguageFromPath(location.pathname);
    const isHome = routePath === '/';
    const pageTitle = isHome ? t('seo.title.home') : `${t(GAME_TITLE_KEYS[routePath] ?? 'seo.title.home')} | ${SITE}`;
    const description = isHome ? t('seo.description.home') : t(GAME_DESCRIPTION_KEYS[routePath] ?? 'seo.description.home');
    const canonicalPath = isHome ? `/${lang}/` : pathFor(routePath);
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;

    document.title = pageTitle;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="language"]', 'content', lang === 'zh' ? 'zh-CN' : lang);
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:locale"]', 'content', lang === 'zh' ? 'zh_CN' : lang === 'ja' ? 'ja_JP' : 'en_US');
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
  }, [lang, location.pathname, pathFor, t]);
}
