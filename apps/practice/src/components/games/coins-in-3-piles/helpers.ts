import { cloneDeep, isEqual } from "lodash";
import type { Ctx, Events } from '../../strategy-game-factory';

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

// Can the player to move force a win? Closed-form parity predicate.
export const canWin = (board: Board) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

export const moves = {
  removeCoin: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, value: number) =>
      ctx.turnState === null && value >= 1 && value <= 3 && board[value - 1] > 0,
    legacyApply: (board: Board, { events }: { events: Events }, value) => {
      const nextBoard = cloneDeep(board);
      nextBoard[value - 1] -= 1;
      if (value === 1) {
        events.endTurn();
        if (isEqual(nextBoard, [0, 0, 0])) {
          events.endGame();
        }
      } else {
        events.setTurnState({ removedCoinValue: value });
      }
      return { nextBoard };
    }
  },
  addCoin: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, value: number) => {
      const removed = (ctx.turnState as { removedCoinValue: number } | null)?.removedCoinValue;
      return removed != null && value >= 1 && value < removed;
    },
    legacyApply: (board: Board, { events }: { events: Events }, value) => {
      const nextBoard = cloneDeep(board);
      nextBoard[value - 1] += 1;
      return finishPlaceBack(nextBoard, events);
    }
  },
  passAddition: {
    validate: (board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState !== null,
    legacyApply: (board: Board, { events }: { events: Events }) => finishPlaceBack(board, events)
  }
}

// Shared second half of the place-back phase: whether a coin was added or the
// player passed, the turn ends the same way.
function finishPlaceBack(nextBoard: Board, events: Events) {
  events.endTurn();
  events.setTurnState(null);
  if (isEqual(nextBoard, [0, 0, 0])) {
    events.endGame();
  }
  return { nextBoard };
}
