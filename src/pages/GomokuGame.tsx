import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import Board from '../games/gobang/Board';
import Control from '../games/gobang/Control';
import { getStatusText } from '../games/gobang/engine';
import { GobangProvider, useGobang } from '../games/gobang/store';
import './GomokuGame.css';

const DEFAULT_BOARD_SIZE = 520;
const MIN_BOARD_SIZE = 360;
const MAX_BOARD_SIZE = 760;
const BOARD_SIZE_STEP = 40;

function GomokuScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useGobang();
  const [boardSize, setBoardSize] = useState(DEFAULT_BOARD_SIZE);

  const zoomIn = () => {
    setBoardSize((size) => Math.min(MAX_BOARD_SIZE, size + BOARD_SIZE_STEP));
  };

  const zoomOut = () => {
    setBoardSize((size) => Math.max(MIN_BOARD_SIZE, size - BOARD_SIZE_STEP));
  };

  const zoomReset = () => {
    setBoardSize(DEFAULT_BOARD_SIZE);
  };

  return (
    <div className="gomoku-page pixel-container">
      <h1 className="gomoku-title">{t('gomoku.title')}</h1>

      <div className="gomoku-top-bar">
        <button type="button" className="gomoku-back-btn" onClick={() => navigate('/')}>
          ◀ HOME
        </button>
        <div className="gomoku-status-chip">{state.status === 'gaming' ? t('gomoku.playing') : t('gomoku.ready')}</div>
      </div>

<div className="gomoku-main-layout">
        <section className="gomoku-board-panel">
          <div className="gomoku-status-bar">{getStatusText(state, t)}</div>
          <Board boardSize={boardSize} />
          <div className="gomoku-controls-hint">
            <span>{t('gomoku.hint.dual')}</span>
            <span>{t('gomoku.hint.click')}</span>
            <span>{t('gomoku.hint.win')}</span>
          </div>
        </section>

        <aside className="gomoku-side-panel">
          <div className="gomoku-panel-block">
            <div className="gomoku-panel-title">{t('gomoku.status')}</div>
            <Control />
          </div>
          <div className="gomoku-panel-block">
            <div className="gomoku-panel-title">{t('zoom.out')}/{t('zoom.in')}</div>
            <div className="gomoku-zoom-controls">
              <button
                type="button"
                className="gomoku-zoom-btn"
                onClick={zoomOut}
                disabled={boardSize <= MIN_BOARD_SIZE}
              >
                −
              </button>
              <span className="gomoku-zoom-value">{Math.round((boardSize / DEFAULT_BOARD_SIZE) * 100)}%</span>
              <button
                type="button"
                className="gomoku-zoom-btn"
                onClick={zoomIn}
                disabled={boardSize >= MAX_BOARD_SIZE}
              >
                +
              </button>
              <button
                type="button"
                className="gomoku-zoom-reset"
                onClick={zoomReset}
                disabled={boardSize === DEFAULT_BOARD_SIZE}
              >
                {t('gomoku.zoom.reset')}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function GomokuGame() {
  return (
    <GobangProvider>
      <GomokuScreen />
    </GobangProvider>
  );
}
