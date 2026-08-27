import { useEffect, useRef, useState } from 'react';
import { useLanguage, type SupportedLanguage } from '../i18n';

// Version the persisted position so existing installs migrate away from the
// old left-side default while preserving future user drags.
const POSITION_KEY = 'gameshin:settings-ball-position-v5';
const LEGACY_DEFAULT_POSITION = { x: 24, y: 120 };
const DESKTOP_SIZE = 52;
const MOBILE_SIZE = 48;
const MOBILE_BREAKPOINT = 768;
const EDGE_INSET = 12;
const DEFAULT_INSET = 24;
const SNAP_DISTANCE = 48;

type Position = { x: number; y: number };
type StoredPosition = Position & { viewportWidth: number; viewportHeight: number };

function getBallSize(): number {
  return getBallSizeForWidth(getViewportSize().width);
}

function getBallSizeForWidth(width: number): number {
  return width <= MOBILE_BREAKPOINT ? MOBILE_SIZE : DESKTOP_SIZE;
}

function getViewportSize() {
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
}

function getDefaultPosition(): Position {
  const viewport = getViewportSize();
  const size = getBallSize();
  return {
    x: Math.max(EDGE_INSET, viewport.width - size - DEFAULT_INSET),
    y: Math.max(EDGE_INSET, viewport.height - size - DEFAULT_INSET),
  };
}

function clampPosition(position: Position): Position {
  const viewport = getViewportSize();
  const size = getBallSize();
  return {
    x: Math.min(Math.max(position.x, EDGE_INSET), Math.max(EDGE_INSET, viewport.width - size - EDGE_INSET)),
    y: Math.min(Math.max(position.y, EDGE_INSET), Math.max(EDGE_INSET, viewport.height - size - EDGE_INSET)),
  };
}

function snapPosition(position: Position): Position {
  const clamped = clampPosition(position);
  const viewport = getViewportSize();
  const size = getBallSize();
  const maxX = Math.max(EDGE_INSET, viewport.width - size - EDGE_INSET);
  const maxY = Math.max(EDGE_INSET, viewport.height - size - EDGE_INSET);

  return {
    x: clamped.x - EDGE_INSET <= SNAP_DISTANCE
      ? EDGE_INSET
      : maxX - clamped.x <= SNAP_DISTANCE
        ? maxX
        : clamped.x,
    y: clamped.y - EDGE_INSET <= SNAP_DISTANCE
      ? EDGE_INSET
      : maxY - clamped.y <= SNAP_DISTANCE
        ? maxY
        : clamped.y,
  };
}

function getStoredPosition(): Position {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return getDefaultPosition();
    const parsed = JSON.parse(raw) as Partial<StoredPosition>;
    if (
      typeof parsed.x === 'number'
      && typeof parsed.y === 'number'
      && typeof parsed.viewportWidth === 'number'
      && typeof parsed.viewportHeight === 'number'
    ) {
      const isLegacyDefault = parsed.x === LEGACY_DEFAULT_POSITION.x && parsed.y === LEGACY_DEFAULT_POSITION.y;
      if (isLegacyDefault) return getDefaultPosition();

      const storedSize = getBallSizeForWidth(parsed.viewportWidth);
      const currentSize = getBallSize();
      const viewport = getViewportSize();
      const storedMaxX = Math.max(EDGE_INSET, parsed.viewportWidth - storedSize - EDGE_INSET);
      const storedMaxY = Math.max(EDGE_INSET, parsed.viewportHeight - storedSize - EDGE_INSET);
      const rightGap = storedMaxX - parsed.x;
      const bottomGap = storedMaxY - parsed.y;
      const restored = { x: parsed.x, y: parsed.y };

      if (rightGap >= 0 && rightGap <= SNAP_DISTANCE) {
        restored.x = viewport.width - currentSize - rightGap;
      }
      if (bottomGap >= 0 && bottomGap <= SNAP_DISTANCE) {
        restored.y = viewport.height - currentSize - bottomGap;
      }

      return clampPosition(restored);
    }
  } catch {
    // localStorage unavailable
  }
  return getDefaultPosition();
}

export function SettingsFloatingBall() {
  const { lang, setLang, t, languageOptions } = useLanguage();
  const [position, setPosition] = useState<Position>(getStoredPosition);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const ballRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const viewportRef = useRef(getViewportSize());
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  useEffect(() => {
    const onResize = () => {
      const previousViewport = viewportRef.current;
      const nextViewport = getViewportSize();
      const previousSize = getBallSizeForWidth(previousViewport.width);
      const nextSize = getBallSizeForWidth(nextViewport.width);
      const previousMaxX = Math.max(EDGE_INSET, previousViewport.width - previousSize - EDGE_INSET);
      const previousMaxY = Math.max(EDGE_INSET, previousViewport.height - previousSize - EDGE_INSET);

      setPosition((current) => {
        const rightGap = previousMaxX - current.x;
        const bottomGap = previousMaxY - current.y;
        const next = { ...current };

        if (rightGap >= 0 && rightGap <= SNAP_DISTANCE) {
          next.x = nextViewport.width - nextSize - rightGap;
        } else if (current.x - EDGE_INSET <= SNAP_DISTANCE) {
          next.x = current.x;
        }

        if (bottomGap >= 0 && bottomGap <= SNAP_DISTANCE) {
          next.y = nextViewport.height - nextSize - bottomGap;
        } else if (current.y - EDGE_INSET <= SNAP_DISTANCE) {
          next.y = current.y;
        }

        return clampPosition(next);
      });
      viewportRef.current = nextViewport;
    };
    window.addEventListener('resize', onResize);
    const viewportObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(onResize);
    viewportObserver?.observe(document.documentElement);
    return () => {
      window.removeEventListener('resize', onResize);
      viewportObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    try {
      const viewport = getViewportSize();
      localStorage.setItem(POSITION_KEY, JSON.stringify({
        ...position,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      } satisfies StoredPosition));
    } catch {
      // localStorage unavailable
    }
  }, [position]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        requestAnimationFrame(() => ballRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    setPosition(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.pointerId = -1;
    setDragging(false);
    if (drag.moved) setPosition((current) => snapPosition(current));
    else setOpen(true);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.pointerId = -1;
    setDragging(false);
    setPosition((current) => snapPosition(current));
  };

  const closeDialog = () => {
    setOpen(false);
    requestAnimationFrame(() => ballRef.current?.focus());
  };

  const handleBallKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
      return;
    }
    const step = event.shiftKey ? 48 : 16;
    const moves: Record<string, Position> = {
      ArrowLeft: { x: position.x - step, y: position.y },
      ArrowRight: { x: position.x + step, y: position.y },
      ArrowUp: { x: position.x, y: position.y - step },
      ArrowDown: { x: position.x, y: position.y + step },
    };
    if (moves[event.key]) {
      event.preventDefault();
      setPosition(clampPosition(moves[event.key]));
    }
  };

  const trapDialogFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, select, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={ballRef}
        type="button"
        className={`settings-ball${dragging ? ' dragging' : ''}`}
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => {
          if (!dragRef.current.moved) setOpen(true);
        }}
        onKeyDown={handleBallKeyDown}
        aria-label={t('settings.button')}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('settings.button')}
      >
        <svg
          className="settings-ball-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div className="settings-modal-backdrop" role="presentation" onMouseDown={closeDialog}>
          <section
            ref={dialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={trapDialogFocus}
          >
            <div className="settings-modal-header">
              <h2 id="settings-title">{t('settings.title')}</h2>
              <button ref={closeRef} type="button" className="settings-modal-close" onClick={closeDialog} aria-label={t('settings.close')}>
                ×
              </button>
            </div>

            <label className="settings-field">
              <span className="settings-field-title">{t('settings.language')}</span>
              <span className="settings-field-hint">{t('settings.languageHint')}</span>
              <select
                className="settings-select"
                value={lang}
                onChange={(event) => setLang(event.target.value as SupportedLanguage)}
              >
                {languageOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeLabel}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      )}
    </>
  );
}
