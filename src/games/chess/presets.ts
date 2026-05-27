import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    name: '八卦阵法',
    map: [
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'S0', undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, 'S1', undefined, 'J0', undefined, undefined, undefined],
      [undefined, undefined, 'C0', undefined, undefined, undefined, 'c0', undefined, undefined],
      [undefined, 'M0', undefined, undefined, undefined, undefined, undefined, 'm0', undefined],
      ['P0', undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'p0'],
      [undefined, 'M1', undefined, undefined, undefined, undefined, undefined, 'm1', undefined],
      [undefined, undefined, 'C1', undefined, undefined, undefined, 'c1', undefined, undefined],
      [undefined, undefined, undefined, 'Z0', undefined, 'Z1', undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'j0', undefined, undefined, undefined, undefined],
    ],
  },
  {
    name: '很二棋局',
    map: [
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, 'J0', 'm0', 'm1', undefined, undefined, undefined],
      [undefined, undefined, 'z1', undefined, undefined, undefined, 'p1', undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, undefined, 'c1', undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, 'P1', undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'p0', undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, 'Z0', undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, 'M0', undefined, undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, 'c0', 'j0', 'M1', 'C0', 'P0', undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    ],
  },
  {
    name: '七星会阵',
    map: [
      [undefined, 'P0', undefined, undefined, 'J0', undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'S0', undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'X0', 'S1', undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined, undefined, 'p0', undefined, undefined],
      [undefined, undefined, undefined, undefined, 'z0', undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, 'Z0', undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, 'C0', undefined, undefined, undefined, undefined],
      [undefined, 'c1', undefined, 'j0', undefined, 'c0', undefined, undefined, undefined],
    ],
  },
];
