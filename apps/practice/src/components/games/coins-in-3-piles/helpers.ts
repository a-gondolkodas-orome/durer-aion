import { cloneDeep, isEqual } from "lodash";
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = number[]

export const getPlayerStepDescription = ({ ctx: { turnState } }) => {
  if (turnState !== null) {
    return {
      hu: 'Válassz a visszarakási lehetőségek közül.',
      en: 'Choose an option in the place back bar.'
    };
  }
  return {
    hu: 'Kattints egy érmére, hogy elvegyél egyet.',
    en: 'Click a coin to remove it.'
  };
};

// Is the player to move lost against optimal play? Closed-form parity
// predicate: a turn changes the parity of one pile, or of two when a coin is
// placed back, so from an all-even (or all-odd) board every turn hands the
// opponent one or two odd piles — the winning positions — and never the other
// way round.
export const isLostForMover = (board: Board) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

export const moves = {
  removeCoin: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, value: number) =>
      ctx.turnState === null && value >= 1 && value <= 3 && board[value - 1] > 0,
    apply: (board: Board, { ctx }: { ctx: Ctx }, value: number): MoveOutcome<Board> => {
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
    validate: (board: Board, { ctx }: { ctx: Ctx }, value: number) => {
      const removed = (ctx.turnState as { removedCoinValue: number } | null)?.removedCoinValue;
      return removed != null && value >= 1 && value < removed;
    },
    apply: (board: Board, { ctx }: { ctx: Ctx }, value: number) => {
      const nextBoard = cloneDeep(board);
      nextBoard[value - 1] += 1;
      return finishPlaceBack(nextBoard, ctx);
    }
  },
  passAddition: {
    validate: (board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState !== null,
    apply: (board: Board, { ctx }: { ctx: Ctx }) => finishPlaceBack(board, ctx)
  }
}

export type Moves = typeof moves

// Shared second half of the place-back phase: whether a coin was added or the
// player passed, the turn ends the same way.
function finishPlaceBack(nextBoard: Board, ctx: Ctx): MoveOutcome<Board> {
  if (isEqual(nextBoard, [0, 0, 0])) {
    return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
  }
  return { nextBoard, nextTurnState: null, isTurnEnd: true };
}
