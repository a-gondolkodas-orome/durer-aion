import { sum, isEqual, random, cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { isPlacementAllowed } from '../gameplay';

export type Board = number[]
export type TurnState = { firstPlacedSquareIndex: number } | null

export const generateStartBoard = (): Board => {
  const board = Array(5).fill(0);
  const x = random(4);
  board[x] += 1;
  return board;
};

export const moves = {
  addPiece: {
    validate: (board: Board, _, pileId: number) => isPlacementAllowed(board, pileId),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileId: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] += 1;
      // The second player places two squares at a time, so on the first half of
      // such a turn the turn stays open and the placement is remembered for the
      // BoardClient to dim.
      if (ctx.currentPlayer === 1 && [3, 6, 9].includes(sum(nextBoard))) {
        return { nextBoard, nextTurnState: { firstPlacedSquareIndex: pileId } };
      }
      if (sum(nextBoard) === 10) {
        const winnerIndex = isEqual(cloneDeep(nextBoard).sort(), [0, 1, 2, 3, 4]) ? 1 : 0;
        return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex } };
      }
      return { nextBoard, nextTurnState: null, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
