import { BASE_WORLD_HEIGHT, BULLET_DEFAULT_SPEED, MONSTER_DEFAULT_SPEED, MONSTER_HEIGHT, MONSTER_WIDTH, SHOOT_INTERVAL_MS } from './constants';
import type { CollectibleConfig, LevelData, MonsterConfig, Rect, TaskConfig } from './types';

const GROUND_Y = 488;
const GROUND_H = 52;
const PLATFORM_H = 18;
const CHUNK_BASE_WIDTH = 960;

type LevelSpec = {
  id: string;
  name: string;
  accent: string;
  sky: string;
  chunks: number;
  collectCount: number;
  killCount: number;
  dualTask?: boolean;
};

function ground(x: number, width: number): Rect {
  return { x, y: GROUND_Y, width, height: GROUND_H };
}

function platform(x: number, y: number, width: number): Rect {
  return { x, y, width, height: PLATFORM_H };
}

function hazard(x: number, width: number): Rect {
  return { x, y: 500, width, height: 40 };
}

function platformTop(rect: Rect) {
  return rect.y;
}

function createChunkSolids(baseX: number, variant: number) {
  const solids = [
    ground(baseX, 260),
    ground(baseX + 340, 220),
    ground(baseX + 640, 300),
    platform(baseX + 150, 420 - variant * 10, 118),
    platform(baseX + 370, 354 - ((variant + 1) % 3) * 16, 118),
    platform(baseX + 600, 300 - variant * 14, 138),
    platform(baseX + 780, 382 - ((variant + 2) % 3) * 12, 110),
  ];
  return solids;
}

function createChunkHazards(baseX: number, variant: number) {
  return [
    hazard(baseX + 262, 76 + variant * 8),
    hazard(baseX + 562, 76 + ((variant + 1) % 3) * 10),
  ];
}

function createChunkPlatforms(baseX: number, variant: number) {
  return {
    patrol: platform(baseX + 150, 420 - variant * 10, 118),
    shooter: platform(baseX + 600, 300 - variant * 14, 138),
    bonus: platform(baseX + 370, 354 - ((variant + 1) % 3) * 16, 118),
    edge: platform(baseX + 780, 382 - ((variant + 2) % 3) * 12, 110),
  };
}

function createMonsters(spec: LevelSpec, worldWidth: number): MonsterConfig[] {
  const middleChunk = Math.max(0, Math.floor(spec.chunks / 2));
  const lastChunk = spec.chunks - 1;
  const firstPlatforms = createChunkPlatforms(0, 0);
  const middlePlatforms = createChunkPlatforms(middleChunk * CHUNK_BASE_WIDTH, middleChunk % 3);
  const lastPlatforms = createChunkPlatforms(lastChunk * CHUNK_BASE_WIDTH, lastChunk % 3);

  const monsters: MonsterConfig[] = [
    {
      id: `${spec.id}-patrol-a`,
      type: 'patrol',
      x: firstPlatforms.patrol.x + 14,
      y: platformTop(firstPlatforms.patrol) - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: firstPlatforms.patrol.x + 4,
        maxX: firstPlatforms.patrol.x + firstPlatforms.patrol.width - MONSTER_WIDTH - 4,
      },
      speed: MONSTER_DEFAULT_SPEED,
      facing: 'right',
    },
    {
      id: `${spec.id}-shooter-a`,
      type: 'shooter',
      x: middlePlatforms.shooter.x + 24,
      y: platformTop(middlePlatforms.shooter) - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: middlePlatforms.shooter.x + 10,
        maxX: middlePlatforms.shooter.x + middlePlatforms.shooter.width - MONSTER_WIDTH - 10,
      },
      speed: MONSTER_DEFAULT_SPEED - 8,
      facing: 'left',
      shootDirection: middleChunk % 2 === 0 ? 'left' : 'right',
      shootIntervalMs: SHOOT_INTERVAL_MS - middleChunk * 80,
      bulletSpeed: BULLET_DEFAULT_SPEED + middleChunk * 8,
    },
    {
      id: `${spec.id}-chaser-a`,
      type: 'chaser',
      x: Math.min(worldWidth - 260, lastChunk * CHUNK_BASE_WIDTH + 690),
      y: GROUND_Y - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: Math.min(worldWidth - 340, lastChunk * CHUNK_BASE_WIDTH + 650),
        maxX: Math.min(worldWidth - MONSTER_WIDTH - 20, lastChunk * CHUNK_BASE_WIDTH + 900),
      },
      speed: MONSTER_DEFAULT_SPEED + 6,
      facing: 'left',
      aggroRangeX: 260 + spec.chunks * 20,
    },
  ];

  if (spec.chunks >= 3) {
    const extraPlatforms = createChunkPlatforms(CHUNK_BASE_WIDTH, 1);
    monsters.push({
      id: `${spec.id}-patrol-b`,
      type: 'patrol',
      x: extraPlatforms.edge.x + 12,
      y: platformTop(extraPlatforms.edge) - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: extraPlatforms.edge.x + 4,
        maxX: extraPlatforms.edge.x + extraPlatforms.edge.width - MONSTER_WIDTH - 4,
      },
      speed: MONSTER_DEFAULT_SPEED + 4,
      facing: 'left',
    });
  }

  if (spec.killCount >= 2) {
    monsters.push({
      id: `${spec.id}-shooter-b`,
      type: 'shooter',
      x: lastPlatforms.bonus.x + 20,
      y: platformTop(lastPlatforms.bonus) - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: lastPlatforms.bonus.x + 6,
        maxX: lastPlatforms.bonus.x + lastPlatforms.bonus.width - MONSTER_WIDTH - 6,
      },
      speed: MONSTER_DEFAULT_SPEED - 10,
      facing: 'right',
      shootDirection: 'left',
      shootIntervalMs: SHOOT_INTERVAL_MS - 240,
      bulletSpeed: BULLET_DEFAULT_SPEED + 18,
    });
  }

  return monsters;
}

function createCollectibles(spec: LevelSpec): CollectibleConfig[] {
  const items: CollectibleConfig[] = [];
  for (let i = 0; i < spec.collectCount; i++) {
    const chunkIndex = Math.min(spec.chunks - 1, i % spec.chunks);
    const variant = (i + spec.chunks) % 3;
    const platforms = createChunkPlatforms(chunkIndex * CHUNK_BASE_WIDTH, variant);
    const anchor = i % 2 === 0 ? platforms.shooter : platforms.bonus;
    items.push({
      id: `${spec.id}-core-${i + 1}`,
      x: anchor.x + 32 + (i % 3) * 18,
      y: anchor.y - 28,
      width: 16,
      height: 16,
      label: 'DATA CORE',
    });
  }
  return items;
}

function createTasks(spec: LevelSpec, collectibles: CollectibleConfig[]): TaskConfig[] {
  const tasks: TaskConfig[] = [];
  if (spec.collectCount > 0) {
    tasks.push({
      id: `${spec.id}-task-collect`,
      type: 'collect',
      label: `COLLECT ${spec.collectCount} DATA CORES`,
      requiredCount: spec.collectCount,
      targetIds: collectibles.map((item) => item.id),
    });
  }
  if (spec.killCount > 0) {
    tasks.push({
      id: `${spec.id}-task-kill`,
      type: 'kill',
      label: `STOMP ${spec.killCount} MONSTERS`,
      requiredCount: spec.killCount,
    });
  }
  if (!spec.dualTask && tasks.length > 1) {
    return [tasks[0]];
  }
  return tasks;
}

function createLevel(spec: LevelSpec, levelIndex: number): LevelData {
  const worldWidth = spec.chunks * CHUNK_BASE_WIDTH;
  const solids: Rect[] = [];
  const hazards: Rect[] = [];
  for (let chunkIndex = 0; chunkIndex < spec.chunks; chunkIndex++) {
    const baseX = chunkIndex * CHUNK_BASE_WIDTH;
    const variant = (levelIndex + chunkIndex) % 3;
    solids.push(...createChunkSolids(baseX, variant));
    hazards.push(...createChunkHazards(baseX, variant));
  }

  const collectibles = createCollectibles(spec);
  const tasks = createTasks(spec, collectibles);
  const monsters = createMonsters(spec, worldWidth);

  return {
    id: spec.id,
    name: spec.name,
    accent: spec.accent,
    sky: spec.sky,
    worldWidth,
    worldHeight: BASE_WORLD_HEIGHT,
    spawn: { x: 42, y: 452 },
    goal: { x: worldWidth - 96, y: 416, width: 24, height: 72 },
    solids,
    hazards,
    monsters,
    collectibles,
    tasks,
  };
}

const LEVEL_SPECS: LevelSpec[] = [
  { id: 'stage-01', name: 'Neon Yard', accent: '#38bdf8', sky: '#081120', chunks: 3, collectCount: 0, killCount: 0 },
  { id: 'stage-02', name: 'Copper Run', accent: '#fb923c', sky: '#14121f', chunks: 3, collectCount: 0, killCount: 1 },
  { id: 'stage-03', name: 'Circuit Ramp', accent: '#22c55e', sky: '#09181a', chunks: 3, collectCount: 2, killCount: 0 },
  { id: 'stage-04', name: 'Signal Terrace', accent: '#e879f9', sky: '#160b22', chunks: 4, collectCount: 2, killCount: 1, dualTask: true },
  { id: 'stage-05', name: 'Bolt Causeway', accent: '#60a5fa', sky: '#0b1325', chunks: 4, collectCount: 0, killCount: 2 },
  { id: 'stage-06', name: 'Foundry Roof', accent: '#facc15', sky: '#1a1304', chunks: 4, collectCount: 3, killCount: 0 },
  { id: 'stage-07', name: 'Glass Relay', accent: '#4ade80', sky: '#081615', chunks: 4, collectCount: 2, killCount: 2, dualTask: true },
  { id: 'stage-08', name: 'Arc Tunnel', accent: '#f472b6', sky: '#1b0c16', chunks: 4, collectCount: 0, killCount: 3 },
  { id: 'stage-09', name: 'Rust Skyline', accent: '#f97316', sky: '#21100a', chunks: 4, collectCount: 3, killCount: 1, dualTask: true },
  { id: 'stage-10', name: 'Pulse Span', accent: '#06b6d4', sky: '#071923', chunks: 5, collectCount: 2, killCount: 2, dualTask: true },
  { id: 'stage-11', name: 'Echo Platforms', accent: '#818cf8', sky: '#100d25', chunks: 5, collectCount: 4, killCount: 0 },
  { id: 'stage-12', name: 'Forge Corridor', accent: '#f59e0b', sky: '#1b1407', chunks: 5, collectCount: 0, killCount: 3 },
  { id: 'stage-13', name: 'Titan Crossing', accent: '#2dd4bf', sky: '#081718', chunks: 5, collectCount: 3, killCount: 2, dualTask: true },
  { id: 'stage-14', name: 'Antenna Vault', accent: '#a78bfa', sky: '#120d1e', chunks: 5, collectCount: 4, killCount: 1, dualTask: true },
  { id: 'stage-15', name: 'Magnet Docks', accent: '#34d399', sky: '#081716', chunks: 5, collectCount: 0, killCount: 4 },
  { id: 'stage-16', name: 'Nova Causeway', accent: '#f43f5e', sky: '#210b14', chunks: 5, collectCount: 3, killCount: 3, dualTask: true },
  { id: 'stage-17', name: 'Iron Halo', accent: '#eab308', sky: '#191205', chunks: 5, collectCount: 5, killCount: 2, dualTask: true },
  { id: 'stage-18', name: 'Final Circuit', accent: '#10b981', sky: '#061818', chunks: 6, collectCount: 4, killCount: 4, dualTask: true },
];

function validateLevel(level: LevelData) {
  const monsterTypes = new Set(level.monsters.map((monster) => monster.type));
  if (!monsterTypes.has('patrol') || !monsterTypes.has('shooter') || !monsterTypes.has('chaser')) {
    throw new Error(`Pixel Jumper level ${level.id} must include patrol, shooter, and chaser monsters.`);
  }
  if (level.worldWidth <= CHUNK_BASE_WIDTH) {
    throw new Error(`Pixel Jumper level ${level.id} must be wider than one viewport chunk.`);
  }
  const collectibleIds = new Set(level.collectibles.map((item) => item.id));
  for (const task of level.tasks) {
    if (task.type === 'collect' && task.targetIds) {
      for (const id of task.targetIds) {
        if (!collectibleIds.has(id)) {
          throw new Error(`Pixel Jumper level ${level.id} references unknown collectible ${id}.`);
        }
      }
    }
  }
}

export const PIXEL_JUMPER_LEVELS: LevelData[] = LEVEL_SPECS.map(createLevel);

if (import.meta.env.DEV) {
  PIXEL_JUMPER_LEVELS.forEach(validateLevel);
}

export function getPixelJumperLevel(index: number) {
  return PIXEL_JUMPER_LEVELS[index];
}
