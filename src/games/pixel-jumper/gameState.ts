import { BASE_WORLD_HEIGHT, PLAYER_HEIGHT, PLAYER_WIDTH } from './constants';
import { createCamera, getChunkCount, getViewportWorldSize, updateCamera } from './chunks';
import { PIXEL_JUMPER_LEVELS, getPixelJumperLevel } from './levels';
import { createTaskProgress } from './tasks';
import type { CollectibleConfig, CollectibleRuntime, HudSnapshot, MonsterConfig, MonsterRuntime, Player, RunData, SpawnPoint } from './types';

function createPlayer(spawn: SpawnPoint): Player {
  return {
    x: spawn.x,
    y: spawn.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 'right',
  };
}

function createMonsterRuntime(config: MonsterConfig): MonsterRuntime {
  return {
    id: config.id,
    type: config.type,
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    patrolRange: config.patrolRange,
    speed: config.speed ?? 72,
    facing: config.facing ?? 'left',
    vx: 0,
    alive: true,
    shootDirection: config.shootDirection,
    shootIntervalMs: config.shootIntervalMs,
    bulletSpeed: config.bulletSpeed,
    shootCooldownMs: config.shootIntervalMs ?? 0,
    aggroRangeX: config.aggroRangeX,
  };
}

function createCollectibleRuntime(config: CollectibleConfig): CollectibleRuntime {
  return {
    id: config.id,
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    label: config.label,
    collected: false,
  };
}

export function formatTime(ms: number) {
  const totalTenths = Math.floor(ms / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

export function createRunData(viewportPixelWidth: number, viewportPixelHeight: number): RunData {
  const { width, height } = getViewportWorldSize(viewportPixelWidth, viewportPixelHeight);
  const camera = createCamera(width, height);
  const level = getPixelJumperLevel(0);
  const player = createPlayer(level.spawn);
  updateCamera(camera, player.x + player.width / 2, level.worldWidth);
  return {
    state: 'idle',
    levelIndex: 0,
    deaths: 0,
    elapsedMs: 0,
    player,
    camera,
    monsters: level.monsters.map(createMonsterRuntime),
    bullets: [],
    collectibles: level.collectibles.map(createCollectibleRuntime),
    tasks: createTaskProgress(level.tasks),
    statusMessage: null,
    bulletSerial: 0,
  };
}

export function updateViewport(run: RunData, viewportPixelWidth: number, viewportPixelHeight: number) {
  const { width, height } = getViewportWorldSize(viewportPixelWidth, viewportPixelHeight);
  run.camera.width = width;
  run.camera.height = height || BASE_WORLD_HEIGHT;
  const level = getPixelJumperLevel(run.levelIndex);
  updateCamera(run.camera, run.player.x + run.player.width / 2, level.worldWidth);
}

export function loadLevel(run: RunData, levelIndex: number) {
  const level = getPixelJumperLevel(levelIndex);
  run.levelIndex = levelIndex;
  run.player = createPlayer(level.spawn);
  run.monsters = level.monsters.map(createMonsterRuntime);
  run.bullets = [];
  run.collectibles = level.collectibles.map(createCollectibleRuntime);
  run.tasks = createTaskProgress(level.tasks);
  run.statusMessage = null;
  updateCamera(run.camera, run.player.x + run.player.width / 2, level.worldWidth);
}

export function restartRun(run: RunData) {
  run.levelIndex = 0;
  run.deaths = 0;
  run.elapsedMs = 0;
  run.bulletSerial = 0;
  loadLevel(run, 0);
}

export function retryCurrentLevel(run: RunData) {
  loadLevel(run, run.levelIndex);
}

export function advanceLevel(run: RunData) {
  loadLevel(run, Math.min(run.levelIndex + 1, PIXEL_JUMPER_LEVELS.length - 1));
}

export function buildHudSnapshot(run: RunData, bestTime: number): HudSnapshot {
  const level = getPixelJumperLevel(run.levelIndex);
  return {
    gameState: run.state,
    currentLevel: run.levelIndex + 1,
    totalLevels: PIXEL_JUMPER_LEVELS.length,
    levelName: level.name,
    deaths: run.deaths,
    elapsedMs: run.elapsedMs,
    bestTime,
    tasks: run.tasks.map((task) => ({ ...task })),
    statusMessage: run.statusMessage,
    activeChunkIndex: run.camera.activeChunkIndex,
    totalChunks: getChunkCount(level.worldWidth, run.camera.chunkWidth),
  };
}

export { PIXEL_JUMPER_LEVELS, getPixelJumperLevel };
