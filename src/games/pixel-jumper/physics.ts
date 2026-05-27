import { JUMP_VELOCITY, GRAVITY, MOVE_SPEED, STOMP_MIN_VELOCITY } from './constants';
import type { MonsterRuntime, Player, Rect } from './types';

export function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function isRectVisible(rect: Rect, startX: number, endX: number) {
  return rect.x + rect.width >= startX && rect.x <= endX;
}

export function resolveHorizontalCollisions(rect: Rect, vx: number, solids: Rect[]) {
  let nextX = rect.x;
  for (const solid of solids) {
    const probe = { ...rect, x: nextX };
    if (!intersects(probe, solid)) continue;
    if (vx > 0) nextX = solid.x - rect.width;
    else if (vx < 0) nextX = solid.x + solid.width;
  }
  return nextX;
}

export function resolveVerticalCollisions(rect: Rect, vy: number, solids: Rect[]) {
  let nextY = rect.y;
  let onGround = false;
  for (const solid of solids) {
    const probe = { ...rect, y: nextY };
    if (!intersects(probe, solid)) continue;
    if (vy > 0) {
      nextY = solid.y - rect.height;
      onGround = true;
    } else if (vy < 0) {
      nextY = solid.y + solid.height;
    }
    vy = 0;
  }
  return { y: nextY, vy, onGround };
}

export function isStompCollision(player: Player, previousBottom: number, monster: MonsterRuntime) {
  const playerBottom = player.y + player.height;
  const monsterTop = monster.y;
  const descending = player.vy >= STOMP_MIN_VELOCITY;
  const crossedTop = previousBottom <= monsterTop + 10;
  const feetInside = playerBottom >= monsterTop && player.y < monsterTop;
  return descending && crossedTop && feetInside;
}

export function canJumpBetween(from: Rect, to: Rect) {
  const fromTop = from.y;
  const toTop = to.y;
  const jumpHeight = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
  if (fromTop - toTop > jumpHeight + 8) return false;

  const airtime = Math.max(0.35, (-2 * JUMP_VELOCITY) / GRAVITY);
  const maxDistance = MOVE_SPEED * airtime;

  const fromCenterX = from.x + from.width / 2;
  const toCenterX = to.x + to.width / 2;
  return Math.abs(toCenterX - fromCenterX) <= maxDistance + 44;
}
