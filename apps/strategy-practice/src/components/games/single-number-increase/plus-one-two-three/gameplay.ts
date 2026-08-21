import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = number

export const target = 40;
export const maxStep = 3;

export const moves = {
  increaseTo: {
    // A step advances to a strictly larger whole number, by at most maxStep.
    validate: (board: Board, _, number: number) =>
      Number.isInteger(number) && number > board && (number - board) <= maxStep,
    apply: (_board: Board, { ctx }: { ctx: Ctx }, number: number): MoveOutcome<Board> => {
      if (number > target) {
        return { nextBoard: number, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
      }
      return { nextBoard: number, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
