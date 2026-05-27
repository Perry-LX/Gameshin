import { BULLET_DEFAULT_SPEED, BULLET_HEIGHT, BULLET_WIDTH, GRAVITY, JUMP_VELOCITY, MAX_FALL_SPEED, MOVE_SPEED, STOMP_BOUNCE_VELOCITY } from './constants';
import { intersects, isStompCollision, resolveHorizontalCollisions, resolveVerticalCollisions } from './physics';
import { markCollect, markMonsterKill } from './tasks';
import type { Bullet, InputState, MonsterRuntime, Player, Rect, RunData } from './types';

function createBullet(run: RunData, monster: MonsterRuntime): Bullet {
  run.bulletSerial += 1;
  const direction = monster.shootDirection ?? monster.facing;
  const vx = (monster.bulletSpeed ?? BULLET_DEFAULT_SPEED) * (direction === 'left' ? -1 : 1);
  return {
    id: `bullet-${run.bulletSerial}`,
    x: direction === 'left' ? monster.x - BULLET_WIDTH : monster.x + monster.width,
    y: monster.y + monster.height / 2 - BULLET_HEIGHT / 2,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    vx,
    ownerId: monster.id,
  };
}

export function updatePlayer(player: Player, input: InputState, solids: Rect[], worldWidth: number, dt: number) {
  if (input.left === input.right) {
    player.vx = 0;
  } else if (input.left) {
    player.vx = -MOVE_SPEED;
    player.facing = 'left';
  } else {
    player.vx = MOVE_SPEED;
    player.facing = 'right';
  }

  if (input.jumpQueued && player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }
  input.jumpQueued = false;

  player.x += player.vx * dt;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > worldWidth) player.x = worldWidth - player.width;
  player.x = resolveHorizontalCollisions(player, player.vx, solids);

  player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
  player.y += player.vy * dt;
  const vertical = resolveVerticalCollisions(player, player.vy, solids);
  player.y = vertical.y;
  player.vy = vertical.vy;
  player.onGround = vertical.onGround;
}

export function updateMonsters(run: RunData, player: Player, dt: number) {
  const spawnedBullets: Bullet[] = [];
  for (const monster of run.monsters) {
    if (!monster.alive) continue;
    let desiredFacing = monster.facing;
    const playerCenterX = player.x + player.width / 2;
    const monsterCenterX = monster.x + monster.width / 2;

    if (monster.type === 'chaser' && monster.aggroRangeX && Math.abs(playerCenterX - monsterCenterX) <= monster.aggroRangeX) {
      desiredFacing = playerCenterX < monsterCenterX ? 'left' : 'right';
    }

    const vx = desiredFacing === 'left' ? -monster.speed : monster.speed;
    let nextX = monster.x + vx * dt;
    if (nextX < monster.patrolRange.minX) {
      nextX = monster.patrolRange.minX;
      desiredFacing = 'right';
    }
    if (nextX > monster.patrolRange.maxX) {
      nextX = monster.patrolRange.maxX;
      desiredFacing = 'left';
    }

    monster.x = nextX;
    monster.vx = desiredFacing === 'left' ? -monster.speed : monster.speed;
    monster.facing = desiredFacing;

    if (monster.type === 'shooter' && monster.shootIntervalMs) {
      monster.shootCooldownMs -= dt * 1000;
      if (monster.shootCooldownMs <= 0) {
        spawnedBullets.push(createBullet(run, monster));
        monster.shootCooldownMs += monster.shootIntervalMs;
      }
    }
  }
  run.bullets.push(...spawnedBullets);
}

export function updateBullets(run: RunData, solids: Rect[], worldWidth: number, dt: number) {
  run.bullets = run.bullets.filter((bullet) => {
    bullet.x += bullet.vx * dt;
    if (bullet.x + bullet.width < 0 || bullet.x > worldWidth) return false;
    if (solids.some((solid) => intersects(bullet, solid))) return false;
    return true;
  });
}

export function collectCollectibles(run: RunData) {
  for (const collectible of run.collectibles) {
    if (collectible.collected) continue;
    if (!intersects(run.player, collectible)) continue;
    collectible.collected = true;
    markCollect(run.tasks, collectible.id);
  }
}

export function resolveMonsterCollisions(run: RunData, previousBottom: number) {
  for (const monster of run.monsters) {
    if (!monster.alive || !intersects(run.player, monster)) continue;
    if (isStompCollision(run.player, previousBottom, monster)) {
      monster.alive = false;
      run.player.vy = STOMP_BOUNCE_VELOCITY;
      run.player.onGround = false;
      markMonsterKill(run.tasks, monster.id);
      continue;
    }
    return true;
  }
  return false;
}

export function isPlayerHitByBullet(player: Player, bullets: Bullet[]) {
  return bullets.some((bullet) => intersects(player, bullet));
}
