import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import { createChessEngine } from '../games/chess/engine';
import { PRESETS } from '../games/chess/presets';
import type { ChessStatus, Difficulty, SkinType } from '../games/chess/types';
import './ChessPlusGame.css';

const assetBase = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '').replace(/\/$/, '');


export function ChessPlusGame() {
  const { t, homePath } = useLanguage();
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
  const [playMode, setPlayMode] = useState<'duel' | 'pvp' | 'preset' | 'ai-vs-ai'>('duel');
  const [selectedSkin, setSelectedSkin] = useState<SkinType>('stype2');
  const [showMovesModal, setShowMovesModal] = useState(false);
  const engineLabels = useMemo(() => ({
    loading: t('chess.loading'),
    redWin: t('chess.redWin'),
    blackWin: t('chess.blackWin'),
    youWin: t('chess.youWin'),
    aiWins: t('chess.aiWins'),
    menu: t('chess.menu'),
    duel: t('chessPlus.mode.duel'),
    pvp: t('chessPlus.mode.pvp'),
    preset: t('chessPlus.mode.preset'),
    thinking: t('chessPlus.thinking'),
    difficulty: t('chess.status.difficulty'),
    presetNames: PRESETS.map((_, index) => t(`chess.preset.${index}`)),
  }), [t]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createChessEngine({
      canvas,
      clickAudio: clickAudioRef.current,
      selectAudio: selectAudioRef.current,
      onStatusChange: setStatus,
      labels: engineLabels,
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [engineLabels]);

  useEffect(() => {
    setSelectedSkin(status.currentSkin);
  }, [status.currentSkin]);

  // Handle language change for default status text
  useEffect(() => {
    if (status.winner === null && status.mode === 'menu') {
      setStatus((prev) => ({ ...prev, scoreText: t('chess.loading') }));
    }
  }, [t, status.winner, status.mode]);

  const winnerText = useMemo(() => {
    if (status.winner === 1) return t('chessPlus.winner.red');
    if (status.winner === -1) return t('chessPlus.winner.black');
    return '';
  }, [status.winner, t]);

  const modeText = useMemo(() => {
    if (status.mode === 'menu') return `· ${t(`chessPlus.mode.${playMode}`)}`;
    if (status.mode === 'preset') return `${t('chessPlus.mode.preset')} · ${t(`chess.preset.${status.presetIndex}`)}`;
    return t(`chessPlus.mode.${status.mode}`);
  }, [playMode, status.mode, status.presetIndex, t]);

  const turnText = useMemo(() => {
    if (status.winner !== null) return winnerText;
    if (status.thinking) return t('chessPlus.thinking');
    return status.turn === 1 ? t('chessPlus.turn.red') : t('chessPlus.turn.black');
  }, [status.thinking, status.turn, status.winner, winnerText, t]);

  const roundRows = useMemo(() => {
    const rows: Array<{ round: number; red?: string; black?: string }> = [];
    status.moveNotations.forEach((move, index) => {
      const rowIndex = Math.floor(index / 2);
      if (!rows[rowIndex]) {
        rows[rowIndex] = { round: rowIndex + 1 };
      }
      if (index % 2 === 0) {
        rows[rowIndex].red = move;
      } else {
        rows[rowIndex].black = move;
      }
    });
    return rows;
  }, [status.moveNotations]);

  const visibleRows = useMemo(() => roundRows.slice(0, 3), [roundRows]);
  const hasMoreMoves = roundRows.length > 3;

  const handleStartGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (playMode === 'duel') {
      engine.startDuel(difficulty);
      return;
    }
    if (playMode === 'pvp') {
      engine.startHumanDuel();
      return;
    }
    if (playMode === 'ai-vs-ai') {
      engine.startAIVsAI();
      return;
    }
    engine.startPreset(presetIndex);
  };

  const handleRestart = () => {
    engineRef.current?.restart();
  };

  const handleSkinChange = (value: SkinType) => {
    setSelectedSkin(value);
    void engineRef.current?.setSkin(value);
  };

  return (
    <div className="chess-plus-page pixel-container">
      <audio ref={clickAudioRef} src={`${assetBase}/chess/audio/click.wav`} preload="auto" />
      <audio ref={selectAudioRef} src={`${assetBase}/chess/audio/select.wav`} preload="auto" />

      <h1 className="chess-plus-title">
        {t('chessPlus.heroTitle')}
        <span className="chess-plus-word">Plus</span>
      </h1>

      <header className="chess-plus-hero">
        <button type="button" className="chess-plus-back-btn" onClick={() => navigate(homePath)}>
          {t('chessPlus.home')}
        </button>
        <div className="chess-plus-hero-copy">
          <p className="chess-plus-kicker">{t('chessPlus.kicker')}</p>
          <p>{t('chessPlus.description')}</p>
        </div>
        <div className="chess-plus-hero-badges">
          <span>{modeText}</span>
          <span>{turnText}</span>
          <span>{t(`chessPlus.skin.${status.currentSkin}`)}</span>
        </div>
      </header>

      <section className="chess-plus-shell">
        <div className="chess-plus-board-card">
          <div className="chess-plus-board-header">
            <div className="chess-plus-board-info">
              <div>
                <p className="chess-plus-board-label">{t('chessPlus.label.status')}</p>
                <h2 className="chess-plus-board-score">{status.scoreText}</h2>
              </div>
              <div className="chess-plus-board-meta">
                <span className="chess-plus-badge">{status.isPlaying ? t('chessPlus.status.inProgress') : t('chessPlus.status.notStarted')}</span>
                <span className="chess-plus-badge">{playMode === 'duel' ? `${t('chessPlus.difficulty')} ${difficulty}` : t(`chessPlus.mode.${playMode}`)}</span>
              </div>
            </div>
            {/* Start / Restart buttons moved to board top-right */}
            <div className="chess-plus-board-actions">
              <button type="button" className="chess-plus-board-action-btn primary" onClick={handleStartGame}>
                {t('chessPlus.button.start')}
              </button>
              <button type="button" className="chess-plus-board-action-btn" onClick={handleRestart}>
                {t('chessPlus.button.restart')}
              </button>
            </div>
          </div>

          <div className="chess-plus-canvas-stage">
            <div className="chess-plus-canvas-frame">
              <canvas ref={canvasRef} className="chess-plus-canvas" />
              {status.winner !== null && (
                <div className="chess-plus-overlay">
                  <div className="chess-plus-overlay-panel">
                    <span className="chess-plus-overlay-mark">将</span>
                    <h3>{winnerText}</h3>
                    <p>{status.lastMoveText || status.scoreText}</p>
                    <button type="button" className="chess-plus-primary-btn" onClick={() => engineRef.current?.restart()}>
                      {t('chessPlus.button.again')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chess-plus-footer-hints">
            <span>{t('chessPlus.hint.click')}</span>
            <span>{t('chessPlus.hint.modes')}</span>
            <span>{t('chessPlus.hint.settings')}</span>
          </div>
        </div>

        <aside className="chess-plus-sidebar">
          {/* Move history — max 3 visible rows */}
          <section className="chess-plus-panel chess-plus-moves-panel">
            <div className="chess-plus-panel-title-lg">{t('chessPlus.panel.moves')}</div>
            {roundRows.length ? (
              <>
                <div className="chess-plus-moves-table">
                  <div className="chess-plus-moves-head">
                    <span>{t('chessPlus.moves.round')}</span>
                    <span>{t('chessPlus.moves.red')}</span>
                    <span>{t('chessPlus.moves.black')}</span>
                  </div>
                  <div className="chess-plus-moves-body">
                    {visibleRows.map((row) => (
                      <div key={row.round} className="chess-plus-moves-row">
                        <span className="chess-plus-moves-round">{row.round}</span>
                        <span className="chess-plus-moves-cell">{row.red ?? '—'}</span>
                        <span className="chess-plus-moves-cell">{row.black ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {hasMoreMoves && (
                  <button
                    type="button"
                    className="chess-plus-view-all-btn"
                    onClick={() => setShowMovesModal(true)}
                  >
                    {t('chessPlus.moves.viewAll')} ({roundRows.length})
                  </button>
                )}
              </>
            ) : (
              <div className="chess-plus-empty-state">{t('chessPlus.moves.empty')}</div>
            )}
          </section>

          {/* Settings panel */}
          <section className="chess-plus-panel">
            <div className="chess-plus-panel-title-lg">{t('chessPlus.panel.settings')}</div>
            <div className="chess-plus-form-grid">
              <label className="chess-plus-field">
                <span className="chess-plus-field-label">{t('chessPlus.modeLabel')}</span>
                <select className="chess-plus-select" value={playMode} onChange={(event) => setPlayMode(event.target.value as 'duel' | 'pvp' | 'preset' | 'ai-vs-ai')}>
                  <option value="duel">{t('chessPlus.mode.duel')}</option>
                  <option value="pvp">{t('chessPlus.mode.pvp')}</option>
                  <option value="ai-vs-ai">{t('chessPlus.mode.ai-vs-ai')}</option>
                  <option value="preset">{t('chessPlus.mode.preset')}</option>
                </select>
              </label>

              <label className="chess-plus-field">
                <span className="chess-plus-field-label">{t('chessPlus.difficultyLabel')}</span>
                <select
                  className="chess-plus-select"
                  value={difficulty}
                  disabled={playMode === 'pvp' || playMode === 'preset'}
                  onChange={(event) => {
                    const value = Number(event.target.value) as Difficulty;
                    setDifficulty(value);
                    engineRef.current?.setDifficulty(value);
                  }}
                >
                  <option value={2}>{t('chess.difficulty.rookie')}</option>
                  <option value={3}>{t('chess.difficulty.mid')}</option>
                  <option value={4}>{t('chess.difficulty.pro')}</option>
                </select>
              </label>

              <label className="chess-plus-field">
                <span className="chess-plus-field-label">{t('chessPlus.presetLabel')}</span>
                <select
                  className="chess-plus-select"
                  value={presetIndex}
                  disabled={playMode !== 'preset'}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPresetIndex(value);
                    engineRef.current?.setPresetIndex(value);
                  }}
                >
                  {PRESETS.map((preset, index) => (
                    <option key={preset.name} value={index}>
                      {String(index + 1).padStart(2, '0')} · {t(`chess.preset.${index}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="chess-plus-field">
                <span className="chess-plus-field-label">{t('chessPlus.skinLabel')}</span>
                <select className="chess-plus-select" value={selectedSkin} onChange={(event) => handleSkinChange(event.target.value as SkinType)}>
                  {(['stype1', 'stype2', 'stype3'] as SkinType[]).map((value) => (
                    <option key={value} value={value}>
                      {t(`chessPlus.skin.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Actions panel */}
          <section className="chess-plus-panel">
            <div className="chess-plus-panel-title-lg">{t('chessPlus.panel.actions')}</div>
            <div className="chess-plus-panel-actions two-col">
              <button type="button" className="chess-plus-secondary-btn" onClick={() => engineRef.current?.regret()} disabled={playMode === 'ai-vs-ai'}>
                {t('chessPlus.button.regret')}
              </button>
              <button type="button" className="chess-plus-secondary-btn" onClick={() => engineRef.current?.cycleSkin()}>
                {t('chessPlus.button.cycleSkin')}
              </button>
            </div>
          </section>

          {/* Info panel */}
          <section className="chess-plus-panel chess-plus-panel-stats">
            <div className="chess-plus-panel-title-lg">{t('chessPlus.panel.info')}</div>
            <div className="chess-plus-stats-grid">
              <article>
                <span className="chess-plus-stat-label">{t('chessPlus.modeLabel')}</span>
                <strong className="chess-plus-stat-value">{modeText}</strong>
              </article>
              <article>
                <span className="chess-plus-stat-label">{t('chessPlus.info.hand')}</span>
                <strong className="chess-plus-stat-value">{t('chessPlus.moves.red')}</strong>
              </article>
              <article>
                <span className="chess-plus-stat-label">{t('chessPlus.info.skin')}</span>
                <strong className="chess-plus-stat-value">{t(`chessPlus.skin.${status.currentSkin}`)}</strong>
              </article>
              <article>
                <span className="chess-plus-stat-label">{t('chessPlus.info.rounds')}</span>
                <strong className="chess-plus-stat-value">{Math.ceil(status.moveNotations.length / 2)}</strong>
              </article>
            </div>
          </section>
        </aside>
      </section>

      {/* Move history modal */}
      {showMovesModal && (
        <div className="chess-plus-modal-backdrop" onClick={() => setShowMovesModal(false)}>
          <div className="chess-plus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chess-plus-modal-header">
              <span className="chess-plus-modal-title">{t('chessPlus.panel.moves')}</span>
              <button className="chess-plus-modal-close" onClick={() => setShowMovesModal(false)} aria-label={t('control.close')}>✕</button>
            </div>
            <div className="chess-plus-modal-body">
              <div className="chess-plus-moves-table">
                <div className="chess-plus-moves-head">
                  <span>{t('chessPlus.moves.round')}</span>
                  <span>{t('chessPlus.moves.red')}</span>
                  <span>{t('chessPlus.moves.black')}</span>
                </div>
                <div className="chess-plus-modal-moves-body">
                  {roundRows.map((row) => (
                    <div key={row.round} className="chess-plus-moves-row">
                      <span className="chess-plus-moves-round">{row.round}</span>
                      <span className="chess-plus-moves-cell">{row.red ?? '—'}</span>
                      <span className="chess-plus-moves-cell">{row.black ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
