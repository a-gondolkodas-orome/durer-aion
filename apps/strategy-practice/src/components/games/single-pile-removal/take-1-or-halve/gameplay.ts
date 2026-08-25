import type { MoveDefs, MoveOutcome } from 'strategy-game-factory';

export type Board = number
export type HoveredAction = 'take1' | 'halve' | null

export const moves = {
  take1: {
    apply: (board, { ctx }): MoveOutcome<Board> => {
      const nextBoard = board - 1;
      if (board === 1) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  halve: {
    // Half may only be taken when the pile is even; taking one is always legal.
    validate: (board) => board >= 2 && board % 2 === 0,
    apply: (board): MoveOutcome<Board> => ({ nextBoard: board / 2, isTurnEnd: true })
  }
} satisfies MoveDefs<Board>;

export type Moves = typeof moves;
