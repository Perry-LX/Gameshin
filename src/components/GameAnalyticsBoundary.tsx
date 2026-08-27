import { useEffect, useRef, type ReactNode } from 'react';
import { useLanguage } from '../i18n';
import { trackEvent, trackOncePerSession } from '../analytics';

interface GameAnalyticsBoundaryProps {
  gameId: string;
  category: string;
  children: ReactNode;
}

/** Records a playable game visit and active playtime without touching game logic. */
export function GameAnalyticsBoundary({ gameId, category, children }: GameAnalyticsBoundaryProps) {
  const { lang } = useLanguage();
  const activeSeconds = useRef(0);
  const visibleSince = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);

  useEffect(() => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    const properties = { game_id: gameId, category, locale: lang };
    trackOncePerSession(`game-started:${gameId}`, 'game_started', properties);
    visibleSince.current = document.visibilityState === 'visible' ? Date.now() : null;

    const collectVisibleTime = () => {
      if (visibleSince.current === null) return;
      activeSeconds.current += Math.max(0, Math.round((Date.now() - visibleSince.current) / 1000));
      visibleSince.current = null;
    };

    const checkpoint = (eventName: 'game_playtime_checkpoint' | 'game_session_ended') => {
      collectVisibleTime();
      void trackEvent(eventName, { ...properties, active_seconds: activeSeconds.current });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        checkpoint('game_playtime_checkpoint');
      } else {
        visibleSince.current = Date.now();
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') checkpoint('game_playtime_checkpoint');
    }, 30_000);

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      // React Strict Mode replays effects in development. Deferring this lets
      // the next setup cancel the synthetic cleanup while real route exits send once.
      exitTimer.current = window.setTimeout(() => checkpoint('game_session_ended'), 0);
    };
  }, [category, gameId, lang]);

  return <>{children}</>;
}
