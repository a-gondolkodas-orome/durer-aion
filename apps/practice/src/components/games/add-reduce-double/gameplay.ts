import { isEqual, cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = number[];
export type Piece = { pileId: number; pieceId: number };
type Transfer = { pileId: number; pieceCount: number };

// An even number of pieces, at least two, and no more than the pile holds —
// half of them then go to the other pile. Both players draw on the same two
// piles, so whose turn it is does not enter into legality.
const isTransferAllowed = (board: Board, { pileId, pieceCount }: Transfer): boolean =>
  (pileId === 0 || pileId === 1)
    && Number.isInteger(pieceCount)
    && pieceCount >= 2
    && pieceCount % 2 === 0
    && pieceCount <= board[pileId];

export const moves = {
  moveHalvedPieces: {
    validate: (board: Board, _, piece: Transfer) => isTransferAllowed(board, piece),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { pileId, pieceCount }: Transfer): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] -= pieceCount;
      nextBoard[1 - pileId] += pieceCount / 2;
      const isGameEnd = isEqual(nextBoard, [1, 1]) || isEqual(nextBoard, [0, 1]) || isEqual(nextBoard, [1, 0]);
      if (isGameEnd) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
