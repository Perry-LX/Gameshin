import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { games } from '../data/games';
import { stripLanguageFromPath, useLanguage, type SupportedLanguage } from '../i18n';

const SITE = 'Gameshin';
const BASE_URL = 'https://gameshin.com';
const LANGUAGE_TAGS: Record<SupportedLanguage, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

const GAME_TITLE_KEYS: Record<string, string> = {
  '/game/snake': 'game.snake.title',
  '/game/tetris': 'game.tetris.title',
  '/game/chess': 'game.chess.title',
  '/game/chess-plus': 'game.chess-plus.title',
  '/game/gomoku': 'game.gomoku.title',
  '/game/international-chess': 'game.international-chess.title',
  '/game/platformer': 'game.platformer.title',
  '/game/magic-cube': 'game.magic-cube.title',
  '/game/smack-the-sprout': 'game.smack-the-sprout.title',
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
  '/game/smack-the-sprout': 'game.smack-the-sprout.description',
};

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

function setPageSchema(schema: object) {
  let node = document.head.querySelector<HTMLScriptElement>('#gameshin-page-schema');
  if (!node) {
    node = document.createElement('script');
    node.id = 'gameshin-page-schema';
    node.type = 'application/ld+json';
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(schema);
}

export function usePageTitle() {
  const location = useLocation();
  const { lang, t, pathFor } = useLanguage();

  useEffect(() => {
    const routePath = stripLanguageFromPath(location.pathname);
    const isHome = routePath === '/';
    const languageTag = LANGUAGE_TAGS[lang];
    const pageTitle = isHome ? t('seo.title.home') : `${t(GAME_TITLE_KEYS[routePath] ?? 'seo.title.home')} | ${SITE}`;
    const description = isHome ? t('seo.description.home') : t(GAME_DESCRIPTION_KEYS[routePath] ?? 'seo.description.home');
    const canonicalPath = isHome ? `/${lang}/` : pathFor(routePath);
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    const keywords = isHome ? t('seo.categories') : `${t(GAME_TITLE_KEYS[routePath] ?? 'seo.title.home')}, ${t('seo.categories')}`;

    document.documentElement.lang = languageTag;
    document.title = pageTitle;
    setMeta('meta[name="title"]', 'content', pageTitle);
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', keywords);
    setMeta('meta[name="language"]', 'content', languageTag);
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:locale"]', 'content', lang === 'zh' ? 'zh_CN' : lang === 'ja' ? 'ja_JP' : 'en_US');
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);

    const alternateRoute = isHome ? '' : routePath;
    (Object.keys(LANGUAGE_TAGS) as SupportedLanguage[]).forEach((language) => {
      const hreflang = LANGUAGE_TAGS[language];
      setMeta(`link[rel="alternate"][hreflang="${hreflang}"]`, 'href', `${BASE_URL}/${language}${alternateRoute}${isHome ? '/' : ''}`);
    });
    setMeta('link[rel="alternate"][hreflang="x-default"]', 'href', `${BASE_URL}/en${alternateRoute}${isHome ? '/' : ''}`);

    if (isHome) {
      const playableGames = games.filter((game) => game.status !== 'coming-soon');
      setPageSchema({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${canonicalUrl}#collection`,
            name: pageTitle,
            description,
            url: canonicalUrl,
            inLanguage: languageTag,
            isPartOf: { '@id': `${BASE_URL}/#website` },
            speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.home-hero-lead', '.catalog-heading'] },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: playableGames.length,
              itemListElement: playableGames.map((game, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: t(`game.${game.id}.title`),
                url: game.url.startsWith('/') ? `${BASE_URL}/${lang}${game.url}` : game.url,
              })),
            },
          },
          {
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}#faq`,
            inLanguage: languageTag,
            mainEntity: [1, 2, 3].map((item) => ({
              '@type': 'Question',
              name: t(`home.faq.${item}.q`),
              acceptedAnswer: { '@type': 'Answer', text: t(`home.faq.${item}.a`) },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Gameshin', item: canonicalUrl }],
          },
        ],
      });
    } else {
      const game = games.find((item) => item.url === routePath);
      const gameName = t(GAME_TITLE_KEYS[routePath] ?? 'seo.title.home');
      const homeUrl = `${BASE_URL}/${lang}/`;
      setPageSchema({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            name: pageTitle,
            description,
            url: canonicalUrl,
            inLanguage: languageTag,
            isPartOf: { '@id': `${BASE_URL}/#website` },
            mainEntity: { '@id': `${canonicalUrl}#game` },
            speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '[class*="hint"]', '[class*="status"]'] },
          },
          {
            '@type': 'VideoGame',
            '@id': `${canonicalUrl}#game`,
            name: gameName,
            description,
            url: canonicalUrl,
            image: `${BASE_URL}/og-image.png`,
            gamePlatform: 'Web browser',
            applicationCategory: 'BrowserGame',
            operatingSystem: 'Any modern browser',
            isAccessibleForFree: true,
            inLanguage: languageTag,
            genre: game ? t(`game.${game.id}.tags`).split(',') : undefined,
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
            publisher: { '@id': `${BASE_URL}/#organization` },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Gameshin', item: homeUrl },
              { '@type': 'ListItem', position: 2, name: gameName, item: canonicalUrl },
            ],
          },
        ],
      });
    }
  }, [lang, location.pathname, pathFor, t]);
}
