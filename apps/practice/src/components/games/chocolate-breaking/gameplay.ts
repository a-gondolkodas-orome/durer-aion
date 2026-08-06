import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { random } from 'lodash';

export type Piece = { id: number; w: number; h: number };
export type Board = { pieces: Piece[]; nextId: number };
export type Move = { id: number; dir: 'v' | 'h'; pos: number };
export type Split = {
  dir: 'v' | 'h';
  pos: number;
  a: { w: number; h: number };
  b: { w: number; h: number };
};

const is1x1 = (w: number, h: number) => w === 1 && h === 1;

// A piece can be broken safely (without breaking off a 1×1) exactly when it is
// not a 1×1, 1×2 or 1×3 strip. Anything with both sides ≥ 2 always has a safe
// cut; a 1×n strip needs n ≥ 4 (so both halves stay ≥ 1×2).
export const isFlexible = ({ w, h }: { w: number; h: number }): boolean => {
  if (w >= 2 && h >= 2) return true;
  return Math.max(w, h) >= 4;
};

// The current player loses when they are forced to break off a 1×1, i.e. when
// no piece can be broken safely any more.
export const hasSafeBreak = (pieces: Piece[]): boolean => pieces.some(isFlexible);

// All ways to break a single piece in two without producing a 1×1.
export const safeBreaks = ({ w, h }: { w: number; h: number }): Split[] => {
  const breaks: Split[] = [];
  for (let x = 1; x < w; x++) {
    const a = { w: x, h }, b = { w: w - x, h };
    if (!is1x1(a.w, a.h) && !is1x1(b.w, b.h)) breaks.push({ dir: 'v', pos: x, a, b });
  }
  for (let y = 1; y < h; y++) {
    const a = { w, h: y }, b = { w, h: h - y };
    if (!is1x1(a.w, a.h) && !is1x1(b.w, b.h)) breaks.push({ dir: 'h', pos: y, a, b });
  }
  return breaks;
};

// Sprague–Grundy value of a single rectangular piece under safe breaks. The
// board is a disjunctive sum of independent pieces, so the whole position is
// losing for the player to move iff the XOR of the piece values is 0.
const grundyCache = new Map<string, number>();
export const grundy = (w: number, h: number): number => {
  const key = w <= h ? `${w}x${h}` : `${h}x${w}`;
  const cached = grundyCache.get(key);
  if (cached !== undefined) return cached;

  const reachable = new Set<number>();
  for (const br of safeBreaks({ w, h })) {
    reachable.add(grundy(br.a.w, br.a.h) ^ grundy(br.b.w, br.b.h));
  }
  let mex = 0;
  while (reachable.has(mex)) mex++;

  grundyCache.set(key, mex);
  return mex;
};

export const totalGrundy = (pieces: Piece[]): number =>
  pieces.reduce((acc, p) => acc ^ grundy(p.w, p.h), 0);

export const allMoves = (pieces: Piece[]): Move[] =>
  pieces.flatMap(p => safeBreaks(p).map(br => ({ id: p.id, dir: br.dir, pos: br.pos })));

// A break names a piece still on the table and one of that piece's safe cuts —
// a break that would snap off a 1×1 is not a move, it is the loss condition.
// Both players break from the same table, so whose turn it is does not enter
// into legality.
const isBreakAllowed = (board: Board, move: Move): boolean => {
  if (!move) return false;
  const piece = board.pieces.find(p => p.id === move.id);
  if (piece === undefined) return false;
  return safeBreaks(piece).some(br => br.dir === move.dir && br.pos === move.pos);
};

export const applyBreak = (board: Board, { id, dir, pos }: Move): Board => {
  const idx = board.pieces.findIndex(p => p.id === id);
  const p = board.pieces[idx];
  const a = dir === 'v' ? { w: pos, h: p.h } : { w: p.w, h: pos };
  const b = dir === 'v' ? { w: p.w - pos, h: p.h } : { w: p.w, h: p.h - pos };

  const pieces = [...board.pieces];
  pieces.splice(idx, 1, { id: board.nextId, ...a }, { id: board.nextId + 1, ...b });
  return { pieces, nextId: board.nextId + 2 };
};

const singlePiece = (w: number, h: number): Board => ({ pieces: [{ id: 0, w, h }], nextId: 1 });

// Smart variant: pick a rectangle whose winner is balanced ~50/50 between the
// first and second player. A non-zero Grundy value means the first player to
// move wins; we reroll until the drawn rectangle matches the desired winner.
export const generateStartBoard = (): Board => {
  const wantFirstPlayerWins = random(0, 1) === 1;
  while (true) {
    let w = random(3, 5);
    let h = random(4, 7);
    if (random(0, 1) === 1) [w, h] = [h, w];
    if ((grundy(w, h) !== 0) === wantFirstPlayerWins) return singlePiece(w, h);
  }
};

// Test variant: smaller boards for quick games; balance is irrelevant since the
// test bot plays weakly on purpose.
export const generateTestStartBoard = (): Board => {
  let w = random(3, 4);
  let h = random(3, 5);
  if (random(0, 1) === 1) [w, h] = [h, w];
  return singlePiece(w, h);
};

export const moves = {
  breakPiece: {
    validate: (board: Board, _, move: Move) => isBreakAllowed(board, move),
    apply: (board: Board, { ctx }: { ctx: Ctx }, move: Move): MoveOutcome<Board> => {
      const nextBoard = applyBreak(board, move);
      if (!hasSafeBreak(nextBoard.pieces)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
