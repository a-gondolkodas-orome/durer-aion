import { isEqual, random, cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { emptiedPileId, isRemovalAllowed, isSplitAllowed, withPileRemoved } from '../gameplay';

export type Board = number[];
export type Piece = { pileId: number; pieceId: number };

export const generateStartBoard = (): Board => {
  const x = random(2, 8) * 2 + 1;
  const y = random(3, Math.min(20, 33 - x));
  return [x, y, 37 - x - y];
};

export const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: empty a pile, then split another into it — the
    // turn stays open in between.
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
      const nextBoard = cloneDeep(board);
      // the slot emptied earlier this turn takes the other half of the split
      const removedPileId = emptiedPileId(nextBoard)!;
      if (removedPileId < pileId) {
        nextBoard[removedPileId] = pieceCount;
        nextBoard[pileId] = nextBoard[pileId] - pieceCount;
      } else {
        nextBoard[removedPileId] = nextBoard[pileId] - pieceCount;
        nextBoard[pileId] = pieceCount;
      }
      // All piles down to a single piece: the opponent cannot split anything.
      if (isEqual(nextBoard, [1, 1, 1])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
