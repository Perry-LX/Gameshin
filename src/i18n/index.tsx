import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { en } from './en';
import { ja } from './ja';
import { zh } from './zh';

export type SupportedLanguage = 'en' | 'zh' | 'ja';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'zh', 'ja'];
export const LANGUAGE_OPTIONS: Array<{ code: SupportedLanguage; label: string; nativeLabel: string; htmlLang: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English', htmlLang: 'en' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', htmlLang: 'zh-CN' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', htmlLang: 'ja' },
];

const STORAGE_KEY = 'gameshin:language';

const translations: Record<SupportedLanguage, Record<string, string>> = { en, zh, ja };

function isSupportedLanguage(value: string | undefined): value is SupportedLanguage {
  return !!value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

function getBrowserLanguage(): SupportedLanguage {
  const language = navigator.language.toLowerCase();
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  return DEFAULT_LANGUAGE;
}

export function getLanguageFromPath(pathname: string): SupportedLanguage | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isSupportedLanguage(segment) ? segment : null;
}

export function withLanguagePath(pathname: string, lang: SupportedLanguage): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isSupportedLanguage(parts[0])) parts[0] = lang;
  else parts.unshift(lang);
  return `/${parts.join('/') || lang}`;
}

export function stripLanguageFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isSupportedLanguage(parts[0])) parts.shift();
  return `/${parts.join('/')}`;
}

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  languageOptions: typeof LANGUAGE_OPTIONS;
  pathFor: (path: string, langOverride?: SupportedLanguage) => string;
  homePath: string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): SupportedLanguage {
  const pathLang = getLanguageFromPath(window.location.pathname);
  if (pathLang) return pathLang;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored ?? undefined)) return stored as SupportedLanguage;
  } catch {
    // localStorage unavailable
  }
  return getBrowserLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLangState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLang = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // localStorage unavailable
    }

    const nextPath = withLanguagePath(location.pathname, newLang);
    if (nextPath !== location.pathname) {
      navigate(`${nextPath}${location.search}${location.hash}`, { replace: false });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const pathLang = getLanguageFromPath(location.pathname);
    if (!pathLang) return;
    setLangState(pathLang);
    document.documentElement.lang = LANGUAGE_OPTIONS.find((item) => item.code === pathLang)?.htmlLang ?? 'en';
    try {
      localStorage.setItem(STORAGE_KEY, pathLang);
    } catch {
      // localStorage unavailable
    }
  }, [location.pathname]);

  const t = useCallback(
    (key: string): string => {
      return translations[lang]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key;
    },
    [lang],
  );

  const pathFor = useCallback(
    (path: string, langOverride?: SupportedLanguage) => {
      const targetLang = langOverride ?? lang;
      const normalized = path.startsWith('/') ? path : `/${path}`;
      return withLanguagePath(normalized, targetLang);
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languageOptions: LANGUAGE_OPTIONS, pathFor, homePath: `/${lang}/` }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
