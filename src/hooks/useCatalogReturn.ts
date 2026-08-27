import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EXIT_DURATION_MS = 180;

export function useCatalogReturn() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const returnToCatalog = useCallback((path: string) => {
    if (isExiting) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(path);
      return;
    }

    setIsExiting(true);
    timerRef.current = window.setTimeout(() => {
      navigate(path);
      timerRef.current = null;
    }, EXIT_DURATION_MS);
  }, [isExiting, navigate]);

  return { isExiting, returnToCatalog };
}
