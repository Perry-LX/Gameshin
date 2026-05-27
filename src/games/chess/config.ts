import type { BoardMap, PieceDef, PieceKey, PieceLetter, SkinConfig } from './types';

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export const SKINS: Record<'stype1' | 'stype2' | 'stype3', SkinConfig> = {
  stype1: {
    width: 325,
    height: 402,
    spaceX: 35,
    spaceY: 36,
    pointStartX: 5,
    pointStartY: 19,
    page: 'stype_1',
  },
  stype2: {
    width: 523,
    height: 580,
    spaceX: 57,
    spaceY: 57,
    pointStartX: 3,
    pointStartY: 5,
    page: 'stype_2',
  },
  stype3: {
    width: 530,
    height: 567,
    spaceX: 57,
    spaceY: 57,
    pointStartX: -2,
    pointStartY: 0,
    page: 'stype_3',
  },
};

export const DEFAULT_SKIN = 'stype2' as const;

export const INITIAL_BOARD: BoardMap = [
  ['C0', 'M0', 'X0', 'S0', 'J0', 'S1', 'X1', 'M1', 'C1'],
  [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  [undefined, 'P0', undefined, undefined, undefined, undefined, undefined, 'P1', undefined],
  ['Z0', undefined, 'Z1', undefined, 'Z2', undefined, 'Z3', undefined, 'Z4'],
  [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  ['z0', undefined, 'z1', undefined, 'z2', undefined, 'z3', undefined, 'z4'],
  [undefined, 'p0', undefined, undefined, undefined, undefined, undefined, 'p1', undefined],
  [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  ['c0', 'm0', 'x0', 's0', 'j0', 's1', 'x1', 'm1', 'c1'],
];

export const ALL_PIECE_KEYS: PieceKey[] = [
  'c0', 'c1', 'm0', 'm1', 'x0', 'x1', 's0', 's1', 'j0', 'p0', 'p1', 'z0', 'z1', 'z2', 'z3', 'z4',
  'C0', 'C1', 'M0', 'M1', 'X0', 'X1', 'S0', 'S1', 'J0', 'P0', 'P1', 'Z0', 'Z1', 'Z2', 'Z3', 'Z4',
];

export const cloneBoard = (board: BoardMap): BoardMap => board.map((row) => row.slice());

const reverseValues = (values: number[][]) => values.map((row) => row.slice()).reverse();

const rookValues = [
  [206, 208, 207, 213, 214, 213, 207, 208, 206],
  [206, 212, 209, 216, 233, 216, 209, 212, 206],
  [206, 208, 207, 214, 216, 214, 207, 208, 206],
  [206, 213, 213, 216, 216, 216, 213, 213, 206],
  [208, 211, 211, 214, 215, 214, 211, 211, 208],
  [208, 212, 212, 214, 215, 214, 212, 212, 208],
  [204, 209, 204, 212, 214, 212, 204, 209, 204],
  [198, 208, 204, 212, 212, 212, 204, 208, 198],
  [200, 208, 206, 212, 200, 212, 206, 208, 200],
  [194, 206, 204, 212, 200, 212, 204, 206, 194],
];

const knightValues = [
  [90, 90, 90, 96, 90, 96, 90, 90, 90],
  [90, 96, 103, 97, 94, 97, 103, 96, 90],
  [92, 98, 99, 103, 99, 103, 99, 98, 92],
  [93, 108, 100, 107, 100, 107, 100, 108, 93],
  [90, 100, 99, 103, 104, 103, 99, 100, 90],
  [90, 98, 101, 102, 103, 102, 101, 98, 90],
  [92, 94, 98, 95, 98, 95, 98, 94, 92],
  [93, 92, 94, 95, 92, 95, 94, 92, 93],
  [85, 90, 92, 93, 78, 93, 92, 90, 85],
  [88, 85, 90, 88, 90, 88, 90, 85, 88],
];

const elephantValues = [
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 23, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [18, 0, 0, 0, 23, 0, 0, 0, 18],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 20, 0, 0, 0, 20, 0, 0],
];

const advisorValues = [
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 23, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
  [0, 0, 0, 0, 23, 0, 0, 0, 0],
  [0, 0, 0, 20, 0, 20, 0, 0, 0],
];

const generalValues = [
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
  [0, 0, 0, 8888, 8888, 8888, 0, 0, 0],
];

const cannonValues = [
  [100, 100, 96, 91, 90, 91, 96, 100, 100],
  [98, 98, 96, 92, 89, 92, 96, 98, 98],
  [97, 97, 96, 91, 92, 91, 96, 97, 97],
  [96, 99, 99, 98, 100, 98, 99, 99, 96],
  [96, 96, 96, 96, 100, 96, 96, 96, 96],
  [95, 96, 99, 96, 100, 96, 99, 96, 95],
  [96, 96, 96, 96, 96, 96, 96, 96, 96],
  [97, 96, 100, 99, 101, 99, 100, 96, 97],
  [96, 97, 98, 98, 98, 98, 98, 97, 96],
  [96, 96, 97, 99, 99, 99, 97, 96, 96],
];

const pawnValues = [
  [9, 9, 9, 11, 13, 11, 9, 9, 9],
  [19, 24, 34, 42, 44, 42, 34, 24, 19],
  [19, 24, 32, 37, 37, 37, 32, 24, 19],
  [19, 23, 27, 29, 30, 29, 27, 23, 19],
  [14, 18, 20, 27, 29, 27, 20, 18, 14],
  [7, 0, 13, 0, 16, 0, 13, 0, 7],
  [7, 0, 7, 0, 15, 0, 7, 0, 7],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const values = {
  c: rookValues,
  m: knightValues,
  x: elephantValues,
  s: advisorValues,
  j: generalValues,
  p: cannonValues,
  z: pawnValues,
  C: reverseValues(rookValues),
  M: reverseValues(knightValues),
  X: elephantValues,
  S: advisorValues,
  J: generalValues,
  P: reverseValues(cannonValues),
  Z: reverseValues(pawnValues),
} satisfies Record<PieceLetter, number[][]>;

export const PIECE_DEFS: Record<PieceLetter, PieceDef> = {
  c: { text: '车', img: 'r_c', my: 1, bl: 'c', value: values.c },
  m: { text: '马', img: 'r_m', my: 1, bl: 'm', value: values.m },
  x: { text: '相', img: 'r_x', my: 1, bl: 'x', value: values.x },
  s: { text: '仕', img: 'r_s', my: 1, bl: 's', value: values.s },
  j: { text: '将', img: 'r_j', my: 1, bl: 'j', value: values.j },
  p: { text: '炮', img: 'r_p', my: 1, bl: 'p', value: values.p },
  z: { text: '兵', img: 'r_z', my: 1, bl: 'z', value: values.z },
  C: { text: '车', img: 'b_c', my: -1, bl: 'c', value: values.C },
  M: { text: '马', img: 'b_m', my: -1, bl: 'm', value: values.M },
  X: { text: '象', img: 'b_x', my: -1, bl: 'x', value: values.X },
  S: { text: '士', img: 'b_s', my: -1, bl: 's', value: values.S },
  J: { text: '帅', img: 'b_j', my: -1, bl: 'j', value: values.J },
  P: { text: '炮', img: 'b_p', my: -1, bl: 'p', value: values.P },
  Z: { text: '卒', img: 'b_z', my: -1, bl: 'z', value: values.Z },
};

export const getPieceLetter = (key: PieceKey): PieceLetter => key[0] as PieceLetter;
