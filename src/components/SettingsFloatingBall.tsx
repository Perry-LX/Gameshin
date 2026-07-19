import { useEffect, useRef, useState } from 'react';
import { useLanguage, type SupportedLanguage } from '../i18n';

const POSITION_KEY = 'gameshin:settings-ball-position';
const DEFAULT_POSITION = { x: 24, y: 120 };
const DESKTOP_SIZE = 52;
const MOBILE_SIZE = 48;
const MOBILE_BREAKPOINT = 768;
const EDGE_INSET = 0;
const SNAP_DISTANCE = 48;

type Position = typeof DEFAULT_POSITION;

function getBallSize(): number {
  return window.innerWidth <= MOBILE_BREAKPOINT ? MOBILE_SIZE : DESKTOP_SIZE;
}

function clampPosition(position: Position): Position {
  const size = getBallSize();
  return {
    x: Math.min(Math.max(position.x, EDGE_INSET), Math.max(EDGE_INSET, window.innerWidth - size - EDGE_INSET)),
    y: Math.min(Math.max(position.y, EDGE_INSET), Math.max(EDGE_INSET, window.innerHeight - size - EDGE_INSET)),
  };
}

function snapPosition(position: Position): Position {
  const clamped = clampPosition(position);
  const size = getBallSize();
  const maxX = Math.max(EDGE_INSET, window.innerWidth - size - EDGE_INSET);
  const maxY = Math.max(EDGE_INSET, window.innerHeight - size - EDGE_INSET);

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
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return clampPosition(parsed);
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_POSITION;
}

export function SettingsFloatingBall() {
  const { lang, setLang, t, languageOptions } = useLanguage();
  const [position, setPosition] = useState<Position>(getStoredPosition);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  useEffect(() => {
    const onResize = () => setPosition((current) => clampPosition(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // localStorage unavailable
    }
  }, [position]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
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

  return (
    <>
      <button
        type="button"
        className={`settings-ball${dragging ? ' dragging' : ''}`}
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label={t('settings.button')}
        title={t('settings.button')}
      >
        <span className="settings-ball-icon">⚙</span>
      </button>

      {open && (
        <div className="settings-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h2 id="settings-title">{t('settings.title')}</h2>
              <button type="button" className="settings-modal-close" onClick={() => setOpen(false)} aria-label={t('settings.close')}>
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
