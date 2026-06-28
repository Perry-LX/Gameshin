import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { initChessGame } from '../games/international-chess/game';
import './InternationalChessGame.css';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

type InternationalChessResult = {
  winner: 'WHITE' | 'BLACK' | null;
  stalemate: boolean;
};

export function InternationalChessGame() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const viewRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const whiteRandomRef = useRef<HTMLInputElement>(null);
  const blackRandomRef = useRef<HTMLInputElement>(null);
  const speedSlowRef = useRef<HTMLInputElement>(null);
  const speedMediumRef = useRef<HTMLInputElement>(null);
  const speedFastRef = useRef<HTMLInputElement>(null);
  const perspectiveWhiteRef = useRef<HTMLInputElement>(null);
  const perspectiveBlackRef = useRef<HTMLInputElement>(null);
  const [gameResult, setGameResult] = useState<InternationalChessResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  // Dropdown state
  const [aiSide, setAiSide] = useState<'none' | 'white' | 'black' | 'both'>('black');
  const [moveSpeed, setMoveSpeed] = useState<'1' | '2' | '4'>('2');
  const [viewPerspective, setViewPerspective] = useState<'white' | 'black'>('white');

  // Sync hidden inputs with dropdown state
  useEffect(() => {
    if (whiteRandomRef.current) whiteRandomRef.current.checked = aiSide === 'white' || aiSide === 'both';
    if (blackRandomRef.current) blackRandomRef.current.checked = aiSide === 'black' || aiSide === 'both';
  }, [aiSide]);

  useEffect(() => {
    if (speedSlowRef.current) speedSlowRef.current.checked = moveSpeed === '1';
    if (speedMediumRef.current) speedMediumRef.current.checked = moveSpeed === '2';
    if (speedFastRef.current) speedFastRef.current.checked = moveSpeed === '4';
  }, [moveSpeed]);

  useEffect(() => {
    if (perspectiveWhiteRef.current) perspectiveWhiteRef.current.checked = viewPerspective === 'white';
    if (perspectiveBlackRef.current) perspectiveBlackRef.current.checked = viewPerspective === 'black';
  }, [viewPerspective]);

  useEffect(() => {
    const viewElement = viewRef.current;
    const boardElement = boardRef.current;

    if (!viewElement || !boardElement) return;

    return initChessGame({
      viewElement,
      boardElement,
      controls: {
        speedSlow: speedSlowRef.current,
        speedMedium: speedMediumRef.current,
        speedFast: speedFastRef.current,
        randomWhite: whiteRandomRef.current,
        randomBlack: blackRandomRef.current,
        perspectiveWhite: perspectiveWhiteRef.current,
        perspectiveBlack: perspectiveBlackRef.current,
      },
      onGameEnd: (result) => {
        setGameResult(result);
      },
    });
  }, [gameKey]);

  const overlayTitle = gameResult?.stalemate
    ? t('intlChess.stalemate')
    : `${gameResult?.winner === 'WHITE' ? t('intlChess.white') : t('intlChess.black')} WINS`;
  const overlayMark = gameResult?.stalemate ? '½' : gameResult?.winner === 'WHITE' ? '♔' : '♚';
  const overlayDescription = gameResult?.stalemate
    ? t('intlChess.stalemate.desc')
    : gameResult?.winner === 'WHITE'
      ? t('intlChess.win.white')
      : t('intlChess.win.black');

  const handleRestart = () => {
    setGameResult(null);
    setGameKey((value) => value + 1);
  };

  return (
    <div className="intl-chess-page pixel-container">
      <h1 className="intl-chess-title">{t('intlChess.title')}</h1>

      <div className="intl-chess-top-bar">
        <button type="button" className="intl-chess-back-btn" onClick={() => navigate('/')}>
          {t('intlChess.home')}
        </button>
        <div className="intl-chess-status-chip">{t('intlChess.chip')}</div>
      </div>

      <div className="intl-chess-main-layout">
        <section className="intl-chess-board-panel">
          <div className="intl-chess-status-bar">{t('intlChess.description')}</div>
          <div className="intl-chess-stage-card">
            <div ref={viewRef} className="intl-chess-view">
              <div className="board-coordinates board-coordinates-top">
                {files.map((file) => (
                  <span key={`top-${file}`}>{file}</span>
                ))}
              </div>
              <div className="board-coordinates board-coordinates-left">
                {ranks.map((rank) => (
                  <span key={`left-${rank}`}>{rank}</span>
                ))}
              </div>
              <div className="board-coordinates board-coordinates-right">
                {ranks.map((rank) => (
                  <span key={`right-${rank}`}>{rank}</span>
                ))}
              </div>
              <div className="board-coordinates board-coordinates-bottom">
                {files.map((file) => (
                  <span key={`bottom-${file}`}>{file}</span>
                ))}
              </div>
              <div ref={boardRef} className="intl-chess-board" />
            </div>
            {gameResult && (
              <div className="intl-chess-overlay" role="dialog" aria-modal="true" aria-label={overlayTitle}>
                <div className="intl-chess-overlay-panel">
                  <span className="intl-chess-overlay-mark">{overlayMark}</span>
                  <h2 className="intl-chess-overlay-title">{overlayTitle}</h2>
                  <p>{overlayDescription}</p>
                  <button type="button" className="intl-chess-action-btn" onClick={handleRestart}>
                    {t('intlChess.again')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="intl-chess-hints">
            <span>{t('intlChess.hint.click')}</span>
            <span>{t('intlChess.hint.ai')}</span>
            <span>{t('intlChess.hint.perspective')}</span>
          </div>
        </section>

        <aside className="intl-chess-side-panel">
          {/* Hidden inputs that the engine reads */}
          <input ref={whiteRandomRef} type="checkbox" style={{ display: 'none' }} />
          <input ref={blackRandomRef} type="checkbox" style={{ display: 'none' }} />
          <input ref={speedSlowRef} type="radio" name="intl-speed" style={{ display: 'none' }} />
          <input ref={speedMediumRef} type="radio" name="intl-speed" style={{ display: 'none' }} />
          <input ref={speedFastRef} type="radio" name="intl-speed" style={{ display: 'none' }} />
          <input ref={perspectiveWhiteRef} type="radio" name="intl-perspective" style={{ display: 'none' }} />
          <input ref={perspectiveBlackRef} type="radio" name="intl-perspective" style={{ display: 'none' }} />

          {/* Unified settings panel with dropdowns */}
          <section className="intl-chess-panel-block">
            <div className="intl-chess-panel-title">⚙ {t('intlChess.panel.settings')}</div>
            <div className="intl-chess-dropdown-group">
              <label className="intl-chess-dropdown-field">
                <span>{t('intlChess.panel.ai')}</span>
                <select
                  className="intl-chess-select"
                  value={aiSide}
                  onChange={(e) => setAiSide(e.target.value as 'none' | 'white' | 'black' | 'both')}
                >
                  <option value="none">{t('intlChess.aiOff')}</option>
                  <option value="white">{t('intlChess.whiteAI')}</option>
                  <option value="black">{t('intlChess.blackAI')}</option>
                  <option value="both">{t('intlChess.aiBoth')}</option>
                </select>
              </label>

              <label className="intl-chess-dropdown-field">
                <span>{t('intlChess.panel.speed')}</span>
                <select
                  className="intl-chess-select"
                  value={moveSpeed}
                  onChange={(e) => setMoveSpeed(e.target.value as '1' | '2' | '4')}
                >
                  <option value="1">1 APS</option>
                  <option value="2">2 APS</option>
                  <option value="4">4 APS</option>
                </select>
              </label>

              <label className="intl-chess-dropdown-field">
                <span>{t('intlChess.panel.perspective')}</span>
                <select
                  className="intl-chess-select"
                  value={viewPerspective}
                  onChange={(e) => setViewPerspective(e.target.value as 'white' | 'black')}
                >
                  <option value="white">{t('intlChess.white')}</option>
                  <option value="black">{t('intlChess.black')}</option>
                </select>
              </label>

              <button type="button" className="intl-chess-action-btn" onClick={handleRestart}>
                ↺ {t('intlChess.restart')}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
