import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = { left: number, right: number }

export const generateStartBoard = (): Board => ({ left: 1, right: 12 });

// A piece advances one or two squares; landing exactly on the other piece is
// the one thing forbidden. Both players step by the same rule, so whose turn it
// is does not enter into legality — only which piece the step then moves.
export const isValidStep = (board: Board, step: number) =>
  (step === 1 || step === 2) && step !== board.right - board.left;

export const moves = {
  step: {
    validate: (board: Board, _, step: number) => isValidStep(board, step),
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
