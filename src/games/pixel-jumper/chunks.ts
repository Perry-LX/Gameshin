import { BASE_WORLD_HEIGHT, SOLID_QUERY_MARGIN, VIEWPORT_CHUNK_MAX_WIDTH, VIEWPORT_CHUNK_MIN_WIDTH } from './constants';
import type { Camera, ChunkInfo, Rect } from './types';

export function getViewportWorldSize(canvasWidth: number, canvasHeight: number) {
  if (!canvasWidth || !canvasHeight) {
    return { width: 960, height: BASE_WORLD_HEIGHT };
  }
  const aspect = canvasWidth / canvasHeight;
  return {
    width: BASE_WORLD_HEIGHT * aspect,
    height: BASE_WORLD_HEIGHT,
  };
}

export function clampChunkWidth(width: number) {
  return Math.max(VIEWPORT_CHUNK_MIN_WIDTH, Math.min(VIEWPORT_CHUNK_MAX_WIDTH, width));
}

export function createCamera(viewportWidth: number, viewportHeight: number): Camera {
  const chunkWidth = clampChunkWidth(viewportWidth);
  return {
    x: 0,
    y: 0,
    width: viewportWidth,
    height: viewportHeight,
    activeChunkIndex: 0,
    chunkWidth,
  };
}

export function computeChunkInfo(worldWidth: number, chunkWidth: number, index: number): ChunkInfo {
  const startX = index * chunkWidth;
  const endX = Math.min(worldWidth, startX + chunkWidth);
  return { startX, endX, index };
}

export function getChunkCount(worldWidth: number, chunkWidth: number) {
  return Math.max(1, Math.ceil(worldWidth / chunkWidth));
}

export function getActiveChunkIndex(playerCenterX: number, worldWidth: number, chunkWidth: number) {
  const count = getChunkCount(worldWidth, chunkWidth);
  return Math.max(0, Math.min(count - 1, Math.floor(playerCenterX / chunkWidth)));
}

export function updateCamera(camera: Camera, playerCenterX: number, worldWidth: number) {
  camera.chunkWidth = clampChunkWidth(camera.width);
  camera.activeChunkIndex = getActiveChunkIndex(playerCenterX, worldWidth, camera.chunkWidth);
  const chunk = computeChunkInfo(worldWidth, camera.chunkWidth, camera.activeChunkIndex);
  const maxCameraX = Math.max(chunk.startX, chunk.endX - camera.width);
  camera.x = Math.max(chunk.startX, Math.min(maxCameraX, playerCenterX - camera.width / 2));
  camera.y = 0;
  return chunk;
}

export function getVisibleChunkBounds(camera: Camera, worldWidth: number) {
  const chunk = computeChunkInfo(worldWidth, camera.chunkWidth, camera.activeChunkIndex);
  return { startX: chunk.startX, endX: chunk.endX, chunk };
}

export function getCollisionQueryBounds(camera: Camera, worldWidth: number) {
  const { startX, endX } = getVisibleChunkBounds(camera, worldWidth);
  return {
    startX: Math.max(0, startX - SOLID_QUERY_MARGIN),
    endX: Math.min(worldWidth, endX + SOLID_QUERY_MARGIN),
  };
}

export function filterRectsInBounds<T extends Rect>(items: T[], startX: number, endX: number) {
  return items.filter((item) => item.x + item.width >= startX && item.x <= endX);
}
