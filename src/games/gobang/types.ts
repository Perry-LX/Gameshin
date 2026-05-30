export type Role = 1 | -1;
export type Cell = Role | 0;
export type BoardMatrix = Cell[][];
export type GobangStatus = 'idle' | 'gaming';

export interface MoveRecord {
  i: number;
  j: number;
  role: Role;
}

export interface GobangState {
  board: BoardMatrix;
  currentPlayer: Role;
  winner: Cell;
  history: MoveRecord[];
  status: GobangStatus;
  whiteFirst: boolean;
  index: boolean;
}
