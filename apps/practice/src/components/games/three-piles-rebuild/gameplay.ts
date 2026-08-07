import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { random, range, sample } from 'lodash';

export type Board = number[]; // always length 3
export type BotStep = { keepId: number; parts: number[] };

// A pile can be kept and split only if it has at least 3 pebbles.
export const canSplit = (n: number): boolean => n >= 3;

// A player facing a triple loses exactly when no pile can be split any more.
export const isTerminal = (board: Board): boolean => !board.some(canSplit);

// Between the two halves of a turn the two discarded piles are 0, so the board
// itself records whether a turn is half-done; no turn state is needed. Every
// pile of a finished turn holds at least one pebble, so a 0 can only be a
// discarded pile.
export const keptPileId = (board: Board): number | undefined =>
  board.filter(v => v === 0).length === 2 ? board.findIndex(v => v > 0) : undefined;

// The board `keepPile` leaves behind. The board client needs it too: it must
// judge the rebuild half of the turn before the keep has been dispatched.
export const withOtherPilesDiscarded = (board: Board, keepId: number): Board =>
  board.map((v, i) => (i === keepId ? v : 0));

// A pile can be kept only at the start of a turn, and only if it can be split.
const isKeepAllowed = (board: Board, keepId: number): boolean =>
  Number.isInteger(keepId) && keepId >= 0 && keepId < board.length
    && keptPileId(board) === undefined
    && canSplit(board[keepId]);

// The rebuild has to use up the kept pile exactly, in three non-empty parts.
export const isSplitAllowed = (board: Board, parts: number[]): boolean => {
  const keptId = keptPileId(board);
  if (keptId === undefined) return false;
  return Array.isArray(parts)
    && parts.length === 3
    && parts.every(part => Number.isInteger(part) && part >= 1)
    && parts.reduce((a, b) => a + b, 0) === board[keptId];
};

// Winning ("N") numbers are n >= 3 with n % 6 in {0,3,4,5}; the losing ("P")
// numbers are exactly n % 6 in {1,2} (1,2,7,8,13,14,...). See bot-strategy.spec.ts /
// the written proof: a number is winning iff it can be split into three losing
// numbers, and only n % 6 in {1,2} cannot.
export const isWinningNumber = (n: number): boolean =>
  n >= 3 && n % 6 !== 1 && n % 6 !== 2;

export const isLosingNumber = (n: number): boolean =>
  n % 6 === 1 || n % 6 === 2;

// A triple is winning for the player to move iff it contains a winning pile.
export const isWinningBoard = (board: Board): boolean => board.some(isWinningNumber);

// Starting-position ranges. Floors avoid trivial 1-move wins from tiny piles;
// maxes are tuned so optimal games last ~2-6 moves — change a max to retune.
const SMART_MIN = 12, SMART_MAX = 45;
const TEST_MIN = 8, TEST_MAX = 26;

// Losing numbers (n % 6 in {1,2}) that are splittable — i.e. >= 3, excluding the
// unsplittable 1 and 2 — up to each range's max, used to build a genuine losing
// start (every pile can still be split).
const losingPoolUpTo = (max: number): number[] =>
  range(3, max + 1).filter(n => isLosingNumber(n) && canSplit(n));

const makeStartBoard = (losingPool: number[], lo: number, hi: number): Board => {
  // 50% losing start (mover to move loses under optimal play), 50% winning start.
  if (random(0, 1) === 0) {
    let board: Board;
    do {
      board = [sample(losingPool)!, sample(losingPool)!, sample(losingPool)!];
    } while (isTerminal(board)); // ensure it is actually playable
    return board;
  }
  let board: Board;
  do {
    board = [random(lo, hi), random(lo, hi), random(lo, hi)];
  } while (!isWinningBoard(board));
  return board;
};

export const generateStartBoard = (): Board =>
  makeStartBoard(losingPoolUpTo(SMART_MAX), SMART_MIN, SMART_MAX);
export const generateTestStartBoard = (): Board =>
  makeStartBoard(losingPoolUpTo(TEST_MAX), TEST_MIN, TEST_MAX);

export const moves = {
  // Step 1 of a turn: keep one pile, discard the other two (shown as 0).
  keepPile: {
    validate: (board: Board, _, keepId: number) => isKeepAllowed(board, keepId),
    // First half of the turn: keep one pile, then rebuild from it — the turn
    // stays open in between.
    apply: (board: Board, _, keepId: number): MoveOutcome<Board> =>
      ({ nextBoard: withOtherPilesDiscarded(board, keepId) })
  },
  // Step 2: rebuild three new piles from the kept pile's pebbles.
  splitPile: {
    validate: (board: Board, _, parts: number[]) => isSplitAllowed(board, parts),
    apply: (_board: Board, { ctx }: { ctx: Ctx }, parts: number[]): MoveOutcome<Board> => {
      const nextBoard = [...parts];
      if (isTerminal(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
