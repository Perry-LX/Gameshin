import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollisionQueryBounds, getVisibleChunkBounds } from '../games/pixel-jumper/chunks';
import { useLanguage } from '../i18n';
import {
  collectCollectibles,
  isPlayerHitByBullet,
  resolveMonsterCollisions,
  updateBullets,
  updateMonsters,
  updatePlayer,
} from '../games/pixel-jumper/entities';
import {
  advanceLevel,
  buildHudSnapshot,
  createRunData,
  formatTime,
  getPixelJumperLevel,
  PIXEL_JUMPER_LEVELS,
  restartRun,
  retryCurrentLevel,
  updateViewport,
} from '../games/pixel-jumper/gameState';
import { renderGame } from '../games/pixel-jumper/renderer';
import { areTasksComplete } from '../games/pixel-jumper/tasks';
import type { GameState, HudSnapshot, InputState } from '../games/pixel-jumper/types';
import './PixelJumperGame.css';

const defaultHudSnapshot: HudSnapshot = {
  gameState: 'idle',
  currentLevel: 1,
  totalLevels: PIXEL_JUMPER_LEVELS.length,
  levelName: PIXEL_JUMPER_LEVELS[0].name,
  deaths: 0,
  elapsedMs: 0,
  bestTime: 0,
  tasks: [],
  statusMessage: null,
  activeChunkIndex: 0,
  totalChunks: 1,
};

export function PixelJumperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const runRef = useRef(createRunData(1100, 620));
  const inputRef = useRef<InputState>({ left: false, right: false, jumpQueued: false, jumpHeld: false });
  const [bestTime, setBestTime] = useState(() => parseInt(localStorage.getItem('pixel-jumper-best-time') || '0', 10));
  const [hud, setHud] = useState<HudSnapshot>(() => ({ ...defaultHudSnapshot, bestTime }));

  const syncHud = useCallback(() => {
    setHud(buildHudSnapshot(runRef.current, bestTime));
  }, [bestTime]);

  const updateCanvasViewport = useCallback(() => {
    const host = frameWrapRef.current;
    if (!host) return;
    updateViewport(runRef.current, host.clientWidth || 1100, host.clientHeight || 620);
    syncHud();
  }, [syncHud]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const level = getPixelJumperLevel(runRef.current.levelIndex);
    renderGame(canvas, runRef.current, level);
  }, []);

  const failLevel = useCallback(() => {
    const run = runRef.current;
    if (run.state !== 'playing') return;
    run.state = 'failed';
    run.deaths += 1;
    run.statusMessage = 'YOU WERE TAKEN OUT. RETRY THE STAGE.';
    syncHud();
    draw();
  }, [draw, syncHud]);

  const completeRun = useCallback(() => {
    const run = runRef.current;
    run.state = 'completed';
    run.statusMessage = 'ALL 18 STAGES CLEARED.';
    const finalTime = Math.floor(run.elapsedMs);
    if (bestTime === 0 || finalTime < bestTime) {
      localStorage.setItem('pixel-jumper-best-time', finalTime.toString());
      setBestTime(finalTime);
    }
    syncHud();
    draw();
  }, [bestTime, draw, syncHud]);

  const clearLevel = useCallback(() => {
    const run = runRef.current;
    if (!areTasksComplete(run.tasks)) {
      run.statusMessage = 'GOAL LOCKED: FINISH ALL TASKS FIRST.';
      syncHud();
      return;
    }
    run.statusMessage = null;
    if (run.levelIndex === PIXEL_JUMPER_LEVELS.length - 1) {
      completeRun();
      return;
    }
    run.state = 'cleared';
    syncHud();
    draw();
  }, [completeRun, draw, syncHud]);

  const startRun = useCallback(() => {
    const run = runRef.current;
    restartRun(run);
    run.state = 'playing';
    run.statusMessage = null;
    lastFrameRef.current = null;
    updateCanvasViewport();
    syncHud();
    draw();
  }, [draw, syncHud, updateCanvasViewport]);

  const retryLevel = useCallback(() => {
    const run = runRef.current;
    retryCurrentLevel(run);
    run.state = 'playing';
    run.statusMessage = null;
    lastFrameRef.current = null;
    updateCanvasViewport();
    syncHud();
    draw();
  }, [draw, syncHud, updateCanvasViewport]);

  const goToNextLevel = useCallback(() => {
    const run = runRef.current;
    advanceLevel(run);
    run.state = 'playing';
    run.statusMessage = null;
    lastFrameRef.current = null;
    updateCanvasViewport();
    syncHud();
    draw();
  }, [draw, syncHud, updateCanvasViewport]);

  const updateGame = useCallback((dt: number) => {
    const run = runRef.current;
    const level = getPixelJumperLevel(run.levelIndex);
    const previousBottom = run.player.y + run.player.height;

    run.elapsedMs += dt * 1000;

    const playerCenterX = run.player.x + run.player.width / 2;
    const collisionBounds = getCollisionQueryBounds(run.camera, level.worldWidth);
    const visibleBounds = getVisibleChunkBounds(run.camera, level.worldWidth);

    const solids = level.solids.filter((solid) => solid.x + solid.width >= collisionBounds.startX && solid.x <= collisionBounds.endX);
    const hazards = level.hazards.filter((hazard) => hazard.x + hazard.width >= collisionBounds.startX && hazard.x <= collisionBounds.endX);

    updatePlayer(run.player, inputRef.current, solids, level.worldWidth, dt);
    updateViewport(run, frameWrapRef.current?.clientWidth || 1100, frameWrapRef.current?.clientHeight || 620);

    updateMonsters(run, run.player, dt);
    updateBullets(run, solids, level.worldWidth, dt);
    collectCollectibles(run);

    if (run.player.y > level.worldHeight + 80 || hazards.some((hazard) => hazard.x + hazard.width >= collisionBounds.startX && hazard.x <= collisionBounds.endX && run.player.x < hazard.x + hazard.width && run.player.x + run.player.width > hazard.x && run.player.y < hazard.y + hazard.height && run.player.y + run.player.height > hazard.y)) {
      failLevel();
      return;
    }

    if (resolveMonsterCollisions(run, previousBottom) || isPlayerHitByBullet(run.player, run.bullets)) {
      failLevel();
      return;
    }

    if (
      run.player.x < level.goal.x + level.goal.width &&
      run.player.x + run.player.width > level.goal.x &&
      run.player.y < level.goal.y + level.goal.height &&
      run.player.y + run.player.height > level.goal.y
    ) {
      clearLevel();
      return;
    }

    const activeRegion = visibleBounds.chunk.index + 1;
    run.statusMessage = areTasksComplete(run.tasks)
      ? `REGION ${activeRegion}/${hud.totalChunks || 1} CLEAR. EXIT IS OPEN.`
      : `REGION ${activeRegion}/${Math.max(1, Math.ceil(level.worldWidth / run.camera.chunkWidth))} ACTIVE.`;

    const nextCenterX = playerCenterX + run.player.vx * dt;
    if (Math.abs(nextCenterX - playerCenterX) > 0) {
      updateViewport(run, frameWrapRef.current?.clientWidth || 1100, frameWrapRef.current?.clientHeight || 620);
    }

    syncHud();
  }, [clearLevel, failLevel, hud.totalChunks, syncHud]);

  useEffect(() => {
    updateCanvasViewport();
    draw();
  }, [draw, updateCanvasViewport]);

  useEffect(() => {
    const handleResize = () => {
      updateCanvasViewport();
      draw();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw, updateCanvasViewport]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const run = runRef.current;
      const input = inputRef.current;
      const key = event.key;
      const isLeft = key === 'ArrowLeft' || key === 'a' || key === 'A';
      const isRight = key === 'ArrowRight' || key === 'd' || key === 'D';
      const isJump = key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ';
      const isAction = key === 'Enter' || key === ' ';

      if (isLeft || isRight || isJump || isAction) event.preventDefault();

      if (run.state !== 'playing') {
        if (run.state === 'idle' && (isLeft || isRight || isJump || isAction)) startRun();
        else if (run.state === 'failed' && (isJump || isAction)) retryLevel();
        else if (run.state === 'cleared' && (isJump || isAction)) goToNextLevel();
        else if (run.state === 'completed' && (isJump || isAction)) startRun();
      }

      if (isLeft) input.left = true;
      if (isRight) input.right = true;
      if (isJump && !input.jumpHeld) {
        input.jumpQueued = true;
        input.jumpHeld = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const input = inputRef.current;
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') input.left = false;
      if (key === 'ArrowRight' || key === 'd' || key === 'D') input.right = false;
      if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') input.jumpHeld = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [goToNextLevel, retryLevel, startRun]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const run = runRef.current;
      if (lastFrameRef.current === null) lastFrameRef.current = timestamp;
      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.033);
      lastFrameRef.current = timestamp;

      if (run.state === 'playing') updateGame(dt);
      draw();
      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [draw, updateGame]);

  useEffect(() => {
    syncHud();
  }, [bestTime, syncHud]);

  const overlayState = hud.gameState as GameState;
  const overlay = useMemo(() => {
    if (overlayState === 'idle') {
      return {
        icon: '🏁',
        title: t('pixelJumper.readyTitle'),
        className: '',
        description: t('pixelJumper.readyDesc'),
        hint: t('pixelJumper.readyHint'),
        action: { label: t('pixelJumper.startRun'), onClick: startRun },
      };
    }
    if (overlayState === 'failed') {
      return {
        icon: '💥',
        title: t('pixelJumper.failedTitle'),
        className: 'failed',
        description: t('pixelJumper.failedDesc'),
        hint: t('pixelJumper.failedHint'),
        action: { label: t('pixelJumper.retry'), onClick: retryLevel },
      };
    }
    if (overlayState === 'cleared') {
      return {
        icon: '✨',
        title: t('pixelJumper.clearedTitle'),
        className: 'clear',
        description: `Stage ${hud.currentLevel} complete. Move into the next region.`,
        hint: t('pixelJumper.clearedHint'),
        action: { label: t('pixelJumper.nextStage'), onClick: goToNextLevel },
      };
    }
    if (overlayState === 'completed') {
      return {
        icon: '👑',
        title: t('pixelJumper.completedTitle'),
        className: 'complete',
        description: `You cleared all ${hud.totalLevels} stages in ${formatTime(hud.elapsedMs)}.`,
        hint: '',
        action: { label: t('pixelJumper.playAgain'), onClick: startRun },
      };
    }
    return null;
  }, [goToNextLevel, hud.currentLevel, hud.elapsedMs, hud.totalLevels, overlayState, retryLevel, startRun, t]);

  return (
    <div className="pixel-jumper-page">
      <div className="pixel-jumper-top-bar">
        <button className="pixel-jumper-back-btn" onClick={() => navigate('/')}>{t('pixelJumper.back')}</button>
        <div className="pixel-jumper-title-wrap">
          <h1 className="pixel-jumper-title">{t('pixelJumper.title')}</h1>
          <span className="pixel-jumper-stage-name">{hud.levelName}</span>
        </div>
        <div className="pixel-jumper-stats">
          <span className="pixel-jumper-stat">{t('pixelJumper.level')}: {hud.currentLevel}/{hud.totalLevels}</span>
          <span className="pixel-jumper-stat">{t('pixelJumper.region')}: {hud.activeChunkIndex + 1}/{hud.totalChunks}</span>
          <span className="pixel-jumper-stat">{t('pixelJumper.deaths')}: {hud.deaths}</span>
          <span className="pixel-jumper-stat">{t('pixelJumper.time')}: {formatTime(hud.elapsedMs)}</span>
          <span className="pixel-jumper-best">{t('pixelJumper.best')}: {hud.bestTime ? formatTime(hud.bestTime) : '--:--.-'}</span>
        </div>
      </div>

      <div className="pixel-jumper-mission-panel">
        <div className="pixel-jumper-mission-title">{t('pixelJumper.tasks')}</div>
        {hud.tasks.length === 0 ? (
          <div className="pixel-jumper-mission-empty">{t('pixelJumper.exit')}</div>
        ) : (
          <ul className="pixel-jumper-task-list">
            {hud.tasks.map((task) => (
              <li key={task.id} className={`pixel-jumper-task-item ${task.completed ? 'completed' : ''}`}>
                <span>{task.label}</span>
                <span>{task.currentCount}/{task.requiredCount}</span>
              </li>
            ))}
          </ul>
        )}
        {hud.statusMessage && <div className="pixel-jumper-status">{hud.statusMessage}</div>}
      </div>

      <div className="pixel-jumper-frame" ref={frameWrapRef}>
        <canvas ref={canvasRef} className="pixel-jumper-canvas" />

        {overlay && (
          <div className="pixel-jumper-overlay">
            <div className="pixel-jumper-overlay-body">
              <span className="pixel-jumper-overlay-icon">{overlay.icon}</span>
              <h2 className={`pixel-jumper-overlay-title ${overlay.className}`.trim()}>{overlay.title}</h2>
              <p>{overlay.description}</p>
              {overlayState === 'completed' && hud.bestTime > 0 && hud.bestTime === Math.floor(hud.elapsedMs) && (
                <p className="pixel-jumper-record">★ NEW RECORD! ★</p>
              )}
              <button className="pixel-jumper-action-btn" onClick={overlay.action.onClick}>{overlay.action.label}</button>
              {overlay.hint && <p className="pixel-jumper-hint">{overlay.hint}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="pixel-jumper-controls-hint">
        <span>MOVE: A / D</span>
        <span>JUMP: W / ↑ / SPACE</span>
        <span>ATTACK: STOMP FROM ABOVE</span>
        <span>EXIT: TASKS + FLAG</span>
      </div>
    </div>
  );
}
