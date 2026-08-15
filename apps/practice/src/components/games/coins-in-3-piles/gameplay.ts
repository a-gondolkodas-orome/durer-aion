import { cloneDeep, isEqual, random, sum } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = number[]
// The coin taken in the first half of the turn, while the player decides what
// (if anything) to place back.
export type TurnState = { removedCoinValue: number }

// Is the player to move lost against optimal play? Closed-form parity
// predicate: a turn changes the parity of one pile, or of two when a coin is
// placed back, so from an all-even (or all-odd) board every turn hands the
// opponent one or two odd piles — the winning positions — and never the other
// way round.
export const isLostForMover = (board: Board) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

const generateWinningStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (!isLostForMover(board) && sum(board) >= 4) return board;
  return generateWinningStartBoard();
};

const generateLosingStartBoard = (): Board => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (isLostForMover(board) && sum(board) >= 4) return board;
  return generateLosingStartBoard();
};

// "Arbitrary" sub-game: a balanced (~50/50) heap of 1/2/3-pengő coins.
export const generateArbitraryStartBoard = (): Board =>
  random(0, 1) ? generateWinningStartBoard() : generateLosingStartBoard();

// Category A's sub-game (the original "Change 15 coins"): 3×1, 5×2, 7×3.
export const startBoardOfCategoryA: Board = [3, 5, 7];

// Test variant covers both sub-games: a small arbitrary heap, or the 3-5-7 setup.
export const generateTestStartBoard = (): Board =>
  random(0, 1)
    ? [random(0, 2), random(0, 2), random(1, 3)]
    : [...startBoardOfCategoryA];

export const moves = {
  removeCoin: {
    validate: (board: Board, { ctx }: { ctx: Ctx<TurnState> }, value: number) =>
      ctx.turnState === null && value >= 1 && value <= 3 && board[value - 1] > 0,
    apply: (board: Board, { ctx }: { ctx: Ctx<TurnState> }, value: number): MoveOutcome<Board, TurnState> => {
      const nextBoard = cloneDeep(board);
      nextBoard[value - 1] -= 1;
      if (value === 1) {
        if (isEqual(nextBoard, [0, 0, 0])) {
          return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
        }
        return { nextBoard, isTurnEnd: true };
      }
      return { nextBoard, nextTurnState: { removedCoinValue: value } };
    }
  },
  addCoin: {
    validate: (_board: Board, { ctx }: { ctx: Ctx<TurnState> }, value: number) => {
      const removed = ctx.turnState?.removedCoinValue;
      return removed != null && value >= 1 && value < removed;
    },
    apply: (board: Board, { ctx }: { ctx: Ctx<TurnState> }, value: number) => {
      const nextBoard = cloneDeep(board);
      nextBoard[value - 1] += 1;
      return finishPlaceBack(nextBoard, ctx);
    }
  },
  passAddition: {
    validate: (_board: Board, { ctx }: { ctx: Ctx<TurnState> }) => ctx.turnState !== null,
    apply: (board: Board, { ctx }: { ctx: Ctx<TurnState> }) => finishPlaceBack(board, ctx)
  }
}

export type Moves = typeof moves

// Shared second half of the place-back phase: whether a coin was added or the
// player passed, the turn ends the same way.
function finishPlaceBack(nextBoard: Board, ctx: Ctx<TurnState>): MoveOutcome<Board, TurnState> {
  if (isEqual(nextBoard, [0, 0, 0])) {
    return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
  }
  return { nextBoard, nextTurnState: null, isTurnEnd: true };
}
