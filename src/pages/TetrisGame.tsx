import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TetrisGame.css';

// ── Constants ──
const GRID_ROWS = 22;
const GRID_COLS = 10;
const VISIBLE_TOP = 2;
const BASE_CELL = 26;
const MIN_CELL = 16;
const MAX_CELL = 52;

// ── Color: int → 'rgb(R,G,B)' ──
function intToRGB(v: number): string {
  return `rgb(${(v >> 16) & 0xFF},${(v >> 8) & 0xFF},${v & 0xFF})`;
}

// ── Grid helpers ──
function createGrid(): number[][] {
  const g: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < GRID_COLS; c++) g[r][c] = 0;
  }
  return g;
}

function gridIsLine(g: number[][], row: number): boolean {
  return g[row].every(c => c !== 0);
}

function gridClearLines(g: number[][]): number {
  let dist = 0;
  for (let r = GRID_ROWS - 1; r >= 0; r--) {
    if (gridIsLine(g, r)) {
      dist++;
      for (let c = 0; c < GRID_COLS; c++) g[r][c] = 0;
    } else if (dist > 0) {
      for (let c = 0; c < GRID_COLS; c++) {
        g[r + dist][c] = g[r][c];
        g[r][c] = 0;
      }
    }
  }
  return dist;
}

function gridIsEmptyRow(g: number[][], row: number): boolean {
  return g[row].every(c => c === 0);
}

function gridExceeded(g: number[][]): boolean {
  return !gridIsEmptyRow(g, 0) || !gridIsEmptyRow(g, 1);
}

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
      if (_r < 0 || _r >= GRID_ROWS) return false;
      if (_c < 0 || _c >= GRID_COLS) return false;
      if (g[_r][_c] !== 0) return false;
    }
  return true;
}

// ── Piece ──
interface PieceType {
  cells: number[][];
  dimension: number;
  row: number;
  column: number;
}

interface RotateOffset {
  rowOffset: number;
  columnOffset: number;
}

function pieceClone(p: PieceType): PieceType {
  const _cells = p.cells.map(row => [...row]);
  return { cells: _cells, dimension: p.dimension, row: p.row, column: p.column };
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
  const dim = cells.length;
  return { cells, dimension: dim, row: 0, column: Math.floor((GRID_COLS - dim) / 2) };
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

function pieceCanMoveDown(g: number[][], p: PieceType): boolean {
  for (let r = 0; r < p.cells.length; r++)
    for (let c = 0; c < p.cells[r].length; c++) {
      if (p.cells[r][c] === 0) continue;
      const _r = p.row + r + 1, _c = p.column + c;
      if (_r >= 0 && !(_r < GRID_ROWS && g[_r][_c] === 0)) return false;
    }
  return true;
}

function pieceMoveLeft(g: number[][], p: PieceType): boolean {
  if (!pieceCanMoveLeft(g, p)) return false;
  p.column--;
  return true;
}

function pieceMoveRight(g: number[][], p: PieceType): boolean {
  if (!pieceCanMoveRight(g, p)) return false;
  p.column++;
  return true;
}

function pieceMoveDown(g: number[][], p: PieceType): boolean {
  if (!pieceCanMoveDown(g, p)) return false;
  p.row++;
  return true;
}

function pieceRotateCells(p: PieceType): void {
  const d = p.dimension;
  const _cells: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  if (d === 2) {
    _cells[0][0] = p.cells[1][0]; _cells[0][1] = p.cells[0][0];
    _cells[1][0] = p.cells[1][1]; _cells[1][1] = p.cells[0][1];
  } else if (d === 3) {
    _cells[0][0] = p.cells[2][0]; _cells[0][1] = p.cells[1][0]; _cells[0][2] = p.cells[0][0];
    _cells[1][0] = p.cells[2][1]; _cells[1][1] = p.cells[1][1]; _cells[1][2] = p.cells[0][1];
    _cells[2][0] = p.cells[2][2]; _cells[2][1] = p.cells[1][2]; _cells[2][2] = p.cells[0][2];
  } else if (d === 4) {
    _cells[0][0] = p.cells[3][0]; _cells[0][1] = p.cells[2][0]; _cells[0][2] = p.cells[1][0]; _cells[0][3] = p.cells[0][0];
    _cells[1][3] = p.cells[0][1]; _cells[2][3] = p.cells[0][2]; _cells[3][3] = p.cells[0][3];
    _cells[3][2] = p.cells[1][3]; _cells[3][1] = p.cells[2][3]; _cells[3][0] = p.cells[3][3];
    _cells[2][0] = p.cells[3][2]; _cells[1][0] = p.cells[3][1];
    _cells[1][1] = p.cells[2][1]; _cells[1][2] = p.cells[1][1]; _cells[2][2] = p.cells[1][2]; _cells[2][1] = p.cells[2][2];
  }
  p.cells = _cells;
}

function pieceComputeRotateOffset(g: number[][], p: PieceType): RotateOffset | null {
  const copy = pieceClone(p);
  pieceRotateCells(copy);
  if (gridValid(g, copy)) return { rowOffset: copy.row - p.row, columnOffset: copy.column - p.column };

  const initRow = copy.row;
  const initCol = copy.column;

  for (let i = 0; i < p.dimension - 1; i++) {
    copy.column = initCol + i;
    if (gridValid(g, copy)) return { rowOffset: copy.row - p.row, columnOffset: copy.column - p.column };
    for (let j = 0; j < p.dimension - 1; j++) {
      copy.row = initRow - j;
      if (gridValid(g, copy)) return { rowOffset: copy.row - p.row, columnOffset: copy.column - p.column };
    }
    copy.row = initRow;
  }
  copy.column = initCol;

  for (let i = 0; i < p.dimension - 1; i++) {
    copy.column = initCol - i;
    if (gridValid(g, copy)) return { rowOffset: copy.row - p.row, columnOffset: copy.column - p.column };
    for (let j = 0; j < p.dimension - 1; j++) {
      copy.row = initRow - j;
      if (gridValid(g, copy)) return { rowOffset: copy.row - p.row, columnOffset: copy.column - p.column };
    }
    copy.row = initRow;
  }
  copy.column = initCol;
  return null;
}

function pieceRotate(g: number[][], p: PieceType): void {
  const offset = pieceComputeRotateOffset(g, p);
  if (offset !== null) {
    pieceRotateCells(p);
    p.row += offset.rowOffset;
    p.column += offset.columnOffset;
  }
}

// ── Bag randomizer ──
function shuffledBag(): number[] {
  const bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// ── Stopwatch ──
function createStopwatch(callback: (elapsed: number) => void) {
  let stopped = false;
  const start = Date.now();
  const frame = () => {
    if (stopped) return;
    callback(Date.now() - start);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return { stop: () => { stopped = true; } };
}

// ── Timer (rAF-based interval) ──
function createTimer(callback: () => void, delay: number) {
  let lastUpdate: number | null = null;
  let running = false;
  let currentDelay = delay;

  const loop = () => {
    requestAnimationFrame(() => {
      const now = Date.now();
      if (!running) { lastUpdate = now; loop(); return; }
      if (lastUpdate === null) lastUpdate = now;
      const elapsed = now - lastUpdate;
      if (elapsed > currentDelay) { callback(); lastUpdate = now - (elapsed % currentDelay); }
      loop();
    });
  };

  const api = {
    start() { if (running) return; lastUpdate = Date.now(); running = true; },
    stop() { running = false; },
    reset(newDelay?: number) { if (newDelay !== undefined) currentDelay = newDelay; lastUpdate = Date.now(); running = true; },
    resetForward(newDelay: number) { callback(); currentDelay = newDelay; lastUpdate = Date.now(); running = true; },
  };
  loop();
  return api;
}

// ── Render helpers (accept dynamic cell size) ──
function drawGridCells(ctx: CanvasRenderingContext2D, g: number[][], cs: number) {
  for (let r = VISIBLE_TOP; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++) {
      if (g[r][c] === 0) continue;
      ctx.fillStyle = intToRGB(g[r][c]);
      ctx.fillRect(cs * c, cs * (r - VISIBLE_TOP), cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(cs * c, cs * (r - VISIBLE_TOP), cs, cs);
    }
}

function drawPiece(ctx: CanvasRenderingContext2D, p: PieceType, cs: number, vertOffset = 0) {
  for (let r = 0; r < p.dimension; r++)
    for (let c = 0; c < p.dimension; c++) {
      if (p.cells[r][c] === 0) continue;
      const x = cs * (c + p.column);
      const y = cs * (r + p.row - VISIBLE_TOP) + vertOffset;
      ctx.fillStyle = intToRGB(p.cells[r][c]);
      ctx.fillRect(x, y, cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(x, y, cs, cs);
    }
}

function drawPreview(ctx: CanvasRenderingContext2D, p: PieceType, cs: number, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, w, h);
  const xOff = p.dimension === 2 ? cs : p.dimension === 3 ? cs / 2 : 0;
  const yOff = p.dimension === 2 ? cs : p.dimension === 3 ? cs : cs / 2;
  for (let r = 0; r < p.dimension; r++)
    for (let c = 0; c < p.dimension; c++) {
      if (p.cells[r][c] === 0) continue;
      ctx.fillStyle = intToRGB(p.cells[r][c]);
      ctx.fillRect(xOff + cs * c, yOff + cs * r, cs, cs);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(xOff + cs * c, yOff + cs * r, cs, cs);
    }
}

// ── Game component ──
export function TetrisGame() {
  const navigate = useNavigate();
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem('tetris-hi') || '0', 10));
  const [state, setState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [cellSize, setCellSize] = useState(BASE_CELL);
  const csRef = useRef(cellSize);
  csRef.current = cellSize;

  // All game state lives in refs
  const gridRef = useRef(createGrid());
  const workingPiecesRef = useRef<(PieceType | null)[]>([null, null]);
  const workingPieceRef = useRef<PieceType | null>(null);
  const bagRef = useRef<number[]>(shuffledBag());
  const bagIdxRef = useRef(-1);
  const scoreRef = useRef(0);
  const keyEnabledRef = useRef(false);

  const gravTimerRef = useRef<ReturnType<typeof createTimer> | null>(null);
  const dropStopwatchRef = useRef<ReturnType<typeof createStopwatch> | null>(null);

  function bagNext(): number {
    bagIdxRef.current++;
    if (bagIdxRef.current >= bagRef.current.length) {
      bagRef.current = shuffledBag();
      bagIdxRef.current = 0;
    }
    return bagRef.current[bagIdxRef.current];
  }

  // ── Render ──
  function redrawGrid(vertOffset = 0) {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = csRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridCells(ctx, gridRef.current, cs);
    const wp = workingPieceRef.current;
    if (wp) drawPiece(ctx, wp, cs, vertOffset);
    ctx.strokeStyle = '#2a3a55';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  function redrawNext() {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = csRef.current;
    const next = workingPiecesRef.current[1];
    if (next) drawPreview(ctx, next, cs, canvas.width, canvas.height);
  }

  // ── Turn lifecycle ──
  function endTurn(): boolean {
    if (!workingPieceRef.current) return false;
    gridAddPiece(gridRef.current, workingPieceRef.current);
    scoreRef.current += gridClearLines(gridRef.current);
    setScore(scoreRef.current);
    redrawGrid();
    return !gridExceeded(gridRef.current);
  }

  function startTurn() {
    for (let i = 0; i < workingPiecesRef.current.length - 1; i++)
      workingPiecesRef.current[i] = workingPiecesRef.current[i + 1];
    workingPiecesRef.current[workingPiecesRef.current.length - 1] = pieceFromIndex(bagNext());
    workingPieceRef.current = workingPiecesRef.current[0];

    // Sync next canvas size to current cellSize
    const nc = nextCanvasRef.current;
    if (nc) { const sz = 4 * csRef.current; nc.width = sz; nc.height = sz; }

    redrawGrid();
    redrawNext();
    keyEnabledRef.current = true;
    if (gravTimerRef.current) gravTimerRef.current.resetForward(500);
  }

  function onGravityTick() {
    const wp = workingPieceRef.current;
    if (!wp) return;
    if (pieceCanMoveDown(gridRef.current, wp)) {
      pieceMoveDown(gridRef.current, wp);
      redrawGrid();
      return;
    }
    gravTimerRef.current?.stop();
    if (!endTurn()) {
      keyEnabledRef.current = false;
      setState('over');
      const finalScore = scoreRef.current;
      if (finalScore > parseInt(localStorage.getItem('tetris-hi') || '0', 10)) {
        localStorage.setItem('tetris-hi', finalScore.toString());
        setHi(finalScore);
      }
      return;
    }
    startTurn();
  }

  // ── Drop animation ──
  function startDropAnimation(cb: () => void) {
    if (!workingPieceRef.current) { cb(); return; }
    const copy = pieceClone(workingPieceRef.current);
    let animH = 0;
    while (pieceMoveDown(gridRef.current, copy)) animH++;

    const cs = csRef.current;
    dropStopwatchRef.current = createStopwatch((elapsed) => {
      if (elapsed >= animH * 20) {
        dropStopwatchRef.current?.stop();
        redrawGrid(cs * animH);
        cb();
        return;
      }
      redrawGrid(cs * elapsed / 20);
    });
  }

  function cancelDropAnimation() {
    dropStopwatchRef.current?.stop();
    dropStopwatchRef.current = null;
  }

  // ── Input ──
  function onUp() { const wp = workingPieceRef.current; if (!wp) return; pieceRotate(gridRef.current, wp); redrawGrid(); }
  function onDown() { gravTimerRef.current?.resetForward(500); }
  function onLeft() {
    const wp = workingPieceRef.current; if (!wp) return;
    if (pieceCanMoveLeft(gridRef.current, wp)) { pieceMoveLeft(gridRef.current, wp); redrawGrid(); }
  }
  function onRight() {
    const wp = workingPieceRef.current; if (!wp) return;
    if (pieceCanMoveRight(gridRef.current, wp)) { pieceMoveRight(gridRef.current, wp); redrawGrid(); }
  }
  function onSpace() {
    keyEnabledRef.current = false;
    gravTimerRef.current?.stop();
    startDropAnimation(() => {
      const wp = workingPieceRef.current; if (!wp) return;
      while (pieceMoveDown(gridRef.current, wp)) { /* drop */ }
      if (!endTurn()) {
        setState('over');
        const finalScore = scoreRef.current;
        if (finalScore > parseInt(localStorage.getItem('tetris-hi') || '0', 10)) {
          localStorage.setItem('tetris-hi', finalScore.toString());
          setHi(finalScore);
        }
        return;
      }
      startTurn();
    });
  }

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state === 'idle' || state === 'over') {
        if (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow')) {
          e.preventDefault();
          resetGame();
          return;
        }
      }
      if (!keyEnabledRef.current || state !== 'playing') return;
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
  });

  // ── Reset ──
  function resetGame() {
    cancelDropAnimation();
    gravTimerRef.current?.stop();
    gridRef.current = createGrid();
    bagRef.current = shuffledBag();
    bagIdxRef.current = -1;
    workingPiecesRef.current = [null, pieceFromIndex(bagNext())];
    workingPieceRef.current = null;
    scoreRef.current = 0;
    setScore(0);
    gravTimerRef.current = createTimer(onGravityTick, 500);
    gravTimerRef.current.start();
    setState('playing');
    startTurn();
  }

  // Initial idle render
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a3a55';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [cellSize]);

  const zoomIn = () => setCellSize(s => Math.min(MAX_CELL, s + 4));
  const zoomOut = () => setCellSize(s => Math.max(MIN_CELL, s - 4));
  const zoomReset = () => setCellSize(BASE_CELL);

  const cs = cellSize;
  const gridW = GRID_COLS * cs;
  const gridH = (GRID_ROWS - VISIBLE_TOP) * cs;
  const nextSz = 4 * cs;

  return (
    <div className="tetris-page">
      <div className="tetris-top-bar">
        <button className="tetris-back-btn" onClick={() => navigate('/')}>◂ BACK</button>
        <h1 className="tetris-title">TETRIS</h1>
        <div className="tetris-scores">
          <span className="tetris-score-val">LINES: {score}</span>
          <span className="tetris-best-val">BEST: {hi}</span>
        </div>
      </div>

      <div className="tetris-zoom-bar">
        <button className="tetris-zoom-btn" onClick={zoomOut} disabled={cellSize <= MIN_CELL} title="缩小">−</button>
        <span className="tetris-zoom-label">{Math.round((cellSize / BASE_CELL) * 100)}%</span>
        <button className="tetris-zoom-btn" onClick={zoomIn} disabled={cellSize >= MAX_CELL} title="放大">+</button>
        <button className="tetris-zoom-reset" onClick={zoomReset} title="重置缩放">⟲</button>
      </div>

      <div className="tetris-play-area">
        <div className="tetris-canvas-wrap" style={{ width: gridW }}>
          <canvas
            ref={gridCanvasRef}
            width={gridW}
            height={gridH}
            className="tetris-canvas"
            style={{ width: gridW, height: gridH }}
          />

          {state === 'idle' && (
            <div className="tetris-overlay">
              <div className="tetris-overlay-body">
                <span className="tetris-overlay-icon">🧱</span>
                <p>Press any key to start</p>
                <p className="tetris-hint">← → Move &nbsp; ↑ Rotate &nbsp; ↓ Soft &nbsp; Space Drop</p>
              </div>
            </div>
          )}

          {state === 'over' && (
            <div className="tetris-overlay">
              <div className="tetris-overlay-body">
                <span className="tetris-overlay-icon">💀</span>
                <h2 className="tetris-gameover-title">GAME OVER</h2>
                <p className="tetris-final-score">Lines: {score}</p>
                {score >= hi && score > 0 && <p className="tetris-new-record">★ NEW RECORD! ★</p>}
                <button className="tetris-restart-btn" onClick={resetGame}>▶ PLAY AGAIN</button>
                <p className="tetris-hint">Or press any key</p>
              </div>
            </div>
          )}
        </div>

        <div className="tetris-sidebar">
          <div className="tetris-panel">
            <span className="tetris-panel-label">NEXT</span>
            <canvas ref={nextCanvasRef} width={nextSz} height={nextSz} className="tetris-next-canvas" style={{ width: nextSz, height: nextSz }} />
          </div>
          <div className="tetris-panel">
            <span className="tetris-panel-label">LINES</span>
            <span className="tetris-panel-value">{score}</span>
          </div>
          <div className="tetris-panel">
            <span className="tetris-panel-label">BEST</span>
            <span className="tetris-panel-value">{hi}</span>
          </div>
        </div>
      </div>

      <div className="tetris-controls-hint">
        <span>← → Move</span>
        <span>↑ Rotate</span>
        <span>↓ Soft</span>
        <span>Space Drop</span>
      </div>
    </div>
  );
}