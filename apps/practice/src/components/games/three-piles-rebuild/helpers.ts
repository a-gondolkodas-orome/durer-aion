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
export const isKeepAllowed = (board: Board, keepId: number): boolean =>
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
// numbers are exactly n % 6 in {1,2} (1,2,7,8,13,14,...). See helpers.spec.ts /
// the written proof: a number is winning iff it can be split into three losing
// numbers, and only n % 6 in {1,2} cannot.
export const isWinningNumber = (n: number): boolean =>
  n >= 3 && n % 6 !== 1 && n % 6 !== 2;

export const isLosingNumber = (n: number): boolean =>
  n % 6 === 1 || n % 6 === 2;

// A triple is winning for the player to move iff it contains a winning pile.
export const isWinningBoard = (board: Board): boolean => board.some(isWinningNumber);

// Split a winning number into three losing numbers (the optimal winning move).
// r in {3,4}: [1,1,n-2]; r in {5,0}: [2,2,n-4]. Every part is ≡1 or 2 (mod 6).
export const splitWinningNumber = (n: number): number[] => {
  const r = n % 6;
  return r === 3 || r === 4 ? [1, 1, n - 2] : [2, 2, n - 4];
};

// All ordered splits of n into three parts each >= 1.
const allSplits = (n: number): number[][] => {
  const splits: number[][] = [];
  for (let x = 1; x <= n - 2; x++) {
    for (let y = 1; y <= n - 1 - x; y++) {
      splits.push([x, y, n - x - y]);
    }
  }
  return splits;
};

// From a losing position every move hands the opponent a winning triple (see
// proof). We can't win against optimal play, so play the move that is hardest to
// answer: minimize the number of winning piles in the result (ideally exactly
// one), forcing the opponent to find the unique winning pile. Random tie-break.
export const getLosingBotStep = (board: Board): BotStep => {
  const candidates: { step: BotStep; winningCount: number }[] = [];
  board.forEach((n, keepId) => {
    if (!canSplit(n)) return;
    for (const parts of allSplits(n)) {
      candidates.push({ step: { keepId, parts }, winningCount: parts.filter(isWinningNumber).length });
    }
  });
  const minWinning = Math.min(...candidates.map(c => c.winningCount));
  return sample(candidates.filter(c => c.winningCount === minWinning))!.step;
};

export const getSmartBotStep = (board: Board): BotStep => {
  const keepId = board.findIndex(isWinningNumber);
  if (keepId !== -1) {
    return { keepId, parts: splitWinningNumber(board[keepId]) };
  }
  return getLosingBotStep(board);
};

// Split n (3..6) so every part is <= 2 — an immediate win (opponent gets a
// terminal triple). Starts from [1,1,1] and hands out the n-3 spare pebbles.
const splitForImmediateWin = (n: number): number[] => {
  const parts = [1, 1, 1];
  for (let i = 0; i < n - 3; i++) parts[i] += 1;
  return parts;
};

// Test bot: plays randomly, but grabs an immediate one-move win when available.
export const getRandomBotStep = (board: Board): BotStep => {
  const winNowId = board.findIndex(n => n >= 3 && n <= 6);
  if (winNowId !== -1) {
    return { keepId: winNowId, parts: splitForImmediateWin(board[winNowId]) };
  }
  const keepId = sample([0, 1, 2].filter(i => canSplit(board[i])))!;
  const n = board[keepId];
  const x = random(1, n - 2);
  const y = random(1, n - 1 - x);
  return { keepId, parts: [x, y, n - x - y] };
};

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
