import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = number
export type HoveredAction = 'take1' | 'halve' | null

export const moves = {
  take1: {
    apply: (board: Board, { ctx }: { ctx: Ctx }): MoveOutcome<Board> => {
      const nextBoard = board - 1;
      if (board === 1) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  halve: {
    // Half may only be taken when the pile is even; taking one is always legal.
    validate: (board: Board) => board >= 2 && board % 2 === 0,
    apply: (board: Board): MoveOutcome<Board> => ({ nextBoard: board / 2, isTurnEnd: true })
  }
};

export type Moves = typeof moves;
