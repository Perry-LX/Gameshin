export type GameState = 'idle' | 'playing' | 'failed' | 'cleared' | 'completed';

export type Facing = 'left' | 'right';
export type MonsterType = 'patrol' | 'shooter' | 'chaser';
export type TaskType = 'collect' | 'kill';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
  activeChunkIndex: number;
  chunkWidth: number;
}

export interface ChunkInfo {
  startX: number;
  endX: number;
  index: number;
}

export interface PatrolRange {
  minX: number;
  maxX: number;
}

export interface MonsterConfig {
  id: string;
  type: MonsterType;
  x: number;
  y: number;
  width: number;
  height: number;
  patrolRange: PatrolRange;
  speed?: number;
  facing?: Facing;
  shootDirection?: Facing;
  shootIntervalMs?: number;
  bulletSpeed?: number;
  aggroRangeX?: number;
}

export interface MonsterRuntime extends Rect {
  id: string;
  type: MonsterType;
  patrolRange: PatrolRange;
  speed: number;
  facing: Facing;
  vx: number;
  alive: boolean;
  shootDirection?: Facing;
  shootIntervalMs?: number;
  bulletSpeed?: number;
  shootCooldownMs: number;
  aggroRangeX?: number;
}

export interface Bullet extends Rect {
  id: string;
  vx: number;
  ownerId: string;
}

export interface CollectibleConfig extends Rect {
  id: string;
  label?: string;
}

export interface CollectibleRuntime extends Rect {
  id: string;
  label?: string;
  collected: boolean;
}

export interface TaskConfig {
  id: string;
  type: TaskType;
  label: string;
  requiredCount: number;
  targetIds?: string[];
}

export interface TaskProgress extends TaskConfig {
  currentCount: number;
  completed: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  accent: string;
  sky: string;
  worldWidth: number;
  worldHeight: number;
  spawn: SpawnPoint;
  goal: Rect;
  solids: Rect[];
  hazards: Rect[];
  monsters: MonsterConfig[];
  collectibles: CollectibleConfig[];
  tasks: TaskConfig[];
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: Facing;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpQueued: boolean;
  jumpHeld: boolean;
}

export interface RunData {
  state: GameState;
  levelIndex: number;
  deaths: number;
  elapsedMs: number;
  player: Player;
  camera: Camera;
  monsters: MonsterRuntime[];
  bullets: Bullet[];
  collectibles: CollectibleRuntime[];
  tasks: TaskProgress[];
  statusMessage: string | null;
  bulletSerial: number;
}

export interface HudSnapshot {
  gameState: GameState;
  currentLevel: number;
  totalLevels: number;
  levelName: string;
  deaths: number;
  elapsedMs: number;
  bestTime: number;
  tasks: TaskProgress[];
  statusMessage: string | null;
  activeChunkIndex: number;
  totalChunks: number;
}
