import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n';
import './TetrisGame.css';

const GRID_ROWS = 22;
const GRID_COLS = 10;
const VISIBLE_TOP = 2;
const BASE_CELL = 24;
const MIN_CELL = 18;
const MAX_CELL = 52;

function intToRGB(v: number): string {
  return `rgb(${(v >> 16) & 0xFF},${(v >> 8) & 0xFF},${v & 0xFF})`;
}

function createGrid(): number[][] {
  const g: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) { g[r] = []; for (let c = 0; c < GRID_COLS; c++) g[r][c] = 0; }
  return g;
}

function gridIsLine(g: number[][], row: number): boolean { return g[row].every(c => c !== 0); }

function gridClearLines(g: number[][]): number {
  let dist = 0;
  for (let r = GRID_ROWS - 1; r >= 0; r--) {
    if (gridIsLine(g, r)) { dist++; for (let c = 0; c < GRID_COLS; c++) g[r][c] = 0; }
    else if (dist > 0) { for (let c = 0; c < GRID_COLS; c++) { g[r + dist][c] = g[r][c]; g[r][c] = 0; } }
  }
  return dist;
}

function gridIsEmptyRow(g: number[][], row: number): boolean { return g[row].every(c => c === 0); }
function gridExceeded(g: number[][]): boolean { return !gridIsEmptyRow(g, 0) || !gridIsEmptyRow(g, 1); }

function gridAddPiece(g: number[][], p: PieceType): void {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      const _r = p.row + r, _c = p.column + c;
      if (p.cells[r][c] !== 0 && _r >= 0) g[_r][_c] = p.cells[r][c];
    }
}

function gridValid(g: number[][], p: PieceType): boolean {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      if (p.cells[r][c] === 0) continue;
      const _r = p.row + r, _c = p.column + c;
      if (_r < 0 || _r >= GRID_ROWS || _c < 0 || _c >= GRID_COLS || g[_r][_c] !== 0) return false;
    }
  return true;
}

interface PieceType { cells: number[][]; dimension: number; row: number; column: number; }

function pieceClone(p: PieceType): PieceType {
  return { cells: p.cells.map(row => [...row]), dimension: p.dimension, row: p.row, column: p.column };
}

const PIECE_FROM_INDEX: number[][][] = [
  [[0x0000AA, 0x0000AA], [0x0000AA, 0x0000AA]],
  [[0xC0C0C0, 0x000000, 0x000000], [0xC0C0C0, 0xC0C0C0, 0xC0C0C0], [0x000000, 0x000000, 0x000000]],
  [[0x000000, 0x000000, 0xAA00AA], [0xAA00AA, 0xAA00AA, 0xAA00AA], [0x000000, 0x000000, 0x000000]],
  [[0x00AAAA, 0x00AAAA, 0x000000], [0x000000, 0x00AAAA, 0x00AAAA], [0x000000, 0x000000, 0x000000]],
  [[0x000000, 0x00AA00, 0x00AA00], [0x00AA00, 0x00AA00, 0x000000], [0x000000, 0x000000, 0x000000]],
  [[0x000000, 0xAA5500, 0x000000], [0xAA5500, 0xAA5500, 0xAA5500], [0x000000, 0x000000, 0x000000]],
  [[0x000000, 0x000000, 0x000000, 0x000000], [0xAA0000, 0xAA0000, 0xAA0000, 0xAA0000], [0x000000, 0x000000, 0x000000, 0x000000], [0x000000, 0x000000, 0x000000, 0x000000]],
];

function pieceFromIndex(index: number): PieceType {
  const cells = PIECE_FROM_INDEX[index].map(row => [...row]);
  return { cells, dimension: cells.length, row: 0, column: Math.floor((GRID_COLS - cells.length) / 2) };
}

function pieceCanMoveDown(g: number[][], p: PieceType): boolean {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      if (p.cells[r][c] === 0) continue;
      const _r = p.row + r + 1, _c = p.column + c;
      if (_r >= 0 && !(_r < GRID_ROWS && g[_r][_c] === 0)) return false;
    }
  return true;
}

function pieceCanMoveLeft(g: number[][], p: PieceType): boolean {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      if (p.cells[r][c] === 0) continue;
      const _r = p.row + r, _c = p.column + c - 1;
      if (!(_c >= 0 && g[_r][_c] === 0)) return false;
    }
  return true;
}

function pieceCanMoveRight(g: number[][], p: PieceType): boolean {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      if (p.cells[r][c] === 0) continue;
      const _r = p.row + r, _c = p.column + c + 1;
      if (!(_c >= 0 && g[_r][_c] === 0)) return false;
    }
  return true;
}

function pieceMoveDown(g: number[][], p: PieceType): boolean { if (!pieceCanMoveDown(g, p)) return false; p.row++; return true; }
function pieceMoveLeft(g: number[][], p: PieceType): boolean { if (!pieceCanMoveLeft(g, p)) return false; p.column--; return true; }
function pieceMoveRight(g: number[][], p: PieceType): boolean { if (!pieceCanMoveRight(g, p)) return false; p.column++; return true; }

function pieceRotateCells(p: PieceType): void {
  const d = p.dimension, _cells = Array.from({ length: d }, () => Array(d).fill(0));
  if (d === 2) { _cells[0][0]=p.cells[1][0]; _cells[0][1]=p.cells[0][0]; _cells[1][0]=p.cells[1][1]; _cells[1][1]=p.cells[0][1]; }
  else if (d === 3) {
    _cells[0][0]=p.cells[2][0]; _cells[0][1]=p.cells[1][0]; _cells[0][2]=p.cells[0][0];
    _cells[1][0]=p.cells[2][1]; _cells[1][1]=p.cells[1][1]; _cells[1][2]=p.cells[0][1];
    _cells[2][0]=p.cells[2][2]; _cells[2][1]=p.cells[1][2]; _cells[2][2]=p.cells[0][2];
  } else if (d === 4) {
    _cells[0][0]=p.cells[3][0]; _cells[0][1]=p.cells[2][0]; _cells[0][2]=p.cells[1][0]; _cells[0][3]=p.cells[0][0];
    _cells[1][3]=p.cells[0][1]; _cells[2][3]=p.cells[0][2]; _cells[3][3]=p.cells[0][3];
    _cells[3][2]=p.cells[1][3]; _cells[3][1]=p.cells[2][3]; _cells[3][0]=p.cells[3][3];
    _cells[2][0]=p.cells[3][2]; _cells[1][0]=p.cells[3][1];
    _cells[1][1]=p.cells[2][1]; _cells[1][2]=p.cells[1][1]; _cells[2][2]=p.cells[1][2]; _cells[2][1]=p.cells[2][2];
  }
  p.cells = _cells;
}

function pieceRotate(g: number[][], p: PieceType): void {
  const copy = pieceClone(p); pieceRotateCells(copy);
  if (gridValid(g, copy)) { pieceRotateCells(p); return; }
  const initRow = copy.row, initCol = copy.column;
  for (let i = 0; i < p.dimension - 1; i++) {
    copy.column = initCol + i; copy.row = initRow;
    if (gridValid(g, copy)) { pieceRotateCells(p); p.column += i; return; }
    for (let j = 0; j < p.dimension - 1; j++) { copy.row = initRow - j; if (gridValid(g, copy)) { pieceRotateCells(p); p.column += i; p.row -= j; return; } }
  }
  copy.column = initCol; copy.row = initRow;
  for (let i = 0; i < p.dimension - 1; i++) {
    copy.column = initCol - i; copy.row = initRow;
    if (gridValid(g, copy)) { pieceRotateCells(p); p.column -= i; return; }
    for (let j = 0; j < p.dimension - 1; j++) { copy.row = initRow - j; if (gridValid(g, copy)) { pieceRotateCells(p); p.column -= i; p.row -= j; return; } }
  }
}

function shuffledBag(): number[] {
  const bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  return bag;
}

function createStopwatch(cb: (elapsed: number) => void) {
  let stopped = false, start = Date.now();
  const frame = () => { if (stopped) return; cb(Date.now() - start); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  return { stop: () => { stopped = true; } };
}

// Simple interval-based timer for game gravity
// Using setInterval avoids rAF closure issues in production builds
function createTimer(cb: () => void, delay: number) {
  let id: ReturnType<typeof setInterval> | null = null;
  return {
    start() { if (id !== null) return; id = setInterval(cb, delay); },
    stop() { if (id !== null) { clearInterval(id); id = null; } },
    destroy() { this.stop(); },
    resetForward(newDelay: number) {
      this.stop();
      cb();
      id = setInterval(cb, newDelay);
    },
  };
}

function drawGridCells(ctx: CanvasRenderingContext2D, g: number[][], cs: number) {
  for (let r = VISIBLE_TOP; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++) {
      if (g[r][c] === 0) continue;
      ctx.fillStyle = intToRGB(g[r][c]); ctx.fillRect(cs * c, cs * (r - VISIBLE_TOP), cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(cs * c, cs * (r - VISIBLE_TOP), cs, cs);
    }
}

function drawPiece(ctx: CanvasRenderingContext2D, p: PieceType, cs: number, vo = 0) {
  for (let r = 0; r < p.dimension; r++)
    for (let c = 0; c < p.dimension; c++) {
      if (p.cells[r][c] === 0) continue;
      ctx.fillStyle = intToRGB(p.cells[r][c]); ctx.fillRect(cs * (c + p.column), cs * (r + p.row - VISIBLE_TOP) + vo, cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(cs * (c + p.column), cs * (r + p.row - VISIBLE_TOP) + vo, cs, cs);
    }
}

function drawPreview(ctx: CanvasRenderingContext2D, p: PieceType, cs: number, w: number, h: number) {
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0a0e17'; ctx.fillRect(0, 0, w, h);
  const xOff = p.dimension === 2 ? cs : p.dimension === 3 ? cs / 2 : 0;
  const yOff = p.dimension === 2 ? cs : p.dimension === 3 ? cs : cs / 2;
  for (let r = 0; r < p.dimension; r++)
    for (let c = 0; c < p.dimension; c++) {
      if (p.cells[r][c] === 0) continue;
      ctx.fillStyle = intToRGB(p.cells[r][c]); ctx.fillRect(xOff + cs * c, yOff + cs * r, cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(xOff + cs * c, yOff + cs * r, cs, cs);
    }
}

// ── Main game component ──
export function TetrisGame() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem('tetris-hi') || '0', 10));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [cellSize, setCellSize] = useState(BASE_CELL);
  const [gameKey, setGameKey] = useState(0);
  const [lastScore, setLastScore] = useState(0);

  const startNewGame = useCallback(() => {
    setGameKey(k => k + 1);
    setScore(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState('over');
    setLastScore(finalScore);
    const prevHi = parseInt(localStorage.getItem('tetris-hi') || '0', 10);
    if (finalScore > prevHi) {
      localStorage.setItem('tetris-hi', finalScore.toString());
      setHi(finalScore);
    }
  }, []);

  const zoomIn = () => setCellSize(s => Math.min(MAX_CELL, s + 4));
  const zoomOut = () => setCellSize(s => Math.max(MIN_CELL, s - 4));
  const zoomReset = () => setCellSize(BASE_CELL);

  return (
    <div className="tetris-page">
      <h1 className="tetris-title">{t('tetris.title')}</h1>
      <div className="tetris-top-row">
        <button className="tetris-back-btn" onClick={() => navigate('/')}>{t('tetris.back')}</button>
        <div className="tetris-stats">
          <span className="tetris-stat">{t('tetris.lines')}: <b>{score}</b></span>
          <span className="tetris-stat">{t('tetris.best')}: <b>{hi}</b></span>
          <span className="tetris-stat">SCORE: <b>{score}</b></span>
        </div>
      </div>
      <div className="tetris-zoom-bar">
        <button className="tetris-zoom-btn" onClick={zoomOut} disabled={cellSize <= MIN_CELL} title={t('zoom.out')}>−</button>
        <span className="tetris-zoom-label">{Math.round((cellSize / BASE_CELL) * 100)}%</span>
        <button className="tetris-zoom-btn" onClick={zoomIn} disabled={cellSize >= MAX_CELL} title={t('zoom.in')}>+</button>
        <button className="tetris-zoom-reset" onClick={() => { zoomReset(); startNewGame(); }} title={t('zoom.reset')}>⟲</button>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        {/* Only render board when playing or showing frozen game over state */}
        {gameState !== 'idle' && (
          <TetrisBoard
            key={gameKey}
            cellSize={cellSize}
            
            onGameOver={handleGameOver}
            onScoreChange={setScore}
          />
        )}

        {gameState === 'idle' && (
          <TetrisBoardIdle cellSize={cellSize} onStart={startNewGame} />
        )}

        {gameState === 'over' && (
          <div className="tetris-overlay-abs">
            <div className="tetris-overlay-body">
              <span className="tetris-overlay-icon">💀</span>
              <h2 className="tetris-gameover-title">{t('tetris.gameOver')}</h2>
              <p className="tetris-final-score">{t('tetris.lines')}: {lastScore}</p>
              {lastScore >= hi && lastScore > 0 && <p className="tetris-new-record">{t('tetris.newRecord')}</p>}
              <button className="tetris-restart-btn" onClick={startNewGame}>{t('tetris.playAgain')}</button>
              <p className="tetris-hint">{t('tetris.orPressKey')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Idle board (just shows empty canvas + start overlay) ──
function TetrisBoardIdle({ cellSize, onStart }: { cellSize: number; onStart: () => void }) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridW = GRID_COLS * cellSize;
  const gridH = (GRID_ROWS - VISIBLE_TOP) * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0e17'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a3a55'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [cellSize]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { e.preventDefault(); onStart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  return (
    <div className="tetris-play-area" style={{ position: 'relative' }}>
      <div className="tetris-canvas-wrap" style={{ maxWidth: gridW }}>
        <canvas ref={canvasRef} width={gridW} height={gridH} className="tetris-canvas" style={{ width: gridW, height: gridH }} />
        <div className="tetris-overlay-abs">
          <div className="tetris-overlay-body">
            <span className="tetris-overlay-icon">🧱</span>
            <p>{t('tetris.pressStart')}</p>
            <p className="tetris-hint">{t('tetris.hint')}</p>
            <button className="tetris-restart-btn" onClick={onStart}>{t('tetris.playAgain')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active game board ──
function TetrisBoard({ cellSize, onGameOver, onScoreChange }: {
  cellSize: number; onGameOver: (score: number) => void; onScoreChange: (score: number) => void;
}) {
  const cs = cellSize;
  const gridW = GRID_COLS * cs;
  const gridH = (GRID_ROWS - VISIBLE_TOP) * cs;
  const nextSz = 3 * cs;
  const csRef = useRef(cs); csRef.current = cs;
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef(createGrid());
  const workingPiecesRef = useRef<(PieceType | null)[]>([null, null]);
  const workingPieceRef = useRef<PieceType | null>(null);
  const bagRef = useRef<number[]>(shuffledBag());
  const bagIdxRef = useRef(-1);
  const scoreRef = useRef(0);
  const keyEnabledRef = useRef(false);
  const gravTimerRef = useRef<ReturnType<typeof createTimer> | null>(null);
  const dropStopwatchRef = useRef<ReturnType<typeof createStopwatch> | null>(null);
  const gameOverCalledRef = useRef(false);

  function bagNext(): number {
    bagIdxRef.current++;
    if (bagIdxRef.current >= bagRef.current.length) { bagRef.current = shuffledBag(); bagIdxRef.current = 0; }
    return bagRef.current[bagIdxRef.current];
  }

  const redrawGrid = (vertOffset = 0) => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const _cs = csRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0e17'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridCells(ctx, gridRef.current, _cs);
    const wp = workingPieceRef.current;
    if (wp) drawPiece(ctx, wp, _cs, vertOffset);
    ctx.strokeStyle = '#2a3a55'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);
  };

  const redrawNext = () => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const _cs = csRef.current;
    const next = workingPiecesRef.current[1];
    if (next) drawPreview(ctx, next, _cs, canvas.width, canvas.height);
  };

  const endTurn = () => {
    if (!workingPieceRef.current) return false;
    gridAddPiece(gridRef.current, workingPieceRef.current);
    scoreRef.current += gridClearLines(gridRef.current);
    onScoreChange(scoreRef.current);
    redrawGrid();
    return !gridExceeded(gridRef.current);
  };

  const startTurn = () => {
    // Shift queue: fill index 0 (active) from index 1 (preview), or generate if first call
    workingPiecesRef.current[0] = workingPiecesRef.current[1] || pieceFromIndex(bagNext());
    workingPiecesRef.current[1] = pieceFromIndex(bagNext());
    workingPieceRef.current = workingPiecesRef.current[0];
    const nc = nextCanvasRef.current;
    if (nc) { const sz = 3 * csRef.current; nc.width = sz; nc.height = sz; }
    redrawGrid(); redrawNext();
    keyEnabledRef.current = true;
    if (gravTimerRef.current) gravTimerRef.current.resetForward(500);
  };

  const onGravityTick = () => {
    const wp = workingPieceRef.current;
    if (!wp) return;
    if (pieceCanMoveDown(gridRef.current, wp)) { pieceMoveDown(gridRef.current, wp); redrawGrid(); return; }
    gravTimerRef.current?.stop();
    if (!endTurn()) {
      keyEnabledRef.current = false;
      if (!gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        onGameOver(scoreRef.current);
      }
      return;
    }
    startTurn();
  };

  useEffect(() => {
    gameOverCalledRef.current = false;
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0e17'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a3a55'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);

    gravTimerRef.current = createTimer(onGravityTick, 500);
    gravTimerRef.current.start();
    startTurn();
    return () => {
      if (gravTimerRef.current) gravTimerRef.current.destroy();
      gravTimerRef.current = null;
      dropStopwatchRef.current?.stop();
      dropStopwatchRef.current = null;
    };
  }, []);

  const onSpace = () => {
    keyEnabledRef.current = false;
    gravTimerRef.current?.stop();
    let animH = 0;
    if (workingPieceRef.current) {
      const copy = pieceClone(workingPieceRef.current);
      while (pieceMoveDown(gridRef.current, copy)) animH++;
    }
    dropStopwatchRef.current?.stop();
    if (workingPieceRef.current) {
      dropStopwatchRef.current = createStopwatch((elapsed) => {
        if (elapsed >= animH * 20) { dropStopwatchRef.current?.stop(); redrawGrid(csRef.current * animH); doDrop(); return; }
        redrawGrid(csRef.current * elapsed / 20);
      });
    } else {
      doDrop();
    }
    function doDrop() {
      const wp = workingPieceRef.current; if (!wp) return;
      while (pieceMoveDown(gridRef.current, wp)) {}
      if (!endTurn()) {
        keyEnabledRef.current = false;
        if (!gameOverCalledRef.current) {
          gameOverCalledRef.current = true;
          onGameOver(scoreRef.current);
        }
        return;
      }
      startTurn();
    }
  };

  const onUp = () => { const wp = workingPieceRef.current; if (!wp) return; pieceRotate(gridRef.current, wp); redrawGrid(); };
  const onDown = () => { gravTimerRef.current?.resetForward(500); };
  const onLeft = () => { const wp = workingPieceRef.current; if (!wp) return; if (pieceCanMoveLeft(gridRef.current, wp)) { pieceMoveLeft(gridRef.current, wp); redrawGrid(); } };
  const onRight = () => { const wp = workingPieceRef.current; if (!wp) return; if (pieceCanMoveRight(gridRef.current, wp)) { pieceMoveRight(gridRef.current, wp); redrawGrid(); } };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!keyEnabledRef.current) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); onLeft(); break;
        case 'ArrowRight': e.preventDefault(); onRight(); break;
        case 'ArrowDown': e.preventDefault(); onDown(); break;
        case 'ArrowUp': e.preventDefault(); onUp(); break;
        case ' ': e.preventDefault(); onSpace(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleTouchAction = (action: () => void) => { action(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div className="tetris-play-area">
        <div className="tetris-canvas-wrap" style={{ maxWidth: gridW }}>
          <canvas ref={gridCanvasRef} width={gridW} height={gridH} className="tetris-canvas" style={{ width: gridW, height: gridH }} />
          <div className="tetris-next-overlay">
            <span className="tetris-next-label">NEXT</span>
            <canvas ref={nextCanvasRef} width={nextSz} height={nextSz} className="tetris-next-canvas" style={{ width: nextSz, height: nextSz }} />
          </div>
        </div>
      </div>
      <div className="tetris-dpad">
        <div className="tetris-dpad-row">
          <button className="tetris-dpad-btn tetris-dpad-wide" onPointerDown={() => handleTouchAction(onLeft)} aria-label="Left">◀</button>
          <button className="tetris-dpad-btn" onPointerDown={() => handleTouchAction(onUp)} aria-label="Rotate">▲</button>
          <button className="tetris-dpad-btn tetris-dpad-wide" onPointerDown={() => handleTouchAction(onRight)} aria-label="Right">▶</button>
        </div>
        <div className="tetris-dpad-row">
          <button className="tetris-dpad-btn tetris-dpad-wide" onPointerDown={() => handleTouchAction(onDown)} aria-label="Soft drop">▼</button>
          <button className="tetris-dpad-btn tetris-dpad-drop" onPointerDown={() => handleTouchAction(onSpace)} aria-label="Hard drop">DROP</button>
        </div>
      </div>
    </div>
  );
}
