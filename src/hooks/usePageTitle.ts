import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type PagePath = '/' | '/game/snake' | '/game/tetris' | '/game/chess'
  | '/game/chess-plus' | '/game/gomoku' | '/game/international-chess' | '/game/platformer' | '/game/magic-cube';

const TITLES: Record<PagePath, string> = {
  '/': 'GAMESHIN',
  '/game/snake': 'Snake Classic',
  '/game/tetris': 'Tetris Battle',
  '/game/chess': 'Chinese Chess',
  '/game/chess-plus': 'Chinese Chess Plus',
  '/game/gomoku': 'Gomoku',
  '/game/international-chess': 'International Chess',
  '/game/platformer': 'Pixel Jumper',
  '/game/magic-cube': 'Magic Cube',
};

const CATEGORIES = 'Board, Action, Puzzle & Shooting Games';
const SITE = 'Gameshin';

export function usePageTitle() {
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const path = location.pathname as PagePath;
    const label = TITLES[path] ?? TITLES['/'];

    // Cleanup previous timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (path === '/') {
      // ── Homepage: typing animation → categories ──
      const part1 = 'GAMESHIN';
      const fullFinal = `${part1} | ${CATEGORIES}`;
      let idx = 0;
      document.title = '';

      // Type "GAMESHIN" first
      intervalRef.current = setInterval(() => {
        if (idx < part1.length) {
          idx++;
          document.title = part1.slice(0, idx) + '▮';
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Pause briefly, then type the category suffix
          timeoutRef.current = setTimeout(() => {
            let suffixIdx = 0;
            const suffix = ` | ${CATEGORIES}`;
            document.title = part1 + '▮';
            intervalRef.current = setInterval(() => {
              if (suffixIdx < suffix.length) {
                suffixIdx++;
                document.title = part1 + suffix.slice(0, suffixIdx) + '▮';
              } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                // Blink cursor a few times then settle
                let cursorOn = true;
                intervalRef.current = setInterval(() => {
                  cursorOn = !cursorOn;
                  document.title = fullFinal + (cursorOn ? ' ▮' : '');
                }, 530);
                timeoutRef.current = setTimeout(() => {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  document.title = fullFinal;
                }, 4000);
              }
            }, 30);
          }, 300);
        }
      }, 50);
    } else {
      // ── Game pages: static title ──
      document.title = `${label} | ${SITE}`;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname]);
}
