import { BASE_WORLD_HEIGHT, BULLET_DEFAULT_SPEED, MONSTER_DEFAULT_SPEED, MONSTER_HEIGHT, MONSTER_WIDTH, SHOOT_INTERVAL_MS } from './constants';
import { canJumpBetween } from './physics';
import type { CollectibleConfig, LevelData, MonsterConfig, PatrolRange, Rect, TaskConfig } from './types';

const GROUND_Y = 488;
const GROUND_H = 52;
const PLATFORM_H = 18;
const CHUNK_BASE_WIDTH = 960;

type ChunkLayoutKey = 'yard' | 'stair' | 'vault' | 'relay';

type LevelSpec = {
  id: string;
  name: string;
  accent: string;
  sky: string;
  layouts: ChunkLayoutKey[];
  collectCount: number;
  killCount: number;
  dualTask?: boolean;
};

type ChunkBuild = {
  grounds: Rect[];
  hazards: Rect[];
  platforms: Rect[];
  patrolPlatformIndex: number;
  shooterPlatformIndex: number;
  bonusPatrolPlatformIndex: number;
  collectiblePlatformIndices: number[];
  chaserRange: PatrolRange;
};

function validateChunkRoute(levelId: string, chunk: ChunkBuild) {
  const route = [chunk.grounds[0], ...chunk.platforms, chunk.grounds[chunk.grounds.length - 1]];
  for (let i = 0; i < route.length - 1; i++) {
    if (!canJumpBetween(route[i], route[i + 1])) {
      throw new Error(`Pixel Jumper level ${levelId} has an unreachable route segment at step ${i + 1}.`);
    }
  }
}

function ground(x: number, width: number): Rect {
  return { x, y: GROUND_Y, width, height: GROUND_H };
}

function platform(x: number, y: number, width: number): Rect {
  return { x, y, width, height: PLATFORM_H };
}

function hazard(x: number, width: number): Rect {
  return { x, y: 500, width, height: 40 };
}

function buildChunk(baseX: number, layout: ChunkLayoutKey): ChunkBuild {
  switch (layout) {
    case 'yard': {
      const grounds = [ground(baseX, 250), ground(baseX + 330, 230), ground(baseX + 640, 320)];
      const platforms = [
        platform(baseX + 110, 432, 120),
        platform(baseX + 270, 386, 116),
        platform(baseX + 430, 340, 116),
        platform(baseX + 590, 294, 124),
        platform(baseX + 750, 340, 120),
        platform(baseX + 862, 392, 74),
      ];
      return {
        grounds,
        hazards: [hazard(baseX + 252, 68), hazard(baseX + 562, 78)],
        platforms,
        patrolPlatformIndex: 0,
        shooterPlatformIndex: 3,
        bonusPatrolPlatformIndex: 4,
        collectiblePlatformIndices: [2, 4],
        chaserRange: { minX: baseX + 700, maxX: baseX + 900 },
      };
    }
    case 'stair': {
      const grounds = [ground(baseX, 210), ground(baseX + 300, 220), ground(baseX + 620, 340)];
      const platforms = [
        platform(baseX + 95, 426, 110),
        platform(baseX + 245, 380, 110),
        platform(baseX + 395, 334, 110),
        platform(baseX + 555, 288, 110),
        platform(baseX + 710, 336, 120),
        platform(baseX + 850, 390, 82),
      ];
      return {
        grounds,
        hazards: [hazard(baseX + 212, 72), hazard(baseX + 522, 86)],
        platforms,
        patrolPlatformIndex: 1,
        shooterPlatformIndex: 3,
        bonusPatrolPlatformIndex: 4,
        collectiblePlatformIndices: [1, 3, 4],
        chaserRange: { minX: baseX + 700, maxX: baseX + 900 },
      };
    }
    case 'vault': {
      const grounds = [ground(baseX, 230), ground(baseX + 315, 145), ground(baseX + 540, 180), ground(baseX + 820, 140)];
      const platforms = [
        platform(baseX + 130, 438, 106),
        platform(baseX + 290, 392, 104),
        platform(baseX + 450, 346, 104),
        platform(baseX + 610, 300, 114),
        platform(baseX + 760, 346, 106),
        platform(baseX + 860, 300, 76),
      ];
      return {
        grounds,
        hazards: [hazard(baseX + 232, 70), hazard(baseX + 462, 72), hazard(baseX + 722, 86)],
        platforms,
        patrolPlatformIndex: 1,
        shooterPlatformIndex: 3,
        bonusPatrolPlatformIndex: 4,
        collectiblePlatformIndices: [2, 5],
        chaserRange: { minX: baseX + 835, maxX: baseX + 920 },
      };
    }
    case 'relay':
    default: {
      const grounds = [ground(baseX, 240), ground(baseX + 320, 180), ground(baseX + 620, 160), ground(baseX + 860, 100)];
      const platforms = [
        platform(baseX + 140, 432, 104),
        platform(baseX + 300, 386, 110),
        platform(baseX + 460, 340, 110),
        platform(baseX + 620, 294, 110),
        platform(baseX + 770, 340, 110),
        platform(baseX + 862, 394, 74),
      ];
      return {
        grounds,
        hazards: [hazard(baseX + 242, 60), hazard(baseX + 502, 74), hazard(baseX + 782, 72)],
        platforms,
        patrolPlatformIndex: 0,
        shooterPlatformIndex: 3,
        bonusPatrolPlatformIndex: 4,
        collectiblePlatformIndices: [1, 2, 4],
        chaserRange: { minX: baseX + 870, maxX: baseX + 920 },
      };
    }
  }
}

function createMonsters(spec: LevelSpec, chunks: ChunkBuild[]): MonsterConfig[] {
  const monsters: MonsterConfig[] = [];
  const middleChunkIndex = Math.floor(spec.layouts.length / 2);
  const lastChunkIndex = spec.layouts.length - 1;

  chunks.forEach((chunk, chunkIndex) => {
    const patrolPlatform = chunk.platforms[chunk.patrolPlatformIndex];
    monsters.push({
      id: `${spec.id}-patrol-${chunkIndex + 1}`,
      type: 'patrol',
      x: patrolPlatform.x + 12,
      y: patrolPlatform.y - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: {
        minX: patrolPlatform.x + 4,
        maxX: patrolPlatform.x + patrolPlatform.width - MONSTER_WIDTH - 4,
      },
      speed: MONSTER_DEFAULT_SPEED,
      facing: chunkIndex % 2 === 0 ? 'right' : 'left',
    });

    if (chunkIndex === middleChunkIndex || chunkIndex % 2 === 1) {
      const shooterPlatform = chunk.platforms[chunk.shooterPlatformIndex];
      monsters.push({
        id: `${spec.id}-shooter-${chunkIndex + 1}`,
        type: 'shooter',
        x: shooterPlatform.x + 18,
        y: shooterPlatform.y - MONSTER_HEIGHT,
        width: MONSTER_WIDTH,
        height: MONSTER_HEIGHT,
        patrolRange: {
          minX: shooterPlatform.x + 6,
          maxX: shooterPlatform.x + shooterPlatform.width - MONSTER_WIDTH - 6,
        },
        speed: MONSTER_DEFAULT_SPEED - 8,
        facing: 'left',
        shootDirection: chunkIndex % 2 === 0 ? 'left' : 'right',
        shootIntervalMs: Math.max(900, SHOOT_INTERVAL_MS - chunkIndex * 110),
        bulletSpeed: BULLET_DEFAULT_SPEED + chunkIndex * 8,
      });
    }

    if (chunkIndex > 0 && chunkIndex < lastChunkIndex) {
      const bonusPlatform = chunk.platforms[chunk.bonusPatrolPlatformIndex];
      monsters.push({
        id: `${spec.id}-patrol-bonus-${chunkIndex + 1}`,
        type: 'patrol',
        x: bonusPlatform.x + 10,
        y: bonusPlatform.y - MONSTER_HEIGHT,
        width: MONSTER_WIDTH,
        height: MONSTER_HEIGHT,
        patrolRange: {
          minX: bonusPlatform.x + 4,
          maxX: bonusPlatform.x + bonusPlatform.width - MONSTER_WIDTH - 4,
        },
        speed: MONSTER_DEFAULT_SPEED + 4,
        facing: 'left',
      });
    }
  });

  const chaserChunk = chunks[lastChunkIndex];
  monsters.push({
    id: `${spec.id}-chaser-final`,
    type: 'chaser',
    x: chaserChunk.chaserRange.minX + 10,
    y: GROUND_Y - MONSTER_HEIGHT,
    width: MONSTER_WIDTH,
    height: MONSTER_HEIGHT,
    patrolRange: chaserChunk.chaserRange,
    speed: MONSTER_DEFAULT_SPEED + 8,
    facing: 'left',
    aggroRangeX: 260 + spec.layouts.length * 30,
  });

  if (spec.layouts.length >= 5) {
    const secondaryChaserChunk = chunks[middleChunkIndex + 1];
    monsters.push({
      id: `${spec.id}-chaser-mid`,
      type: 'chaser',
      x: secondaryChaserChunk.chaserRange.minX + 10,
      y: GROUND_Y - MONSTER_HEIGHT,
      width: MONSTER_WIDTH,
      height: MONSTER_HEIGHT,
      patrolRange: secondaryChaserChunk.chaserRange,
      speed: MONSTER_DEFAULT_SPEED + 12,
      facing: 'right',
      aggroRangeX: 280 + spec.layouts.length * 34,
    });
  }

  return monsters;
}

function createCollectibles(spec: LevelSpec, chunks: ChunkBuild[]): CollectibleConfig[] {
  const anchors = chunks.flatMap((chunk, chunkIndex) =>
    chunk.collectiblePlatformIndices.map((platformIndex, anchorIndex) => ({
      chunkIndex,
      anchorIndex,
      platform: chunk.platforms[platformIndex],
    })),
  );

  const collectibles: CollectibleConfig[] = [];
  for (let i = 0; i < spec.collectCount; i++) {
    const anchor = anchors[i % anchors.length];
    collectibles.push({
      id: `${spec.id}-core-${i + 1}`,
      x: anchor.platform.x + 24 + (anchor.anchorIndex % 2) * 22,
      y: anchor.platform.y - 30,
      width: 16,
      height: 16,
      label: 'DATA CORE',
    });
  }
  return collectibles;
}

function createTasks(spec: LevelSpec, collectibles: CollectibleConfig[], totalMonsters: number): TaskConfig[] {
  const tasks: TaskConfig[] = [];

  if (spec.collectCount > 0) {
    tasks.push({
      id: `${spec.id}-task-collect`,
      type: 'collect',
      label: `COLLECT ${spec.collectCount} DATA CORES`,
      requiredCount: spec.collectCount,
      targetIds: collectibles.map((collectible) => collectible.id),
    });
  }

  if (spec.killCount > 0) {
    tasks.push({
      id: `${spec.id}-task-kill`,
      type: 'kill',
      label: `STOMP ${Math.min(spec.killCount, totalMonsters)} MONSTERS`,
      requiredCount: Math.min(spec.killCount, totalMonsters),
    });
  }

  if (!spec.dualTask && tasks.length > 1) {
    return [tasks[0]];
  }

  return tasks;
}

function createLevel(spec: LevelSpec): LevelData {
  const chunks = spec.layouts.map((layout, index) => buildChunk(index * CHUNK_BASE_WIDTH, layout));
  chunks.forEach((chunk) => validateChunkRoute(spec.id, chunk));
  const solids = chunks.flatMap((chunk) => [...chunk.grounds, ...chunk.platforms]);
  const hazards = chunks.flatMap((chunk) => chunk.hazards);
  const worldWidth = spec.layouts.length * CHUNK_BASE_WIDTH;
  const monsters = createMonsters(spec, chunks);
  const collectibles = createCollectibles(spec, chunks);
  const tasks = createTasks(spec, collectibles, monsters.length);

  return {
    id: spec.id,
    name: spec.name,
    accent: spec.accent,
    sky: spec.sky,
    worldWidth,
    worldHeight: BASE_WORLD_HEIGHT,
    spawn: { x: 44, y: 452 },
    goal: { x: worldWidth - 72, y: 416, width: 24, height: 72 },
    solids,
    hazards,
    monsters,
    collectibles,
    tasks,
  };
}

const LEVEL_SPECS: LevelSpec[] = [
  { id: 'stage-01', name: 'Neon Yard', accent: '#38bdf8', sky: '#081120', layouts: ['yard', 'yard', 'stair'], collectCount: 0, killCount: 0 },
  { id: 'stage-02', name: 'Copper Run', accent: '#fb923c', sky: '#14121f', layouts: ['yard', 'stair', 'relay'], collectCount: 0, killCount: 1 },
  { id: 'stage-03', name: 'Circuit Ramp', accent: '#22c55e', sky: '#09181a', layouts: ['stair', 'yard', 'vault'], collectCount: 2, killCount: 0 },
  { id: 'stage-04', name: 'Signal Terrace', accent: '#e879f9', sky: '#160b22', layouts: ['yard', 'relay', 'stair', 'vault'], collectCount: 2, killCount: 1, dualTask: true },
  { id: 'stage-05', name: 'Bolt Causeway', accent: '#60a5fa', sky: '#0b1325', layouts: ['stair', 'vault', 'relay', 'yard'], collectCount: 0, killCount: 2 },
  { id: 'stage-06', name: 'Foundry Roof', accent: '#facc15', sky: '#1a1304', layouts: ['relay', 'stair', 'vault', 'relay'], collectCount: 3, killCount: 0 },
  { id: 'stage-07', name: 'Glass Relay', accent: '#4ade80', sky: '#081615', layouts: ['yard', 'vault', 'relay', 'stair'], collectCount: 2, killCount: 2, dualTask: true },
  { id: 'stage-08', name: 'Arc Tunnel', accent: '#f472b6', sky: '#1b0c16', layouts: ['stair', 'relay', 'stair', 'vault'], collectCount: 0, killCount: 3 },
  { id: 'stage-09', name: 'Rust Skyline', accent: '#f97316', sky: '#21100a', layouts: ['vault', 'stair', 'relay', 'yard'], collectCount: 3, killCount: 1, dualTask: true },
  { id: 'stage-10', name: 'Pulse Span', accent: '#06b6d4', sky: '#071923', layouts: ['yard', 'relay', 'vault', 'stair', 'relay'], collectCount: 2, killCount: 2, dualTask: true },
  { id: 'stage-11', name: 'Echo Platforms', accent: '#818cf8', sky: '#100d25', layouts: ['stair', 'yard', 'relay', 'vault', 'stair'], collectCount: 4, killCount: 0 },
  { id: 'stage-12', name: 'Forge Corridor', accent: '#f59e0b', sky: '#1b1407', layouts: ['relay', 'vault', 'stair', 'relay', 'yard'], collectCount: 0, killCount: 3 },
  { id: 'stage-13', name: 'Titan Crossing', accent: '#2dd4bf', sky: '#081718', layouts: ['vault', 'relay', 'stair', 'vault', 'relay'], collectCount: 3, killCount: 2, dualTask: true },
  { id: 'stage-14', name: 'Antenna Vault', accent: '#a78bfa', sky: '#120d1e', layouts: ['yard', 'stair', 'vault', 'relay', 'vault'], collectCount: 4, killCount: 1, dualTask: true },
  { id: 'stage-15', name: 'Magnet Docks', accent: '#34d399', sky: '#081716', layouts: ['stair', 'relay', 'vault', 'stair', 'relay'], collectCount: 0, killCount: 4 },
  { id: 'stage-16', name: 'Nova Causeway', accent: '#f43f5e', sky: '#210b14', layouts: ['vault', 'stair', 'relay', 'vault', 'stair'], collectCount: 3, killCount: 3, dualTask: true },
  { id: 'stage-17', name: 'Iron Halo', accent: '#eab308', sky: '#191205', layouts: ['relay', 'vault', 'relay', 'stair', 'vault'], collectCount: 5, killCount: 2, dualTask: true },
  { id: 'stage-18', name: 'Final Circuit', accent: '#10b981', sky: '#061818', layouts: ['yard', 'stair', 'relay', 'vault', 'stair', 'relay'], collectCount: 4, killCount: 4, dualTask: true },
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
    if (task.type === 'kill' && task.requiredCount > level.monsters.length) {
      throw new Error(`Pixel Jumper level ${level.id} requires more kills than available monsters.`);
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
