import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { cloneDeep, isEqual, sample } from 'lodash';

export type Board = { piles: [number, number], leftRestriction: [boolean, boolean] }

// The pile must have a stone left, and the left pile is closed to a player who
// took from it on their previous turn. The restriction is recorded per player,
// so this is one of the games where whose move it is genuinely decides what is
// legal — not merely whose turn it is.
export const isRemovalAllowed = (board: Board, player: number, pileId: number): boolean =>
  (pileId === 0 || pileId === 1)
    && board.piles[pileId] > 0
    && !(pileId === 0 && board.leftRestriction[player]);

export const moves = {
  removeStone: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, pileId: number) =>
      isRemovalAllowed(board, ctx.currentPlayer!, pileId),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileId: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.piles[pileId] = board.piles[pileId] - 1;
      nextBoard.leftRestriction[ctx.currentPlayer!] = (pileId === 0);
      if (isGameEnd(nextBoard, ctx)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const isGameEnd = (board: Board, ctx: Ctx) => {
  if (isEqual(board.piles, [0, 0])) {
    return true;
  }
  if (board.piles[1] === 0 && board.leftRestriction[1 - ctx.currentPlayer!]) {
    return true;
  }
  return false;
}

export const generateTestStartBoard = (): Board => ({
  piles: sample([[3, 4], [4, 3], [3, 3], [4, 4]]),
  leftRestriction: [false, false]
});

export const generateStartBoard = (): Board => {
  const piles = sample([
    [11, 8],
    [9, 9],
    [9, 8],
    [9, 7],
    [5, 8],
    [8, 7],
    [6, 4]
  ]) as [number, number]
  return {
    piles,
    leftRestriction: [false, false]
  };
}
