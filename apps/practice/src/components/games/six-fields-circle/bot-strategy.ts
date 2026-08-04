import { sample } from "lodash";
import type { BotStrategy } from "../../strategy-game-factory";
import {
  type Board, type Move, OPPOSITE_PAIRS, getLegalMoves, hasLegalMove, pairSum,
  sampleNonEmptyField
} from "./helpers";
import type { moves } from './six-fields-circle';

type Bot = BotStrategy<Board, keyof typeof moves>

// Optimal move: keep all three opposite-pair sums even, which hands the
// opponent a losing position. When the mover is already in a losing position
// (all sums even) no move can win, so it plays a random legal move — best
// effort, giving a mistaken opponent the chance to go wrong.
export const getSmartMove = (board: Board): Move => {
  const oddPairs = OPPOSITE_PAIRS.filter((pair) => pairSum(board, pair) % 2 === 1);

  // The total is always even, so the number of odd-sum pairs is 0 or 2.
  if (oddPairs.length === 2) {
    // One non-empty field from each odd pair. They lie in different pairs, so
    // they are never opposite: the move is legal, and it makes every pair sum
    // even.
    const first = sampleNonEmptyField(board, oddPairs[0]);
    const second = sampleNonEmptyField(board, oddPairs[1]);
    return [first, second];
  }

  return sample(getLegalMoves(board))!;
};

// Test bot: plays a random legal move, but grabs an immediately winning move
// (one that leaves the opponent unable to move) whenever one exists.
export const getRandomMove = (board: Board): Move => {
  const legalMoves = getLegalMoves(board);
  const winningMoves = legalMoves.filter(([i, j]) => {
    const next = board.slice();
    next[i]--; next[j]--;
    return !hasLegalMove(next);
  });
  return sample(winningMoves.length > 0 ? winningMoves : legalMoves)!;
};

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'removeFromTwo', args: [getSmartMove(board)] });

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'removeFromTwo', args: [getRandomMove(board)] });
