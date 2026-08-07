import { sum, isEqual, cloneDeep } from 'lodash';
import type { MoveOutcome } from 'strategy-game-factory';
import { isPlacementAllowed } from '../gameplay';

export type Board = number[]

export const generateStartBoard = (): Board => [0, 0, 0, 0];

export const moves = {
  addPiece: {
    validate: (board: Board, _, pileId: number) => isPlacementAllowed(board, pileId),
    apply: (board: Board, _, pileId: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[pileId] += 1;
      if (sum(nextBoard) === 6) {
        const winnerIndex = isEqual(cloneDeep(nextBoard).sort(), [0, 1, 2, 3]) ? 1 : 0;
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
