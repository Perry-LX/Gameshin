import { getVisibleChunkBounds } from './chunks';
import { isRectVisible } from './physics';
import type { CollectibleRuntime, MonsterRuntime, Rect, RunData } from './types';

function drawPixelPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string, shade: string, highlight: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = highlight;
  ctx.fillRect(x, y, width, 3);
  ctx.fillRect(x, y, 3, height);
  ctx.fillStyle = shade;
  ctx.fillRect(x, y + height - 3, width, 3);
  ctx.fillRect(x + width - 3, y, 3, height);
}

function drawBackground(ctx: CanvasRenderingContext2D, run: RunData, level: { sky: string; accent: string; worldWidth: number; }) {
  const camera = run.camera;
  const visible = getVisibleChunkBounds(camera, level.worldWidth);
  ctx.fillStyle = level.sky;
  ctx.fillRect(0, 0, camera.width, camera.height);

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < camera.width; x += 32) ctx.fillRect(x, 0, 1, camera.height);
  for (let y = 0; y < camera.height; y += 32) ctx.fillRect(0, y, camera.width, 1);

  ctx.fillStyle = `${level.accent}22`;
  ctx.fillRect(0, camera.height - 220, camera.width, 220);

  for (let i = 0; i < 6; i++) {
    const width = 80 + i * 16;
    const height = 120 + (i % 3) * 60;
    const worldX = visible.startX + 40 + i * 160;
    const screenX = worldX - camera.x;
    const y = camera.height - height;
    drawPixelPanel(ctx, screenX, y, width, height, 'rgba(12,18,28,0.6)', 'rgba(5,7,12,0.55)', 'rgba(255,255,255,0.05)');
  }

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 14; i++) {
    const x = ((i * 97) % Math.max(1, visible.endX - visible.startX)) + 24;
    const y = 26 + (i * 37) % 180;
    ctx.fillRect(x, y, 3, 3);
  }
}

function drawSolids(ctx: CanvasRenderingContext2D, solids: Rect[], cameraX: number, startX: number, endX: number) {
  solids.forEach((solid, index) => {
    if (!isRectVisible(solid, startX, endX)) return;
    const fill = index % 4 < 2 ? '#7c3f00' : '#8b5a2b';
    const x = solid.x - cameraX;
    drawPixelPanel(ctx, x, solid.y, solid.width, solid.height, fill, '#4b2503', '#d69c45');
    ctx.fillStyle = '#c68a34';
    for (let plankX = x + 8; plankX < x + solid.width - 8; plankX += 24) {
      ctx.fillRect(plankX, solid.y + 6, 8, 4);
    }
  });
}

function drawHazards(ctx: CanvasRenderingContext2D, hazards: Rect[], cameraX: number, startX: number, endX: number) {
  hazards.forEach((hazard) => {
    if (!isRectVisible(hazard, startX, endX)) return;
    const x = hazard.x - cameraX;
    drawPixelPanel(ctx, x, hazard.y, hazard.width, hazard.height, '#ef4444', '#7f1d1d', '#fca5a5');
    ctx.fillStyle = '#fde047';
    for (let spikeX = x + 4; spikeX < x + hazard.width - 4; spikeX += 12) {
      ctx.beginPath();
      ctx.moveTo(spikeX, hazard.y + hazard.height);
      ctx.lineTo(spikeX + 6, hazard.y + 4);
      ctx.lineTo(spikeX + 12, hazard.y + hazard.height);
      ctx.fill();
    }
  });
}

function drawGoal(ctx: CanvasRenderingContext2D, goal: Rect, cameraX: number) {
  const x = goal.x - cameraX;
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(x + 8, goal.y, 4, goal.height);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 12, goal.y + 4, 24, 16);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(x + 12, goal.y + 8, 16, 4);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x + 2, goal.y + goal.height - 10, 18, 10);
}

function drawMonster(ctx: CanvasRenderingContext2D, monster: MonsterRuntime, cameraX: number) {
  if (!monster.alive) return;
  const palette = monster.type === 'shooter'
    ? ['#f97316', '#9a3412', '#fdba74']
    : monster.type === 'chaser'
      ? ['#a855f7', '#581c87', '#d8b4fe']
      : ['#22c55e', '#166534', '#86efac'];
  const x = monster.x - cameraX;
  drawPixelPanel(ctx, x, monster.y, monster.width, monster.height, palette[0], palette[1], palette[2]);
  ctx.fillStyle = '#ffffff';
  const eyeX = monster.facing === 'right' ? x + 18 : x + 6;
  ctx.fillRect(eyeX, monster.y + 8, 4, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(eyeX + 1, monster.y + 9, 2, 2);
}

function drawCollectible(ctx: CanvasRenderingContext2D, collectible: CollectibleRuntime, cameraX: number) {
  if (collectible.collected) return;
  const x = collectible.x - cameraX;
  drawPixelPanel(ctx, x, collectible.y, collectible.width, collectible.height, '#38bdf8', '#0c4a6e', '#bae6fd');
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(x + 5, collectible.y + 5, 6, 6);
}

export function renderGame(canvas: HTMLCanvasElement, run: RunData, level: { accent: string; sky: string; worldWidth: number; solids: Rect[]; hazards: Rect[]; goal: Rect; }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (canvas.width !== Math.floor(run.camera.width) || canvas.height !== Math.floor(run.camera.height)) {
    canvas.width = Math.floor(run.camera.width);
    canvas.height = Math.floor(run.camera.height);
  }

  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx, run, level);

  const { startX, endX } = getVisibleChunkBounds(run.camera, level.worldWidth);
  drawSolids(ctx, level.solids, run.camera.x, startX, endX);
  drawHazards(ctx, level.hazards, run.camera.x, startX, endX);

  run.collectibles.forEach((collectible) => {
    if (isRectVisible(collectible, startX, endX)) drawCollectible(ctx, collectible, run.camera.x);
  });
  run.monsters.forEach((monster) => {
    if (isRectVisible(monster, startX, endX)) drawMonster(ctx, monster, run.camera.x);
  });

  ctx.fillStyle = '#facc15';
  run.bullets.forEach((bullet) => {
    if (!isRectVisible(bullet, startX, endX)) return;
    drawPixelPanel(ctx, bullet.x - run.camera.x, bullet.y, bullet.width, bullet.height, '#facc15', '#a16207', '#fef08a');
  });

  if (isRectVisible(level.goal, startX, endX)) drawGoal(ctx, level.goal, run.camera.x);

  const player = run.player;
  drawPixelPanel(ctx, player.x - run.camera.x, player.y, player.width, player.height, '#38bdf8', '#075985', '#bae6fd');
  ctx.fillStyle = '#ffffff';
  const eyeX = (player.facing === 'right' ? player.x + 17 : player.x + 8) - run.camera.x;
  ctx.fillRect(eyeX, player.y + 10, 5, 5);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(eyeX + 2, player.y + 12, 2, 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(player.x - run.camera.x + 6, player.y + 30, 6, 3);
  ctx.fillRect(player.x - run.camera.x + 16, player.y + 30, 6, 3);

  ctx.strokeStyle = '#2f3b52';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}
