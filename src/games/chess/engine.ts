import { DEFAULT_SKIN, INITIAL_BOARD, PIECE_DEFS, SKINS, cloneBoard, getPieceLetter } from './config';
import { loadOpenings } from './openings';
import { PRESETS } from './presets';
import type {
  Assets,
  BoardCell,
  BoardMap,
  ChessStatus,
  Difficulty,
  EngineControls,
  EngineOptions,
  Move,
  MovePoint,
  PieceKey,
  PieceLetter,
  PieceState,
  Side,
  SkinType,
} from './types';

const MIN_EVAL = -99999;
const MAX_EVAL = 99999;
const WIN_EVAL = 8888;

const RED_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const BLACK_NUMS = ['１', '２', '３', '４', '５', '６', '７', '８', '９', '10'];

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function boardHasPiecesBetween(board: BoardMap, x: number, startY: number, endY: number) {
  const from = Math.min(startY, endY) + 1;
  const to = Math.max(startY, endY);
  for (let y = from; y < to; y += 1) {
    if (board[y][x]) return true;
  }
  return false;
}

function locatePiece(board: BoardMap, target: PieceKey) {
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      if (board[y][x] === target) return { x, y };
    }
  }
  return null;
}

function isInside(x: number, y: number) {
  return x >= 0 && x <= 8 && y >= 0 && y <= 9;
}

function createMoveCode(x: number, y: number, newX: number, newY: number) {
  return `${x}${y}${newX}${newY}`;
}

function clonePiece(piece: PieceState): PieceState {
  return { ...piece, ps: [...piece.ps] };
}

export class ChessEngine implements EngineControls {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly clickAudio?: HTMLAudioElement | null;
  private readonly selectAudio?: HTMLAudioElement | null;
  private readonly onStatusChange?: (status: ChessStatus) => void;

  private assets: Assets | null = null;
  private pieces = {} as Record<PieceKey, PieceState>;
  private board: BoardMap = cloneBoard(INITIAL_BOARD);
  private startBoard: BoardMap = cloneBoard(INITIAL_BOARD);
  private selectedKey: PieceKey | null = null;
  private dotMoves: MovePoint[] = [];
  private lastPane: { x: number; y: number; newX: number; newY: number; isShow: boolean } = {
    x: 0,
    y: 0,
    newX: 0,
    newY: 0,
    isShow: false,
  };
  private ready = false;
  private destroyed = false;
  private thinking = false;
  private isPlaying = false;
  private winner: Side | 0 | null = null;
  private difficulty: Difficulty = 3;
  private presetIndex = 0;
  private mode: 'menu' | 'duel' | 'preset' | 'pvp' | 'ai-vs-ai' = 'menu';
  private skin: SkinType;
  private openings: string[] = [];
  private historyBill: string[] = [];
  private moveHistory: string[] = [];
  private lastMoveText = '';
  private aiTimer: number | null = null;
  private versus: 'ai' | 'human' = 'ai';

  constructor(options: EngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is not available');
    this.ctx = ctx;
    this.clickAudio = options.clickAudio;
    this.selectAudio = options.selectAudio;
    this.onStatusChange = options.onStatusChange;
    this.skin = options.skin ?? DEFAULT_SKIN;
    this.createPieces();
    void this.bootstrap();
  }

  private async bootstrap() {
    this.emitStatus();
    const [assets, openings] = await Promise.all([this.loadAssets(this.skin), loadOpenings()]);
    if (this.destroyed) return;
    this.assets = assets;
    this.openings = openings;
    this.historyBill = openings.slice();
    this.ready = true;
    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
  }

  private createPieces() {
    (Object.keys(PIECE_DEFS) as PieceLetter[]).forEach(() => undefined);
    const keys: PieceKey[] = [
      'c0', 'c1', 'm0', 'm1', 'x0', 'x1', 's0', 's1', 'j0', 'p0', 'p1', 'z0', 'z1', 'z2', 'z3', 'z4',
      'C0', 'C1', 'M0', 'M1', 'X0', 'X1', 'S0', 'S1', 'J0', 'P0', 'P1', 'Z0', 'Z1', 'Z2', 'Z3', 'Z4',
    ];
    keys.forEach((key) => {
      const pater = getPieceLetter(key);
      const def = PIECE_DEFS[pater];
      this.pieces[key] = {
        key,
        pater,
        x: 0,
        y: 0,
        my: def.my,
        text: def.text,
        value: def.value,
        isShow: false,
        alpha: 1,
        ps: [],
      };
    });
  }

  private assetUrl(path: string): string {
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    return `${String(base).replace(/\/$/, '')}${path}`;
  }

  private async loadAssets(skin: SkinType): Promise<Assets> {
    const page = SKINS[skin].page;
    const pieceLetters = Object.keys(PIECE_DEFS) as PieceLetter[];
    const base = this.assetUrl('');
    const pieceEntries = await Promise.all(
      pieceLetters.map(async (letter) => [letter, await createImage(`${base}/chess/img/${page}/${PIECE_DEFS[letter].img}.png`)] as const),
    );

    return {
      board: await createImage(`${base}/chess/img/${page}/bg.png`),
      dot: await createImage(`${base}/chess/img/${page}/dot.png`),
      pane: await createImage(`${base}/chess/img/${page}/r_box.png`),
      pieces: Object.fromEntries(pieceEntries) as Record<PieceLetter, HTMLImageElement>,
    };
  }

  private playAudio(audio?: HTMLAudioElement | null) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // ignore autoplay/playback errors
    }
  }

  private emitStatus() {
    this.onStatusChange?.(this.getStatus());
  }

  getStatus(): ChessStatus {
    return {
      scoreText: this.buildStatusText(),
      winner: this.winner,
      thinking: this.thinking,
      mode: this.mode,
      difficulty: this.difficulty,
      presetIndex: this.presetIndex,
      lastMoveText: this.lastMoveText,
      moveNotations: this.buildMoveNotations(),
      currentSkin: this.skin,
      isPlaying: this.isPlaying,
      turn: this.getCurrentTurnSide(),
    };
  }

  private buildStatusText() {
    if (!this.ready) return '资源加载中...';
    if (this.winner === 1) return `${this.mode === 'pvp' ? '红方胜' : '你赢了'}${this.lastMoveText ? ` · ${this.lastMoveText}` : ''}`;
    if (this.winner === -1) return `${this.mode === 'pvp' ? '黑方胜' : 'AI 获胜'}${this.lastMoveText ? ` · ${this.lastMoveText}` : ''}`;
    if (this.mode === 'menu') return '选择模式后开始对弈';
    const prefix = this.mode === 'duel'
      ? '人机对弈'
      : this.mode === 'pvp'
        ? '人人对战'
        : `残局挑战 · ${PRESETS[this.presetIndex]?.name ?? ''}`;
    if (this.thinking) return `${prefix} · AI 思考中...`;
    return `${prefix}${this.mode === 'pvp' ? '' : ` · 难度 ${this.difficulty}`}${this.lastMoveText ? ` · ${this.lastMoveText}` : ''}`;
  }

  private buildMoveNotations() {
    const notations: string[] = [];
    const board = cloneBoard(this.startBoard);

    for (const code of this.moveHistory) {
      const [x, y, newX, newY] = code.split('').map((value) => parseInt(value, 10));
      const moving = board[y]?.[x];
      if (!moving) continue;
      notations.push(this.createMoveText(moving, x, y, newX, newY));
      board[newY][newX] = moving;
      board[y][x] = undefined;
    }

    return notations;
  }

  private getCurrentTurnSide(): Side {
    return this.moveHistory.length % 2 === 0 ? 1 : -1;
  }

  private getHumanControlSide(): Side {
    return this.mode === 'pvp' ? this.getCurrentTurnSide() : 1;
  }

  private shouldAiRespond() {
    return this.versus === 'ai' && this.mode !== 'pvp';
  }

  private finishTurnAfterHumanMove(movingSide: Side) {
    const nextSide = this.getCurrentTurnSide();
    if (!this.hasAnyLegalMoves(this.board, nextSide)) {
      this.finishGame(movingSide);
      return;
    }
    if (this.shouldAiRespond() && nextSide === -1) {
      this.queueAiMove();
      return;
    }
    this.draw();
    this.emitStatus();
  }

  private async applySkin(skin: SkinType) {
    this.skin = skin;
    this.ready = false;
    this.emitStatus();
    this.assets = await this.loadAssets(this.skin);
    if (this.destroyed) return;
    this.ready = true;
    this.draw();
    this.emitStatus();
  }

  private syncPiecesFromBoard() {
    (Object.values(this.pieces) as PieceState[]).forEach((piece) => {
      piece.isShow = false;
      piece.alpha = 1;
      piece.ps = [];
    });

    for (let y = 0; y < this.board.length; y += 1) {
      for (let x = 0; x < this.board[y].length; x += 1) {
        const key = this.board[y][x];
        if (!key) continue;
        const piece = this.pieces[key];
        piece.x = x;
        piece.y = y;
        piece.isShow = true;
      }
    }

    if (this.selectedKey) {
      const selected = this.pieces[this.selectedKey];
      if (selected.isShow) {
        selected.alpha = 0.8;
        selected.ps = this.getLegalMoves(selected.key, selected.x, selected.y, this.board);
      } else {
        this.selectedKey = null;
        this.dotMoves = [];
      }
    }
  }

  private getCurrentSkinConfig() {
    return SKINS[this.skin];
  }

  private draw() {
    if (!this.ready || !this.assets) return;
    const skin = this.getCurrentSkinConfig();
    if (this.canvas.width !== skin.width) this.canvas.width = skin.width;
    if (this.canvas.height !== skin.height) this.canvas.height = skin.height;

    this.ctx.clearRect(0, 0, skin.width, skin.height);
    this.ctx.drawImage(this.assets.board, 0, 0);

    const dotOffset = Math.round(skin.spaceX * 0.18);
    this.dotMoves.forEach(([x, y]) => {
      this.ctx.drawImage(this.assets!.dot, skin.spaceX * x + dotOffset + skin.pointStartX, skin.spaceY * y + dotOffset + skin.pointStartY);
    });

    if (this.lastPane.isShow) {
      this.ctx.drawImage(this.assets.pane, skin.spaceX * this.lastPane.x + skin.pointStartX, skin.spaceY * this.lastPane.y + skin.pointStartY);
      this.ctx.drawImage(this.assets.pane, skin.spaceX * this.lastPane.newX + skin.pointStartX, skin.spaceY * this.lastPane.newY + skin.pointStartY);
    }

    (Object.values(this.pieces) as PieceState[]).forEach((piece) => {
      if (!piece.isShow) return;
      this.ctx.save();
      this.ctx.globalAlpha = piece.alpha;
      this.ctx.drawImage(this.assets!.pieces[piece.pater], skin.spaceX * piece.x + skin.pointStartX, skin.spaceY * piece.y + skin.pointStartY);
      this.ctx.restore();
    });
  }

  private handleCanvasClick = (event: MouseEvent) => {
    if (!this.ready || !this.isPlaying || this.thinking || this.winner !== null) return;
    if (this.mode === 'ai-vs-ai') return; // AI vs AI — no human interaction
    const point = this.getClickPoint(event);
    if (!point) return;
    const [x, y] = point;
    const key = this.board[y][x];

    if (key) {
      this.clickPiece(key, x, y);
    } else {
      this.clickPoint(x, y);
    }

    this.draw();
    this.emitStatus();
  };

  private getClickPoint(event: MouseEvent): [number, number] | null {
    const skin = this.getCurrentSkinConfig();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;
    const x = Math.round((px - skin.pointStartX - 20) / skin.spaceX);
    const y = Math.round((py - skin.pointStartY - 20) / skin.spaceY);
    if (!isInside(x, y)) return null;
    return [x, y];
  }

  private clickPiece(key: PieceKey, x: number, y: number) {
    const piece = this.pieces[key];

    if (this.selectedKey && this.selectedKey !== key && piece.my !== this.pieces[this.selectedKey].my) {
      const selected = this.pieces[this.selectedKey];
      if (this.hasMove(selected.ps, x, y)) {
        const captured = this.applyMove(selected.x, selected.y, x, y);
        this.lastMoveText = this.createMoveText(selected.key, selected.x, selected.y, x, y);
        this.moveHistory.push(createMoveCode(selected.x, selected.y, x, y));
        this.lastPane = { x: selected.x, y: selected.y, newX: x, newY: y, isShow: true };
        this.selectedKey = null;
        this.dotMoves = [];
        this.syncPiecesFromBoard();
        this.playAudio(this.clickAudio);
        if (captured === 'J0') {
          this.finishGame(1);
          return;
        }
        if (captured === 'j0') {
          this.finishGame(-1);
          return;
        }
        this.finishTurnAfterHumanMove(selected.my);
      }
    }

    if (piece.my === this.getHumanControlSide()) {
      this.selectedKey = key;
      this.dotMoves = this.getLegalMoves(key, x, y, this.board);
      this.syncPiecesFromBoard();
      this.playAudio(this.selectAudio);
    }
  }

  private clickPoint(x: number, y: number) {
    if (!this.selectedKey) return;
    const selected = this.pieces[this.selectedKey];
    if (!this.hasMove(selected.ps, x, y)) return;

    this.applyMove(selected.x, selected.y, x, y);
    this.lastMoveText = this.createMoveText(selected.key, selected.x, selected.y, x, y);
    this.moveHistory.push(createMoveCode(selected.x, selected.y, x, y));
    this.lastPane = { x: selected.x, y: selected.y, newX: x, newY: y, isShow: true };
    this.selectedKey = null;
    this.dotMoves = [];
    this.syncPiecesFromBoard();
    this.playAudio(this.clickAudio);
    this.finishTurnAfterHumanMove(selected.my);
  }

  private queueAiMove() {
    if (!this.shouldAiRespond()) return;
    this.thinking = true;
    this.emitStatus();
    this.draw();
    if (this.aiTimer) window.clearTimeout(this.aiTimer);
    this.aiTimer = window.setTimeout(() => {
      this.aiTimer = null;
      this.runAiMove();
    }, 450);
  }

  private runAiMove() {
    if (!this.isPlaying || this.winner !== null) return;
    const move = this.pickAiMove();
    if (!move) {
      this.finishGame(1);
      return;
    }

    const [x, y, newX, newY] = move;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof newX !== 'number' || typeof newY !== 'number' ||
        isNaN(x) || isNaN(y) || isNaN(newX) || isNaN(newY) ||
        !this.board[y] || this.board[y][x] === undefined) {
      this.thinking = false;
      this.emitStatus();
      return;
    }

    const movingKey = this.board[y][x];
    if (!movingKey) {
      this.thinking = false;
      this.emitStatus();
      return;
    }

    const captured = this.applyMove(x, y, newX, newY);
    this.lastMoveText = this.createMoveText(movingKey, x, y, newX, newY);
    this.moveHistory.push(createMoveCode(x, y, newX, newY));
    this.lastPane = { x, y, newX, newY, isShow: true };
    this.selectedKey = null;
    this.dotMoves = [];
    this.syncPiecesFromBoard();
    this.playAudio(this.clickAudio);
    this.thinking = false;

    if (captured === 'j0') {
      this.finishGame(-1);
      return;
    }
    if (captured === 'J0') {
      this.finishGame(1);
      return;
    }
    if (!this.hasAnyLegalMoves(this.board, this.getCurrentTurnSide())) {
      this.finishGame((-this.getCurrentTurnSide()) as Side);
      return;
    }

    this.draw();
    this.emitStatus();
  }

  private finishGame(winner: Side) {
    this.thinking = false;
    this.winner = winner;
    this.isPlaying = false;
    this.draw();
    this.emitStatus();
  }

  private applyMove(x: number, y: number, newX: number, newY: number) {
    const moving = this.board[y][x];
    if (!moving) return undefined;
    const captured = this.board[newY][newX];
    this.board[newY][newX] = moving;
    this.board[y][x] = undefined;
    return captured;
  }

  private hasMove(points: MovePoint[], x: number, y: number) {
    return points.some(([px, py]) => px === x && py === y);
  }

  private getPieceMoves(key: PieceKey, x: number, y: number, board: BoardMap): MovePoint[] {
    const letter = getPieceLetter(key);
    const side = PIECE_DEFS[letter].my;
    switch (PIECE_DEFS[letter].bl) {
      case 'c': return this.rookMoves(x, y, board, side);
      case 'm': return this.knightMoves(x, y, board, side);
      case 'x': return this.elephantMoves(x, y, board, side);
      case 's': return this.advisorMoves(x, y, board, side);
      case 'j': return this.generalMoves(x, y, board, side);
      case 'p': return this.cannonMoves(x, y, board, side);
      case 'z': return this.pawnMoves(x, y, board, side);
      default: return [];
    }
  }

  private getLegalMoves(key: PieceKey, x: number, y: number, board: BoardMap): MovePoint[] {
    const side = PIECE_DEFS[getPieceLetter(key)].my;
    const candidates = this.getPieceMoves(key, x, y, board);
    return candidates.filter(([newX, newY]) => {
      const nextBoard = cloneBoard(board);
      nextBoard[newY][newX] = key;
      nextBoard[y][x] = undefined;
      return !this.isGeneralInCheck(nextBoard, side);
    });
  }

  private hasAnyLegalMoves(board: BoardMap, side: Side) {
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        const key = board[y][x];
        if (!key || PIECE_DEFS[getPieceLetter(key)].my !== side) continue;
        if (this.getLegalMoves(key, x, y, board).length > 0) return true;
      }
    }
    return false;
  }

  private isGeneralInCheck(board: BoardMap, side: Side) {
    const generalKey = side === 1 ? 'j0' : 'J0';
    const generalPos = locatePiece(board, generalKey);
    if (!generalPos) return true;
    const enemySide = (side * -1) as Side;

    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        const key = board[y][x];
        if (!key || PIECE_DEFS[getPieceLetter(key)].my !== enemySide) continue;
        const moves = this.getPieceMoves(key, x, y, board);
        if (moves.some(([mx, my]) => mx === generalPos.x && my === generalPos.y)) {
          return true;
        }
      }
    }

    return false;
  }

  private isEnemy(cell: BoardCell, side: Side) {
    if (!cell) return false;
    return PIECE_DEFS[getPieceLetter(cell)].my !== side;
  }

  private isFriend(cell: BoardCell, side: Side) {
    if (!cell) return false;
    return PIECE_DEFS[getPieceLetter(cell)].my === side;
  }

  private rookMoves(x: number, y: number, board: BoardMap, side: Side) {
    const moves: MovePoint[] = [];
    for (let i = x - 1; i >= 0; i -= 1) {
      const cell = board[y][i];
      if (cell) {
        if (this.isEnemy(cell, side)) moves.push([i, y]);
        break;
      }
      moves.push([i, y]);
    }
    for (let i = x + 1; i <= 8; i += 1) {
      const cell = board[y][i];
      if (cell) {
        if (this.isEnemy(cell, side)) moves.push([i, y]);
        break;
      }
      moves.push([i, y]);
    }
    for (let i = y - 1; i >= 0; i -= 1) {
      const cell = board[i][x];
      if (cell) {
        if (this.isEnemy(cell, side)) moves.push([x, i]);
        break;
      }
      moves.push([x, i]);
    }
    for (let i = y + 1; i <= 9; i += 1) {
      const cell = board[i][x];
      if (cell) {
        if (this.isEnemy(cell, side)) moves.push([x, i]);
        break;
      }
      moves.push([x, i]);
    }
    return moves;
  }

  private knightMoves(x: number, y: number, board: BoardMap, side: Side) {
    const candidates: Array<[number, number, number, number]> = [
      [x + 1, y - 2, x, y - 1],
      [x + 2, y - 1, x + 1, y],
      [x + 2, y + 1, x + 1, y],
      [x + 1, y + 2, x, y + 1],
      [x - 1, y + 2, x, y + 1],
      [x - 2, y + 1, x - 1, y],
      [x - 2, y - 1, x - 1, y],
      [x - 1, y - 2, x, y - 1],
    ];

    return candidates.flatMap(([nx, ny, bx, by]) => {
      if (!isInside(nx, ny) || !isInside(bx, by) || board[by][bx]) return [];
      const cell = board[ny][nx];
      return this.isFriend(cell, side) ? [] : ([[nx, ny]] as MovePoint[]);
    });
  }

  private elephantMoves(x: number, y: number, board: BoardMap, side: Side) {
    const candidates: Array<[number, number, number, number]> = [
      [x + 2, y + 2, x + 1, y + 1],
      [x - 2, y + 2, x - 1, y + 1],
      [x + 2, y - 2, x + 1, y - 1],
      [x - 2, y - 2, x - 1, y - 1],
    ];

    return candidates.flatMap(([nx, ny, bx, by]) => {
      if (!isInside(nx, ny) || board[by]?.[bx]) return [];
      if (side === 1 && ny < 5) return [];
      if (side === -1 && ny > 4) return [];
      const cell = board[ny][nx];
      return this.isFriend(cell, side) ? [] : ([[nx, ny]] as MovePoint[]);
    });
  }

  private advisorMoves(x: number, y: number, board: BoardMap, side: Side) {
    const candidates: Array<[number, number]> = [
      [x + 1, y + 1],
      [x - 1, y + 1],
      [x + 1, y - 1],
      [x - 1, y - 1],
    ];

    return candidates.flatMap(([nx, ny]) => {
      if (!isInside(nx, ny) || nx < 3 || nx > 5) return [];
      if (side === 1 && (ny < 7 || ny > 9)) return [];
      if (side === -1 && (ny < 0 || ny > 2)) return [];
      const cell = board[ny][nx];
      return this.isFriend(cell, side) ? [] : ([[nx, ny]] as MovePoint[]);
    });
  }

  private generalMoves(x: number, y: number, board: BoardMap, side: Side) {
    const moves: MovePoint[] = [];
    const candidates: Array<[number, number]> = [
      [x, y + 1],
      [x, y - 1],
      [x + 1, y],
      [x - 1, y],
    ];

    candidates.forEach(([nx, ny]) => {
      if (!isInside(nx, ny) || nx < 3 || nx > 5) return;
      if (side === 1 && (ny < 7 || ny > 9)) return;
      if (side === -1 && (ny < 0 || ny > 2)) return;
      const cell = board[ny][nx];
      if (!this.isFriend(cell, side)) moves.push([nx, ny]);
    });

    const red = locatePiece(board, 'j0');
    const black = locatePiece(board, 'J0');
    if (red && black && red.x === black.x && !boardHasPiecesBetween(board, red.x, red.y, black.y)) {
      if (side === 1) moves.push([black.x, black.y]);
      else moves.push([red.x, red.y]);
    }

    return moves;
  }

  private cannonMoves(x: number, y: number, board: BoardMap, side: Side) {
    const moves: MovePoint[] = [];
    const scan = (dx: number, dy: number) => {
      let cx = x + dx;
      let cy = y + dy;
      let jumped = false;
      while (isInside(cx, cy)) {
        const cell = board[cy][cx];
        if (!cell) {
          if (!jumped) moves.push([cx, cy]);
        } else if (!jumped) {
          jumped = true;
        } else {
          if (this.isEnemy(cell, side)) moves.push([cx, cy]);
          break;
        }
        cx += dx;
        cy += dy;
      }
    };
    scan(-1, 0);
    scan(1, 0);
    scan(0, -1);
    scan(0, 1);
    return moves;
  }

  private pawnMoves(x: number, y: number, board: BoardMap, side: Side) {
    const moves: MovePoint[] = [];
    if (side === 1) {
      const forward = [x, y - 1] as const;
      if (isInside(forward[0], forward[1]) && !this.isFriend(board[forward[1]][forward[0]], side)) moves.push([forward[0], forward[1]]);
      if (y <= 4) {
        if (x + 1 <= 8 && !this.isFriend(board[y][x + 1], side)) moves.push([x + 1, y]);
        if (x - 1 >= 0 && !this.isFriend(board[y][x - 1], side)) moves.push([x - 1, y]);
      }
    } else {
      const forward = [x, y + 1] as const;
      if (isInside(forward[0], forward[1]) && !this.isFriend(board[forward[1]][forward[0]], side)) moves.push([forward[0], forward[1]]);
      if (y >= 6) {
        if (x + 1 <= 8 && !this.isFriend(board[y][x + 1], side)) moves.push([x + 1, y]);
        if (x - 1 >= 0 && !this.isFriend(board[y][x - 1], side)) moves.push([x - 1, y]);
      }
    }
    return moves;
  }

  private generateMoves(board: BoardMap, side: Side, foul: string[] | null) {
    const moves: Move[] = [];
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        const key = board[y][x];
        if (!key || PIECE_DEFS[getPieceLetter(key)].my !== side) continue;
        const points = this.getLegalMoves(key, x, y, board);
        points.forEach(([newX, newY]) => {
          if (foul && String(foul[0]) === String(x) && String(foul[1]) === String(y) && String(foul[2]) === String(newX) && String(foul[3]) === String(newY)) return;
          moves.push([x, y, newX, newY, key]);
        });
      }
    }
    return moves;
  }

  private evaluate(board: BoardMap, perspective: Side) {
    let value = 0;
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[y].length; x += 1) {
        const key = board[y][x];
        if (!key) continue;
        const def = PIECE_DEFS[getPieceLetter(key)];
        value += def.value[y][x] * def.my;
      }
    }
    return value * perspective;
  }

  private alphaBeta(alpha: number, beta: number, depth: number, board: BoardMap, side: Side, rootDepth: number, foul: string[] | null): { value: number; move?: Move } {
    if (depth === 0) return { value: this.evaluate(board, side) };

    const moves = this.generateMoves(board, side, foul);
    if (!moves.length) return { value: -WIN_EVAL };

    let bestMove: Move | undefined;

    for (const move of moves) {
      const [x, y, newX, newY, key] = move;
      const captured = board[newY][newX];
      board[newY][newX] = key!;
      board[y][x] = undefined;

      let score: number;
      if (captured === 'j0' || captured === 'J0') {
        score = WIN_EVAL;
      } else {
        score = -this.alphaBeta(-beta, -alpha, depth - 1, board, (side * -1) as Side, rootDepth, null).value;
      }

      board[y][x] = key!;
      board[newY][newX] = captured;

      if (score >= beta) {
        return { value: beta, move };
      }

      if (score > alpha) {
        alpha = score;
        bestMove = move;
      }
    }

    if (depth === rootDepth && !bestMove) return { value: -WIN_EVAL };
    return { value: alpha, move: bestMove };
  }

  private pickAiMove(): Move | null {
    const pace = this.moveHistory.join('');
    const source = this.historyBill.length ? this.historyBill : this.openings;
    if (source.length) {
      const matched = source.filter((line) => line.slice(0, pace.length) === pace);
      if (matched.length) {
        const chosen = matched[Math.floor(Math.random() * matched.length)];
        this.historyBill = matched;
        const digits = chosen.slice(pace.length, pace.length + 4).split('').map((item) => parseInt(item, 10));
        if (digits.length >= 4 && !digits.some(isNaN)) {
          const [x, y] = digits;
          // Validate the board position belongs to the current turn side
          const key = this.board[y]?.[x];
          if (key && PIECE_DEFS[getPieceLetter(key)].my === this.getCurrentTurnSide()) {
            return [digits[0], digits[1], digits[2], digits[3]];
          }
        }
        this.historyBill = [];
      }
    }

    const result = this.alphaBeta(MIN_EVAL, MAX_EVAL, this.difficulty, cloneBoard(this.board), this.getCurrentTurnSide(), this.difficulty, this.checkFoul());
    return result.move ?? null;
  }

  private checkFoul() {
    const p = this.moveHistory;
    const len = p.length;
    if (len > 11 && p[len - 1] === p[len - 5] && p[len - 5] === p[len - 9]) {
      return p[len - 4].split('');
    }
    return null;
  }

  private createMoveText(key: PieceKey, x: number, y: number, newX: number, newY: number) {
    const piece = this.pieces[key] ?? clonePiece({
      key,
      pater: getPieceLetter(key),
      x,
      y,
      my: PIECE_DEFS[getPieceLetter(key)].my,
      text: PIECE_DEFS[getPieceLetter(key)].text,
      value: PIECE_DEFS[getPieceLetter(key)].value,
      isShow: true,
      alpha: 1,
      ps: [],
    });

    let text = piece.text;
    if (piece.my === 1) {
      text += RED_NUMS[8 - x];
      if (newY > y) {
        text += '退';
        text += piece.pater === 'm' || piece.pater === 's' || piece.pater === 'x' ? RED_NUMS[8 - newX] : RED_NUMS[newY - y - 1];
      } else if (newY < y) {
        text += '进';
        text += piece.pater === 'm' || piece.pater === 's' || piece.pater === 'x' ? RED_NUMS[8 - newX] : RED_NUMS[y - newY - 1];
      } else {
        text += '平';
        text += RED_NUMS[8 - newX];
      }
    } else {
      text += BLACK_NUMS[x];
      if (newY > y) {
        text += '进';
        text += piece.pater === 'M' || piece.pater === 'S' || piece.pater === 'X' ? BLACK_NUMS[newX] : BLACK_NUMS[newY - y - 1];
      } else if (newY < y) {
        text += '退';
        text += piece.pater === 'M' || piece.pater === 'S' || piece.pater === 'X' ? BLACK_NUMS[newX] : BLACK_NUMS[y - newY - 1];
      } else {
        text += '平';
        text += BLACK_NUMS[newX];
      }
    }
    return text;
  }

  startDuel(difficulty: Difficulty) {
    if (!this.ready) return;
    this.versus = 'ai';
    this.difficulty = difficulty;
    this.mode = 'duel';
    this.startBoard = cloneBoard(INITIAL_BOARD);
    this.board = cloneBoard(INITIAL_BOARD);
    this.moveHistory = [];
    this.historyBill = this.openings.slice();
    this.selectedKey = null;
    this.dotMoves = [];
    this.lastPane.isShow = false;
    this.thinking = false;
    this.winner = null;
    this.lastMoveText = '';
    this.isPlaying = true;
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
  }

  startHumanDuel() {
    if (!this.ready) return;
    this.versus = 'human';
    this.mode = 'pvp';
    this.startBoard = cloneBoard(INITIAL_BOARD);
    this.board = cloneBoard(INITIAL_BOARD);
    this.moveHistory = [];
    this.historyBill = this.openings.slice();
    this.selectedKey = null;
    this.dotMoves = [];
    this.lastPane.isShow = false;
    this.thinking = false;
    this.winner = null;
    this.lastMoveText = '';
    this.isPlaying = true;
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
  }

  startAIVsAI() {
    if (!this.ready) return;
    this.versus = 'ai';
    this.mode = 'ai-vs-ai';
    this.difficulty = 3;
    this.startBoard = cloneBoard(INITIAL_BOARD);
    this.board = cloneBoard(INITIAL_BOARD);
    this.moveHistory = [];
    this.historyBill = this.openings.slice();
    this.selectedKey = null;
    this.dotMoves = [];
    this.lastPane.isShow = false;
    this.thinking = false;
    this.winner = null;
    this.lastMoveText = '';
    this.isPlaying = true;
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
    // Kick off AI vs AI sequence
    if (this.aiTimer) window.clearTimeout(this.aiTimer);
    this.aiTimer = window.setTimeout(() => this.runAIVsAIMove(), 800);
  }

  private runAIVsAIMove() {
    if (!this.isPlaying || this.winner !== null) return;
    this.thinking = true;
    this.emitStatus();
    this.draw();
    if (this.aiTimer) window.clearTimeout(this.aiTimer);
    this.aiTimer = window.setTimeout(() => {
      this.aiTimer = null;
      this.runAiMove();
      // After move completes, queue next AI move for opposite side
      if (this.isPlaying && this.winner === null) {
        this.aiTimer = window.setTimeout(() => this.runAIVsAIMove(), 600);
      }
    }, 350);
  }

  startPreset(index: number) {
    if (!this.ready) return;
    this.versus = 'ai';
    this.presetIndex = index;
    this.mode = 'preset';
    this.difficulty = 4;
    this.startBoard = cloneBoard(PRESETS[index].map);
    this.board = cloneBoard(PRESETS[index].map);
    this.moveHistory = [];
    this.historyBill = this.openings.slice();
    this.selectedKey = null;
    this.dotMoves = [];
    this.lastPane.isShow = false;
    this.thinking = false;
    this.winner = null;
    this.lastMoveText = '';
    this.isPlaying = true;
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
  }

  restart() {
    if (!this.ready || this.mode === 'menu') return;
    if (this.aiTimer) window.clearTimeout(this.aiTimer);
    if (this.mode === 'duel') {
      this.startDuel(this.difficulty);
    } else if (this.mode === 'pvp') {
      this.startHumanDuel();
    } else if (this.mode === 'ai-vs-ai') {
      this.startAIVsAI();
    } else {
      this.startPreset(this.presetIndex);
    }
  }

  regret() {
    if (!this.ready || this.mode === 'menu') return;
    const steps = this.mode === 'pvp' ? 1 : 2;
    if (this.moveHistory.length < steps) return;
    for (let i = 0; i < steps; i += 1) {
      this.moveHistory.pop();
    }
    this.board = cloneBoard(this.startBoard);

    for (const code of this.moveHistory) {
      const [x, y, newX, newY] = code.split('').map((value) => parseInt(value, 10));
      const moving = this.board[y][x];
      if (!moving) continue;
      this.board[newY][newX] = moving;
      this.board[y][x] = undefined;
    }

    this.selectedKey = null;
    this.dotMoves = [];
    this.winner = null;
    this.thinking = false;
    this.isPlaying = true;
    this.lastMoveText = this.moveHistory.length ? `已悔棋 ${this.mode === 'pvp' ? this.moveHistory.length : this.moveHistory.length / 2} ${this.mode === 'pvp' ? '步' : '回合'}` : '';
    this.syncPiecesFromBoard();
    this.draw();
    this.emitStatus();
  }

  async cycleSkin() {
    const next: SkinType = this.skin === 'stype1' ? 'stype3' : this.skin === 'stype2' ? 'stype1' : 'stype2';
    await this.applySkin(next);
  }

  async setSkin(skin: SkinType) {
    if (skin === this.skin) return;
    await this.applySkin(skin);
  }

  setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.emitStatus();
  }

  setPresetIndex(index: number) {
    this.presetIndex = index;
    this.emitStatus();
  }

  destroy() {
    this.destroyed = true;
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    if (this.aiTimer) window.clearTimeout(this.aiTimer);
  }
}

export function createChessEngine(options: EngineOptions) {
  return new ChessEngine(options);
}
