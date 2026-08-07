import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = { left: number, right: number }

export const generateStartBoard = (): Board => ({ left: 1, right: 12 });

export const moves = {
  step: {
    // A piece advances one or two squares; landing exactly on the other piece is
    // the one thing forbidden. Both players step by the same rule.
    validate: (board: Board, _, step: number) =>
      (step === 1 || step === 2) && step !== board.right - board.left,
    apply: (board: Board, { ctx }: { ctx: Ctx }, step: number): MoveOutcome<Board> => {
      const nextBoard = ctx.currentPlayer === 0
        ? { left: board.left + step, right: board.right }
        : { left: board.left, right: board.right - step };
      if (nextBoard.right < nextBoard.left) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
