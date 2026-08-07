import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { sample } from 'lodash';

export type Board = { piles: [number, number], leftRestriction: [boolean, boolean] }

// The pile must have a stone left, and the left pile is closed to a player who
// took from it on their previous turn. The restriction is recorded per player,
// so this is one of the games where whose move it is genuinely decides what is
// legal — not merely whose turn it is.
export const isRemovalAllowed = (board: Board, player: number, pileId: number): boolean =>
  (pileId === 0 || pileId === 1)
    && board.piles[pileId] > 0
    && !(pileId === 0 && board.leftRestriction[player]);

// The piles a player may still take from.
export const openPiles = (board: Board, player: number): number[] =>
  board.piles.flatMap((_, pileId) => isRemovalAllowed(board, player, pileId) ? [pileId] : []);

// "The player who cannot move loses" spelled out: both piles are shut to them,
// which happens when the right one is empty and the left one is either empty
// too or closed off because they took from it last turn. This is the game's
// only terminal condition, which is what lets the bot's search treat "no legal
// move" as a plain loss rather than a special case.
export const hasNoLegalMove = (board: Board, player: number): boolean =>
  openPiles(board, player).length === 0;

// The rule half of `removeStone`, without the outcome the engine reads: taking
// a stone also arms (or clears) the mover's own left-pile restriction. Shared
// with the bot's look-ahead, so a searched position is built by the very
// function that builds a played one.
export const boardAfterRemoval = (board: Board, player: number, pileId: number): Board => {
  const piles = [...board.piles] as [number, number];
  piles[pileId] -= 1;
  const leftRestriction = [...board.leftRestriction] as [boolean, boolean];
  leftRestriction[player] = (pileId === 0);
  return { piles, leftRestriction };
};

export const moves = {
  removeStone: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, pileId: number) =>
      isRemovalAllowed(board, ctx.currentPlayer!, pileId),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileId: number): MoveOutcome<Board> => {
      const nextBoard = boardAfterRemoval(board, ctx.currentPlayer!, pileId);
      if (hasNoLegalMove(nextBoard, 1 - ctx.currentPlayer!)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const generateTestStartBoard = (): Board => ({
  piles: sample([[3, 4], [4, 3], [3, 3], [4, 4]]) as [number, number],
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
