import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initChessGame } from '../games/international-chess/game';
import './InternationalChessGame.css';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

type InternationalChessResult = {
  winner: 'WHITE' | 'BLACK' | null;
  stalemate: boolean;
};

export function InternationalChessGame() {
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
    ? 'STALEMATE'
    : `${gameResult?.winner === 'WHITE' ? 'WHITE' : 'BLACK'} WINS`;
  const overlayMark = gameResult?.stalemate ? '½' : gameResult?.winner === 'WHITE' ? '♔' : '♚';
  const overlayDescription = gameResult?.stalemate
    ? '双方都没有合法走法，本局以和棋结束。'
    : `${gameResult?.winner === 'WHITE' ? '白方' : '黑方'}完成将杀，对局结束。`;

  const handleRestart = () => {
    setGameResult(null);
    setGameKey((value) => value + 1);
  };

  return (
    <div className="intl-chess-page pixel-container">
      <div className="intl-chess-top-bar">
        <button type="button" className="intl-chess-back-btn" onClick={() => navigate('/')}>
          ◀ HOME
        </button>
        <h1 className="intl-chess-title">INTERNATIONAL CHESS</h1>
        <div className="intl-chess-status-chip">8×8 CLASSIC</div>
      </div>

      <div className="intl-chess-main-layout">
        <section className="intl-chess-board-panel">
          <div className="intl-chess-status-bar">标准国际象棋棋盘，支持手动走子、自动对弈与黑白视角切换。</div>
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
                    ▶ AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="intl-chess-hints">
            <span>点击棋子后再点击目标格移动</span>
            <span>可开启任意一方 AI 自动走子</span>
            <span>支持切换白方 / 黑方视角</span>
          </div>
        </section>

        <aside className="intl-chess-side-panel">
          <section className="intl-chess-panel-block">
            <div className="intl-chess-panel-title">自动对弈</div>
            <div className="intl-chess-control-row intl-chess-control-row-wrap">
              <label className="intl-chess-toggle">
                <input ref={whiteRandomRef} type="checkbox" />
                <span>白方 AI</span>
              </label>
              <label className="intl-chess-toggle">
                <input ref={blackRandomRef} type="checkbox" defaultChecked />
                <span>黑方 AI</span>
              </label>
            </div>
          </section>

          <section className="intl-chess-panel-block">
            <div className="intl-chess-panel-title">自动走子速度</div>
            <div className="intl-chess-control-row">
              <label className="intl-chess-toggle">
                <input ref={speedSlowRef} type="radio" name="intl-speed" />
                <span>1 APS</span>
              </label>
              <label className="intl-chess-toggle">
                <input ref={speedMediumRef} type="radio" name="intl-speed" defaultChecked />
                <span>2 APS</span>
              </label>
              <label className="intl-chess-toggle">
                <input ref={speedFastRef} type="radio" name="intl-speed" />
                <span>4 APS</span>
              </label>
            </div>
          </section>

          <section className="intl-chess-panel-block">
            <div className="intl-chess-panel-title">观察视角</div>
            <div className="intl-chess-control-row">
              <label className="intl-chess-toggle">
                <input ref={perspectiveWhiteRef} type="radio" name="intl-perspective" defaultChecked />
                <span>白方视角</span>
              </label>
              <label className="intl-chess-toggle">
                <input ref={perspectiveBlackRef} type="radio" name="intl-perspective" />
                <span>黑方视角</span>
              </label>
            </div>
          </section>

          <section className="intl-chess-panel-block">
            <div className="intl-chess-panel-title">快速操作</div>
            <div className="intl-chess-action-grid">
              <button type="button" className="intl-chess-action-btn" onClick={handleRestart}>
                ↺ RESTART
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
