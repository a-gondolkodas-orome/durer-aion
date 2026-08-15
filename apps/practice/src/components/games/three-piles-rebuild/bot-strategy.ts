import { random, sample } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import {
  canSplit,
  isWinningNumber,
  type Board,
  type BotStep,
  type Moves
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

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

const asTurn = ({ keepId, parts }: BotStep): BotMove<Moves>[] => [
  { move: 'keepPile', args: [keepId] },
  { move: 'splitPile', args: [parts] }
];

export const smartBotStrategy: Bot = ({ board }) => asTurn(getSmartBotStep(board));

export const randomBotStrategy: Bot = ({ board }) => asTurn(getRandomBotStep(board));
