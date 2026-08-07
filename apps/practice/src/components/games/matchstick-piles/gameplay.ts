import { range, random } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

// A board is the list of pile sizes; every pile has at least one match.
export type Board = number[];

const isPileId = (board: Board, pileId: number): boolean =>
  Number.isInteger(pileId) && pileId >= 0 && pileId < board.length;

// Empty piles are dropped from the board, so every pile has a match to give up.
export const isRemovalAllowed = (board: Board, pileId: number): boolean =>
  isPileId(board, pileId) && board[pileId] >= 1;

// A split has to leave both halves non-empty.
export const isSplitAllowed = (board: Board, pileId: number, firstPart: number): boolean =>
  isPileId(board, pileId)
    && Number.isInteger(firstPart)
    && firstPart >= 1
    && firstPart <= board[pileId] - 1;

export const moves = {
  removeMatch: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileId: number): MoveOutcome<Board> => {
      const nextBoard = board
        .map((n, i) => (i === pileId ? n - 1 : n))
        .filter(n => n > 0);
      if (nextBoard.length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  splitPile: {
    validate: (board: Board, _, pileId: number, firstPart: number) =>
      isSplitAllowed(board, pileId, firstPart),
    apply: (board: Board, _, pileId: number, firstPart: number): MoveOutcome<Board> => {
      const size = board[pileId];
      const nextBoard = board.flatMap((n, i) =>
        i === pileId ? [firstPart, size - firstPart] : [n]
      );
      // A split never empties the board, so it can only ever end the turn.
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const generateStartBoard = (): Board => range(random(2, 3)).map(() => random(2, 6));
