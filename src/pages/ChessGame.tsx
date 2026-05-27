import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChessEngine } from '../games/chess/engine';
import { PRESETS } from '../games/chess/presets';
import type { ChessStatus, Difficulty } from '../games/chess/types';
import './ChessGame.css';

const DEFAULT_STATUS: ChessStatus = {
  scoreText: '资源加载中...',
  winner: null,
  thinking: false,
  mode: 'menu',
  difficulty: 3,
  presetIndex: 0,
};

export function ChessGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const selectAudioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<ReturnType<typeof createChessEngine> | null>(null);

  const [status, setStatus] = useState<ChessStatus>(DEFAULT_STATUS);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [presetIndex, setPresetIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createChessEngine({
      canvas,
      clickAudio: clickAudioRef.current,
      selectAudio: selectAudioRef.current,
      onStatusChange: setStatus,
    });

    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const winnerText = useMemo(() => {
    if (status.winner === 1) return '你赢了';
    if (status.winner === -1) return 'AI 获胜';
    return '';
  }, [status.winner]);

  return (
    <div className="chess-page pixel-container">
      <audio ref={clickAudioRef} src="/chess/audio/click.wav" preload="auto" />
      <audio ref={selectAudioRef} src="/chess/audio/select.wav" preload="auto" />

      <div className="chess-top-bar">
        <button type="button" className="chess-back-btn" onClick={() => navigate('/')}>
          ◀ HOME
        </button>
        <h1 className="chess-title">CHINESE CHESS</h1>
        <div className="chess-status-chip">{status.thinking ? 'AI THINKING' : 'READY'}</div>
      </div>

      <div className="chess-main-layout">
        <section className="chess-board-panel">
          <div className="chess-status-bar">{status.scoreText}</div>
          <div className="chess-canvas-wrap">
            <canvas ref={canvasRef} className="chess-canvas" />
            {status.winner !== null && (
              <div className="chess-overlay">
                <div className="chess-overlay-body">
                  <div className="chess-overlay-icon">♜</div>
                  <div className="chess-overlay-title">{winnerText}</div>
                  <p>{status.scoreText}</p>
                  <button type="button" className="chess-action-btn primary" onClick={() => engineRef.current?.restart()}>
                    ▶ AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="chess-controls-hint">
            <span>点击棋子移动</span>
            <span>支持人机对弈</span>
            <span>支持残局挑战</span>
          </div>
        </section>

        <aside className="chess-side-panel">
          <div className="chess-panel-block">
            <div className="chess-panel-title">对弈模式</div>
            <div className="chess-button-group">
              <button type="button" className="chess-action-btn primary" onClick={() => engineRef.current?.startDuel(difficulty)}>
                开始对弈
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.startPreset(presetIndex)}>
                挑战残局
              </button>
            </div>
          </div>

          <div className="chess-panel-block">
            <div className="chess-panel-title">难度选择</div>
            <div className="chess-options-grid">
              {([2, 3, 4] as Difficulty[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chess-option-btn ${difficulty === value ? 'active' : ''}`}
                  onClick={() => {
                    setDifficulty(value);
                    engineRef.current?.setDifficulty(value);
                  }}
                >
                  {value === 2 ? '菜鸟' : value === 3 ? '中级' : '高手'}
                </button>
              ))}
            </div>
          </div>

          <div className="chess-panel-block">
            <div className="chess-panel-title">残局选择</div>
            <div className="chess-preset-list">
              {PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  type="button"
                  className={`chess-preset-btn ${presetIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setPresetIndex(index);
                    engineRef.current?.setPresetIndex(index);
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="chess-panel-block">
            <div className="chess-panel-title">棋局操作</div>
            <div className="chess-button-group">
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.regret()}>
                悔棋
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.restart()}>
                重开
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.cycleSkin()}>
                换肤
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
