import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChessEngine } from '../games/chess/engine';
import { PRESETS } from '../games/chess/presets';
import type { ChessStatus, Difficulty, SkinType } from '../games/chess/types';
import './ChessPlusGame.css';

const DEFAULT_STATUS: ChessStatus = {
  scoreText: '资源加载中...',
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

const SKIN_LABELS: Record<SkinType, string> = {
  stype1: 'CLASSIC',
  stype2: 'WOOD',
  stype3: 'PRO',
};

const MODE_LABELS = {
  duel: '人机对弈',
  pvp: '人人对战',
  preset: '残局挑战',
} as const;

export function ChessPlusGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const selectAudioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<ReturnType<typeof createChessEngine> | null>(null);

  const [status, setStatus] = useState<ChessStatus>(DEFAULT_STATUS);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [presetIndex, setPresetIndex] = useState(0);
  const [playMode, setPlayMode] = useState<'duel' | 'pvp' | 'preset'>('duel');
  const [selectedSkin, setSelectedSkin] = useState<SkinType>('stype2');

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

  useEffect(() => {
    setSelectedSkin(status.currentSkin);
  }, [status.currentSkin]);

  const winnerText = useMemo(() => {
    if (status.winner === 1) return '红方胜';
    if (status.winner === -1) return '黑方胜';
    return '';
  }, [status.winner]);

  const modeText = useMemo(() => {
    if (status.mode === 'menu') return `待开始 · ${MODE_LABELS[playMode]}`;
    if (status.mode === 'preset') return `残局挑战 · ${PRESETS[status.presetIndex]?.name ?? '未选择'}`;
    return MODE_LABELS[status.mode];
  }, [playMode, status.mode, status.presetIndex]);

  const turnText = useMemo(() => {
    if (status.winner !== null) return winnerText;
    if (status.thinking) return 'AI 思考中';
    return status.turn === 1 ? '红方行棋' : '黑方行棋';
  }, [status.thinking, status.turn, status.winner, winnerText]);

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
    engine.startPreset(presetIndex);
  };

  const handleSkinChange = (value: SkinType) => {
    setSelectedSkin(value);
    void engineRef.current?.setSkin(value);
  };

  return (
    <div className="chess-plus-page pixel-container">
      <audio ref={clickAudioRef} src="/chess/audio/click.wav" preload="auto" />
      <audio ref={selectAudioRef} src="/chess/audio/select.wav" preload="auto" />

      <header className="chess-plus-hero">
        <button type="button" className="chess-plus-back-btn" onClick={() => navigate('/')}>
          ◀ HOME
        </button>
        <div className="chess-plus-hero-copy">
          <p className="chess-plus-kicker">GAMESHIN STRATEGY TABLE</p>
          <h1>
            Chinese Chess
            <span className="chess-plus-word">Plus</span>
          </h1>
          <p>加入人人对战、下拉式设置面板与右侧顶部走棋记录的增强版中国象棋界面。</p>
        </div>
        <div className="chess-plus-hero-badges">
          <span>{modeText}</span>
          <span>{turnText}</span>
          <span>{SKIN_LABELS[status.currentSkin]}</span>
        </div>
      </header>

      <section className="chess-plus-shell">
        <div className="chess-plus-board-card">
          <div className="chess-plus-board-header">
            <div>
              <p className="chess-plus-board-label">当前状态</p>
              <h2>{status.scoreText}</h2>
            </div>
            <div className="chess-plus-board-meta">
              <span>{status.isPlaying ? '对局中' : '未开局'}</span>
              <span>{playMode === 'duel' ? `难度 ${difficulty}` : MODE_LABELS[playMode]}</span>
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
                      再来一局
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chess-plus-footer-hints">
            <span>点击棋子选中并落子</span>
            <span>支持 AI 对弈 / 人人对战 / 残局模式</span>
            <span>设置区已改为下拉列表</span>
          </div>
        </div>

        <aside className="chess-plus-sidebar">
          <section className="chess-plus-panel chess-plus-moves-panel">
            <div className="chess-plus-panel-title">走棋记录</div>
            {roundRows.length ? (
              <div className="chess-plus-moves-table">
                <div className="chess-plus-moves-head">
                  <span>回合</span>
                  <span>红方</span>
                  <span>黑方</span>
                </div>
                <div className="chess-plus-moves-body">
                  {roundRows.map((row) => (
                    <div key={row.round} className="chess-plus-moves-row">
                      <span>{row.round}</span>
                      <span>{row.red ?? '—'}</span>
                      <span>{row.black ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chess-plus-empty-state">开局后会在这里显示完整着法记录。</div>
            )}
          </section>

          <section className="chess-plus-panel">
            <div className="chess-plus-panel-title">对局设置</div>
            <div className="chess-plus-form-grid">
              <label className="chess-plus-field">
                <span>模式</span>
                <select className="chess-plus-select" value={playMode} onChange={(event) => setPlayMode(event.target.value as 'duel' | 'pvp' | 'preset')}>
                  <option value="duel">人机对弈</option>
                  <option value="pvp">人人对战</option>
                  <option value="preset">残局挑战</option>
                </select>
              </label>

              <label className="chess-plus-field">
                <span>难度</span>
                <select
                  className="chess-plus-select"
                  value={difficulty}
                  disabled={playMode !== 'duel'}
                  onChange={(event) => {
                    const value = Number(event.target.value) as Difficulty;
                    setDifficulty(value);
                    engineRef.current?.setDifficulty(value);
                  }}
                >
                  <option value={2}>菜鸟</option>
                  <option value={3}>中级</option>
                  <option value={4}>高手</option>
                </select>
              </label>

              <label className="chess-plus-field">
                <span>残局</span>
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
                      {String(index + 1).padStart(2, '0')} · {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="chess-plus-field">
                <span>皮肤</span>
                <select className="chess-plus-select" value={selectedSkin} onChange={(event) => handleSkinChange(event.target.value as SkinType)}>
                  {Object.entries(SKIN_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="chess-plus-panel-actions two-col">
              <button type="button" className="chess-plus-primary-btn" onClick={handleStartGame}>
                开始对局
              </button>
              <button type="button" className="chess-plus-secondary-btn" onClick={() => engineRef.current?.restart()}>
                重新开始
              </button>
            </div>
          </section>

          <section className="chess-plus-panel">
            <div className="chess-plus-panel-title">棋局操作</div>
            <div className="chess-plus-panel-actions two-col">
              <button type="button" className="chess-plus-secondary-btn" onClick={() => engineRef.current?.regret()}>
                悔棋
              </button>
              <button type="button" className="chess-plus-secondary-btn" onClick={() => engineRef.current?.cycleSkin()}>
                顺切皮肤
              </button>
            </div>
          </section>

          <section className="chess-plus-panel chess-plus-panel-stats">
            <div className="chess-plus-panel-title">局面信息</div>
            <div className="chess-plus-stats-grid">
              <article>
                <span>模式</span>
                <strong>{modeText}</strong>
              </article>
              <article>
                <span>先手</span>
                <strong>红方</strong>
              </article>
              <article>
                <span>当前皮肤</span>
                <strong>{SKIN_LABELS[status.currentSkin]}</strong>
              </article>
              <article>
                <span>回合数</span>
                <strong>{Math.ceil(status.moveNotations.length / 2)}</strong>
              </article>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
