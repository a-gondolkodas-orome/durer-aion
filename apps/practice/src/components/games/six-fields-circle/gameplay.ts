import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { random, sample } from 'lodash';

// Six fields sit on a circle, indices 0..5 clockwise. Each field holds some
// discs. A move picks two non-empty fields that are NOT opposite each other
// (opposite = indices differing by 3) and removes one disc from each. Adjacent
// and second-neighbour pairs are both allowed; only the three "diameters" are
// forbidden. The player who cannot move loses.
export type Board = number[]
export type Move = [number, number]
// The field clicked first, while the player picks the second one of the pair.
export type TurnState = { first: number }

export const FIELD_COUNT = 6;

// The three opposite (forbidden) pairs.
export const OPPOSITE_PAIRS: Move[] = [[0, 3], [1, 4], [2, 5]];

export const isOpposite = (i: number, j: number) => Math.abs(i - j) === 3;

const isField = (i: number) => Number.isInteger(i) && i >= 0 && i < FIELD_COUNT;

// Two distinct, non-empty fields that are not opposite each other. The order of
// the pair is irrelevant — the board client hands it over in click order.
export const isRemovalAllowed = (board: Board, move: Move): boolean => {
  if (!Array.isArray(move) || move.length !== 2) return false;
  const [i, j] = move;
  return isField(i) && isField(j) && i !== j && !isOpposite(i, j)
    && board[i] > 0 && board[j] > 0;
};

export const getLegalMoves = (board: Board): Move[] => {
  const moves: Move[] = [];
  for (let i = 0; i < FIELD_COUNT; i++) {
    for (let j = i + 1; j < FIELD_COUNT; j++) {
      if (isOpposite(i, j)) continue;
      if (board[i] > 0 && board[j] > 0) moves.push([i, j]);
    }
  }
  return moves;
};

export const hasLegalMove = (board: Board) => getLegalMoves(board).length > 0;

// Sum of discs on an opposite pair.
export const pairSum = (board: Board, [a, b]: Move) => board[a] + board[b];

// The key invariant from the official solution: a position is losing for the
// player to move exactly when all three opposite-pair sums are even. Otherwise
// (the total is always even, so exactly two of the three sums are odd) the
// mover can win.
export const isWinningForMover = (board: Board) =>
  OPPOSITE_PAIRS.some((pair) => pairSum(board, pair) % 2 === 1);

// Random even-total starting board that is neither empty nor already stuck.
// Half the boards are made losing for the first player (all pair sums even) and
// half winning, so across games each role wins about half the time and the
// player has to think about which side to take. The total spans the rule's full
// range (even, at most 30) with a lower bound and mostly non-empty fields to
// stay representative of the game's complexity.
export const generateStartBoard = (): Board => {
  const wantAllPairsEven = random(0, 1) === 1;
  while (true) {
    const board = Array.from({ length: FIELD_COUNT }, () => random(0, 5));
    const total = board.reduce((a, c) => a + c, 0);
    if (total < 8 || total > 30 || total % 2 !== 0) continue;
    if (board.filter((x) => x > 0).length < 4) continue;
    if (!hasLegalMove(board)) continue;
    if (isWinningForMover(board) === wantAllPairsEven) continue;
    return board;
  }
};

// Pick a non-empty field of a pair (either, if both are non-empty). A pair with
// an odd sum always has at least one non-empty field.
export const sampleNonEmptyField = (board: Board, [a, b]: Move): number => {
  const candidates = [a, b].filter((i) => board[i] > 0);
  return sample(candidates)!;
};

export const moves = {
  removeFromTwo: {
    validate: (board: Board, _: { ctx: Ctx<TurnState> }, move: Move) => isRemovalAllowed(board, move),
    apply: (board: Board, { ctx }: { ctx: Ctx<TurnState> }, [i, j]: Move): MoveOutcome<Board, TurnState> => {
      const nextBoard = board.slice();
      nextBoard[i] -= 1;
      nextBoard[j] -= 1;
      if (!hasLegalMove(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
