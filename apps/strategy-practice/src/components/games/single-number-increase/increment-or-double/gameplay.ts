import type { Ctx, MoveOutcome } from 'strategy-game-factory';

// `board` is the last number said. 0 means nothing has been said yet, so the
// starting player must open with 1 (their only legal move from 0).
export type Board = number

export const target = 99;

export const isLosing = (n: number) => n > target;

export const say = (next: number, ctx: Ctx): MoveOutcome<Board> => {
  if (isLosing(next)) {
    return { nextBoard: next, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } };
  }
  return { nextBoard: next, isTurnEnd: true };
};

export const moves = {
  increment: { apply: (board: Board, { ctx }: { ctx: Ctx }) => say(board + 1, ctx) },
  double: {
    // Doubling nothing says nothing, so the opening move can only be x+1 = 1.
    validate: (board: Board) => board >= 1,
    apply: (board: Board, { ctx }: { ctx: Ctx }) => say(board * 2, ctx)
  }
};

export type Moves = typeof moves;
