import { BLACK, WHITE, createEmptyBoard } from './constants';
import type { BoardMatrix, Cell, GobangState, MoveRecord, Role } from './types';

export function createInitialState(): GobangState {
  return {
    board: createEmptyBoard(),
    currentPlayer: BLACK,
    winner: 0,
    history: [],
    status: 'idle',
    whiteFirst: false,
    index: false,
  };
}

export function getStartingPlayer(whiteFirst: boolean): Role {
  return whiteFirst ? WHITE : BLACK;
}

export function resetState(state: GobangState): GobangState {
  return {
    ...state,
    board: createEmptyBoard(),
    currentPlayer: getStartingPlayer(state.whiteFirst),
    winner: 0,
    history: [],
    status: 'gaming',
  };
}

export function placePiece(state: GobangState, i: number, j: number): GobangState {
  if (state.status !== 'gaming') return state;
  if (state.board[i]?.[j] !== 0) return state;

  const board = state.board.map((row) => [...row]) as BoardMatrix;
  const role = state.currentPlayer;
  board[i][j] = role;

  const history = [...state.history, { i, j, role }];
  const winner = getWinner(board);
  const finished = winner !== 0 || isBoardFull(board);

  return {
    ...state,
    board,
    history,
    winner,
    currentPlayer: finished ? role : role === BLACK ? WHITE : BLACK,
    status: finished ? 'idle' : 'gaming',
  };
}

export function undoMove(state: GobangState): GobangState {
  if (state.history.length === 0) return state;

  const history = state.history.slice(0, -1);
  const board = createEmptyBoard(state.board.length);
  let currentPlayer = getStartingPlayer(state.whiteFirst);

  for (const move of history) {
    board[move.i][move.j] = move.role;
    currentPlayer = move.role === BLACK ? WHITE : BLACK;
  }

  return {
    ...state,
    board,
    history,
    currentPlayer,
    winner: 0,
    status: history.length === 0 ? 'idle' : 'gaming',
  };
}

export function resign(state: GobangState): GobangState {
  if (state.status !== 'gaming') return state;
  return {
    ...state,
    winner: state.currentPlayer === BLACK ? WHITE : BLACK,
    status: 'idle',
  };
}

export function getWinner(board: BoardMatrix): Cell {
  const directions: Array<[number, number]> = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (let i = 0; i < board.length; i += 1) {
    for (let j = 0; j < board[i].length; j += 1) {
      const cell = board[i][j];
      if (cell === 0) continue;

      for (const [dx, dy] of directions) {
        let count = 0;
        while (
          i + dx * count >= 0 &&
          i + dx * count < board.length &&
          j + dy * count >= 0 &&
          j + dy * count < board[i].length &&
          board[i + dx * count][j + dy * count] === cell
        ) {
          count += 1;
        }
        if (count >= 5) {
          return cell;
        }
      }
    }
  }

  return 0;
}

export function isBoardFull(board: BoardMatrix): boolean {
  return board.every((row) => row.every((cell) => cell !== 0));
}

export function getStatusText(state: GobangState): string {
  if (state.winner === BLACK) return '黑棋获胜';
  if (state.winner === WHITE) return '白棋获胜';
  if (state.status === 'idle' && state.history.length > 0 && isBoardFull(state.board)) return '平局';
  if (state.status === 'gaming') return state.currentPlayer === BLACK ? '轮到黑棋' : '轮到白棋';
  return '点击开始';
}

export function getWinnerLabel(winner: Cell): string {
  if (winner === BLACK) return '黑棋';
  if (winner === WHITE) return '白棋';
  return '未分胜负';
}

export function getLastMove(history: MoveRecord[]): MoveRecord | undefined {
  return history[history.length - 1];
}
