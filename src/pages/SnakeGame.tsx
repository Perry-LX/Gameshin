import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SnakeGame.css';

const GRID_SIZE = 20;
const BASE_CELL_SIZE = 32;
const MIN_CELL_SIZE = 16;
const MAX_CELL_SIZE = 64;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;
const MIN_SPEED = 60;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const getInitialSnake = (): Position[] => [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function randomFood(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  shade: string,
  highlight: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = highlight;
  ctx.fillRect(x, y, size, 2);
  ctx.fillRect(x, y, 2, size);
  ctx.fillStyle = shade;
  ctx.fillRect(x, y + size - 2, size, 2);
  ctx.fillRect(x + size - 2, y, 2, size);
}

function drawEyes(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dir: Direction) {
  ctx.fillStyle = '#fff';
  const eyeR = Math.max(2, size * 0.18);
  const pupilR = Math.max(1, size * 0.09);
  let ex1: number, ey1: number, ex2: number, ey2: number;

  const offset = size * 0.22;
  const margin = size * 0.32;
  switch (dir) {
    case 'UP':
      ex1 = x + offset; ey1 = y + margin;
      ex2 = x + size - offset; ey2 = y + margin;
      break;
    case 'DOWN':
      ex1 = x + offset; ey1 = y + size - margin;
      ex2 = x + size - offset; ey2 = y + size - margin;
      break;
    case 'LEFT':
      ex1 = x + margin; ey1 = y + offset;
      ex2 = x + margin; ey2 = y + size - offset;
      break;
    case 'RIGHT':
      ex1 = x + size - margin; ey1 = y + offset;
      ex2 = x + size - margin; ey2 = y + size - offset;
      break;
  }

  ctx.beginPath();
  ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2);
  ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(ex1, ey1, pupilR, 0, Math.PI * 2);
  ctx.arc(ex2, ey2, pupilR, 0, Math.PI * 2);
  ctx.fill();
}

interface GameData {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  speed: number;
  running: boolean;
  score: number;
}

function createGameData(): GameData {
  const snake = getInitialSnake();
  return { snake, food: randomFood(snake), direction: 'RIGHT', nextDirection: 'RIGHT', speed: INITIAL_SPEED, running: false, score: 0 };
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGameData());
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake-high-score') || '0', 10));
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [cellSize, setCellSize] = useState(BASE_CELL_SIZE);
  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = gameRef.current;
    const cs = cellSizeRef.current;
    const total = GRID_SIZE * cs;

    // Resize canvas buffer if needed
    if (canvas.width !== total || canvas.height !== total) {
      canvas.width = total;
      canvas.height = total;
    }

    // Background
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, total, total);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cs, 0);
      ctx.lineTo(i * cs, total);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cs);
      ctx.lineTo(total, i * cs);
      ctx.stroke();
    }

    // Food glow
    const fx = g.food.x * cs;
    const fy = g.food.y * cs;
    ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
    ctx.fillRect(fx - 4, fy - 4, cs + 8, cs + 8);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(fx + 2, fy + 2, cs - 4, cs - 4);
    ctx.fillStyle = '#ff7777';
    ctx.fillRect(fx + 4, fy + 4, cs - 10, cs - 10);

    // Snake
    for (let i = g.snake.length - 1; i >= 0; i--) {
      const seg = g.snake[i];
      const sx = seg.x * cs;
      const sy = seg.y * cs;
      const progress = 1 - i / g.snake.length;

      if (i === 0) {
        drawPixelRect(ctx, sx, sy, cs, '#4ade80', '#166534', '#86efac');
        drawEyes(ctx, sx, sy, cs, g.direction);
      } else {
        const shade = `rgb(${Math.floor(40 + progress * 30)},${Math.floor(180 - progress * 40)},${Math.floor(80 + progress * 30)})`;
        const hl = `rgb(${Math.floor(100 + progress * 30)},${Math.floor(220 - progress * 20)},${Math.floor(140 + progress * 20)})`;
        drawPixelRect(ctx, sx, sy, cs, shade, '#0f3a1e', hl);
      }
    }

    // Border
    ctx.strokeStyle = '#2a3a55';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, total, total);
  }, []);

  const endGame = useCallback(() => {
    const g = gameRef.current;
    g.running = false;
    setGameState('over');
    setScore(g.score);
    if (g.score > parseInt(localStorage.getItem('snake-high-score') || '0', 10)) {
      localStorage.setItem('snake-high-score', g.score.toString());
      setHighScore(g.score);
    }
    draw();
  }, [draw]);

  const gameLoop = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;

    g.direction = g.nextDirection;
    const head = { ...g.snake[0] };
    switch (g.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    if (g.snake.some((s) => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    g.snake.unshift(head);
    if (head.x === g.food.x && head.y === g.food.y) {
      g.score += 10;
      setScore(g.score);
      g.food = randomFood(g.snake);
      g.speed = Math.max(MIN_SPEED, g.speed - SPEED_INCREMENT);
    } else {
      g.snake.pop();
    }

    draw();
    setTimeout(() => gameLoop(), g.speed);
  }, [draw, endGame]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    const snake = getInitialSnake();
    g.snake = snake;
    g.food = randomFood(snake);
    g.direction = 'RIGHT';
    g.nextDirection = 'RIGHT';
    g.speed = INITIAL_SPEED;
    g.running = true;
    g.score = 0;
    setScore(0);
    setGameState('playing');
    setTimeout(() => gameLoop(), g.speed);
  }, [gameLoop]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const g = gameRef.current;
      const map: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();

      if (g.running) {
        const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        if (opp[g.direction] !== dir) g.nextDirection = dir;
      } else {
        startGame();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [startGame]);

  useEffect(() => { draw(); }, [draw]);

  const zoomIn = () => setCellSize((s) => Math.min(MAX_CELL_SIZE, s + 4));
  const zoomOut = () => setCellSize((s) => Math.max(MIN_CELL_SIZE, s - 4));
  const zoomReset = () => setCellSize(BASE_CELL_SIZE);

  return (
    <div className="snake-page">
      {/* Top bar */}
      <div className="snake-top-bar">
        <button className="snake-back-btn" onClick={() => navigate('/')}>◂ BACK</button>
        <h1 className="snake-title">SNAKE CLASSIC</h1>
        <div className="snake-scores">
          <span className="snake-score">SCORE: {score}</span>
          <span className="snake-highscore">BEST: {highScore}</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="snake-zoom-bar">
        <button className="snake-zoom-btn" onClick={zoomOut} disabled={cellSize <= MIN_CELL_SIZE} title="缩小">−</button>
        <span className="snake-zoom-label">{Math.round((cellSize / BASE_CELL_SIZE) * 100)}%</span>
        <button className="snake-zoom-btn" onClick={zoomIn} disabled={cellSize >= MAX_CELL_SIZE} title="放大">+</button>
        <button className="snake-zoom-reset" onClick={zoomReset} title="重置缩放">⟲</button>
      </div>

      {/* Canvas */}
      <div className="snake-canvas-wrap">
        <canvas ref={canvasRef} className="snake-canvas" />

        {gameState === 'idle' && (
          <div className="snake-overlay">
            <div className="snake-overlay-body">
              <span className="snake-overlay-icon">🐍</span>
              <p>Press any arrow key to start</p>
              <p className="snake-hint">WASD / Arrow Keys to move</p>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="snake-overlay">
            <div className="snake-overlay-body">
              <span className="snake-overlay-icon">💀</span>
              <h2 className="snake-gameover-title">GAME OVER</h2>
              <p className="snake-final-score">Score: {score}</p>
              {score >= highScore && score > 0 && <p className="snake-new-record">★ NEW RECORD! ★</p>}
              <button className="snake-restart-btn" onClick={startGame}>▶ PLAY AGAIN</button>
              <p className="snake-hint">Or press any arrow key</p>
            </div>
          </div>
        )}
      </div>

      <div className="snake-controls-hint">
        <span>←↑↓→</span>
        <span>WASD</span>
      </div>
    </div>
  );
}