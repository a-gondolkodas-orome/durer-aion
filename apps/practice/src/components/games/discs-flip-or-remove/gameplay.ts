import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { range, isEqual, random, sample, difference, cloneDeep } from 'lodash';

export type Board = [number, number]

export const generateStartBoard = (maxDiscs: number) => (): Board => {
  const discCount = random(Math.floor(maxDiscs/2), maxDiscs);
  if (random(0, 1)) {
    const blueCount = sample(range(0, discCount + 1, 3))!;
    return [blueCount, discCount - blueCount];
  } else {
    const nextDivisibleBy3 = 3 * (Math.floor(maxDiscs/3) + 1);
    const blueCount = sample(
      difference(range(0, discCount + 1), range(0, nextDivisibleBy3, 3))
    )!;
    return [blueCount, discCount - blueCount];
  }
};

// board[0] is the blue pile, board[1] the red one. Either move takes one or two
// discs from its own pile — no more, and never from an emptier pile than that.
// Both players draw on the same two piles, so whose turn it is does not enter
// into legality.
export const isRemovalAllowed = (board: Board, count: number): boolean =>
  (count === 1 || count === 2) && count <= board[0];

const isFlipAllowed = (board: Board, count: number): boolean =>
  (count === 1 || count === 2) && count <= board[1];

export const moves = {
  removeDiscs: {
    validate: (board: Board, _, count: number) => isRemovalAllowed(board, count),
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[0] -= count;
      if (isEqual(nextBoard, [0, 0])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  turnDiscs: {
    validate: (board: Board, _, count: number) => isFlipAllowed(board, count),
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[1] -= count;
      nextBoard[0] += count;
      if (isEqual(nextBoard, [0, 0])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

// Test variant covers both sub-games: a 6-disc or a 10-disc start position.
export const generateTestStartBoard = (): Board => sample([generateStartBoard(6), generateStartBoard(10)])!();
