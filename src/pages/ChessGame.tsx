import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { createChessEngine } from '../games/chess/engine';
import { PRESETS } from '../games/chess/presets';
import type { ChessStatus, Difficulty } from '../games/chess/types';
import './ChessGame.css';

const assetBase = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '').replace(/\/$/, '');

export function ChessGame() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const selectAudioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<ReturnType<typeof createChessEngine> | null>(null);

  const DEFAULT_STATUS: ChessStatus = {
    scoreText: t('chess.loading'),
    winner: null,
    thinking: false,
    mode: 'menu',
    difficulty: 3,
    presetIndex: 0,
    lastMoveText: '',
    moveNotations: [],
    currentSkin: 'stype2',
    isPlaying: false,
    turn: 1,
  };

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

  // Sync default status text when language changes
  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      scoreText: prev.winner === null ? t('chess.loading') : prev.scoreText,
    }));
  }, [t]);

  const winnerText = useMemo(() => {
    if (status.winner === 1) return t('chess.youWin');
    if (status.winner === -1) return t('chess.aiWins');
    return '';
  }, [status.winner, t]);

  return (
    <div className="chess-page pixel-container">
      <audio ref={clickAudioRef} src={`${assetBase}/chess/audio/click.wav`} preload="auto" />
      <audio ref={selectAudioRef} src={`${assetBase}/chess/audio/select.wav`} preload="auto" />

      <h1 className="chess-title">{t('chess.title')}</h1>

      <div className="chess-top-bar">
        <button type="button" className="chess-back-btn" onClick={() => navigate('/')}>
          {t('chess.home')}
        </button>
        <div className="chess-status-chip">{status.thinking ? t('chess.thinking') : t('chess.ready')}</div>
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
                    {t('chess.again')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="chess-controls-hint">
            <span>{t('chess.hint.click')}</span>
            <span>{t('chess.hint.ai')}</span>
            <span>{t('chess.hint.preset')}</span>
          </div>
        </section>

        <aside className="chess-side-panel">
          <div className="chess-panel-block">
            <div className="chess-panel-title">{t('chess.panel.mode')}</div>
            <div className="chess-button-group">
              <button type="button" className="chess-action-btn primary" onClick={() => engineRef.current?.startDuel(difficulty)}>
                {t('chess.button.start')}
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.startPreset(presetIndex)}>
                {t('chess.button.preset')}
              </button>
            </div>
          </div>

          <div className="chess-panel-block">
            <div className="chess-panel-title">{t('chess.panel.difficulty')}</div>
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
                  {value === 2 ? t('chess.difficulty.rookie') : value === 3 ? t('chess.difficulty.mid') : t('chess.difficulty.pro')}
                </button>
              ))}
            </div>
          </div>

          <div className="chess-panel-block">
            <div className="chess-panel-title">{t('chess.panel.preset')}</div>
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
            <div className="chess-panel-title">{t('chess.panel.actions')}</div>
            <div className="chess-button-group">
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.regret()}>
                {t('chess.button.regret')}
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.restart()}>
                {t('chess.button.restart')}
              </button>
              <button type="button" className="chess-action-btn" onClick={() => engineRef.current?.cycleSkin()}>
                {t('chess.button.skin')}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
