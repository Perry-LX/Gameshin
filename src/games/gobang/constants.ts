import type { BoardMatrix, Role } from './types';

export const BOARD_SIZE = 15;
export const BOARD_PIXELS = 375;
export const BLACK: Role = 1;
export const WHITE: Role = -1;

export function createEmptyBoard(size = BOARD_SIZE): BoardMatrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}
