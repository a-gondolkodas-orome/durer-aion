import { isEqual } from 'lodash';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { isRemovalAllowed, isSplitAllowed, withPileRemoved } from '../gameplay';

export type Board = number[];
export type Piece = { pileId: number; pieceId: number };

export const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: discard a pile, then split the other — the turn
    // stays open in between.
    apply: (board: Board, _, pileId: number): MoveOutcome<Board> =>
      ({ nextBoard: withPileRemoved(board, pileId) })
  },
  splitPile: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSplitAllowed(board, pileId, pieceCount),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { pileId, pieceCount }: { pileId: number; pieceCount: number }
    ): MoveOutcome<Board> => {
      const nextBoard = [pieceCount, board[pileId] - pieceCount];
      // Two single-piece piles cannot be split, so the opponent is stuck.
      if (isEqual(nextBoard, [1, 1])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
