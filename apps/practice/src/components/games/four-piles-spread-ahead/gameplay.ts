import { random, cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = number[];
export type Piece = { pileId: number; pieceId: number };

export const generateStartBoard = (): Board => ([random(0, 9), random(0, 9), random(0, 9), random(4, 9)]);
export const generateTestStartBoard = (): Board => ([random(0, 6), random(0, 6), random(0, 6), random(4, 6)]);

// A move takes `pieceCount` pieces off pile `pileId` and puts one on each of the
// `pieceCount` piles immediately in front of it, so it can never reach past the
// first pile — hence the cap at `pileId`.
const isSpreadAllowed = (board: Board, pileId: number, pieceCount: number): boolean =>
  Number.isInteger(pileId) && pileId >= 0 && pileId < board.length
    && Number.isInteger(pieceCount)
    && pieceCount >= 1
    && pieceCount <= pileId
    && pieceCount <= board[pileId];

export const moves = {
  spreadPieces: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSpreadAllowed(board, pileId, pieceCount),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { pileId, pieceCount }: { pileId: number; pieceCount: number }
    ): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] = board[pileId] - pieceCount;
      for (let i = pileId - pieceCount; i < pileId; i++) {
        nextBoard[i] = board[i] + 1;
      }
      const isGameEnd = nextBoard[1]===0 && nextBoard[2]===0 && nextBoard[3]===0;
      if (isGameEnd) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
