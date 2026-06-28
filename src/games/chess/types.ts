export type Side = 1 | -1;

export type PieceLetter = 'c' | 'm' | 'x' | 's' | 'j' | 'p' | 'z' | 'C' | 'M' | 'X' | 'S' | 'J' | 'P' | 'Z';
export type PieceKey =
  | 'c0' | 'c1' | 'm0' | 'm1' | 'x0' | 'x1' | 's0' | 's1' | 'j0' | 'p0' | 'p1' | 'z0' | 'z1' | 'z2' | 'z3' | 'z4'
  | 'C0' | 'C1' | 'M0' | 'M1' | 'X0' | 'X1' | 'S0' | 'S1' | 'J0' | 'P0' | 'P1' | 'Z0' | 'Z1' | 'Z2' | 'Z3' | 'Z4';

export type BoardCell = PieceKey | undefined;
export type BoardMap = BoardCell[][];
export type MovePoint = [number, number];
export type Move = [number, number, number, number, PieceKey?];

export interface PieceDef {
  text: string;
  img: string;
  my: Side;
  bl: Lowercase<PieceLetter>;
  value: number[][];
}

export interface PieceState {
  key: PieceKey;
  pater: PieceLetter;
  x: number;
  y: number;
  my: Side;
  text: string;
  value: number[][];
  isShow: boolean;
  alpha: number;
  ps: MovePoint[];
}

export interface SkinConfig {
  width: number;
  height: number;
  spaceX: number;
  spaceY: number;
  pointStartX: number;
  pointStartY: number;
  page: 'stype_1' | 'stype_2' | 'stype_3';
}

export type SkinType = 'stype1' | 'stype2' | 'stype3';
export type Difficulty = 2 | 3 | 4;

export interface Preset {
  name: string;
  map: BoardMap;
}

export interface Assets {
  board: HTMLImageElement;
  dot: HTMLImageElement;
  pane: HTMLImageElement;
  pieces: Record<PieceLetter, HTMLImageElement>;
}

export interface RuntimeRefs {
  canvas: HTMLCanvasElement;
  clickAudio?: HTMLAudioElement | null;
  selectAudio?: HTMLAudioElement | null;
}

export interface ChessStatus {
  scoreText: string;
  winner: Side | 0 | null;
  thinking: boolean;
  mode: 'menu' | 'duel' | 'preset' | 'pvp' | 'ai-vs-ai';
  difficulty: Difficulty;
  presetIndex: number;
  lastMoveText: string;
  moveNotations: string[];
  currentSkin: SkinType;
  isPlaying: boolean;
  turn: Side;
}

export interface EngineOptions extends RuntimeRefs {
  skin?: SkinType;
  onStatusChange?: (status: ChessStatus) => void;
}

export interface EngineControls {
  startDuel: (difficulty: Difficulty) => void;
  startHumanDuel: () => void;
  startAIVsAI: (difficulty: Difficulty) => void;
  startPreset: (index: number) => void;
  restart: () => void;
  regret: () => void;
  cycleSkin: () => Promise<void>;
  setSkin: (skin: SkinType) => Promise<void>;
  setDifficulty: (difficulty: Difficulty) => void;
  setPresetIndex: (index: number) => void;
  getStatus: () => ChessStatus;
  destroy: () => void;
}
