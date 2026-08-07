import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { range, cloneDeep, random, sample } from 'lodash';

export type Board = { circle: boolean[], lastMove: number | null, firstMove: number | null }

export const moves = {
  rob: {
    validate: (board: Board, _, index: number) => isRobbable(board, index),
    apply: (board: Board, { ctx }: { ctx: Ctx }, index: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      // so that ai strategy can be simpler: first move is always the same
      const transformedMove = board.firstMove === null ? 0 : index;
      if (board.firstMove === null) {
        nextBoard.firstMove = index;
      }
      nextBoard.lastMove = transformedMove;
      nextBoard.circle[transformedMove] = false;
      if (getAllowedBanks(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;

// A bank may be robbed while it still stands and at least one of its two
// neighbours does too — a bank whose neighbours are both gone has police lying
// in wait. Both gangs rob from the same circle, so whose turn it is does not
// enter into legality.
export const isRobbable = (board: Board, index: number): boolean =>
  getAllowedBanks(board).includes(index);

export const getAllowedBanks = (board: Board) => {
  return range(board.circle.length).filter(i => {
    return board.circle[i] && (board.circle.at(i-1) || board.circle[(i+1)%board.circle.length]);
  })
}

export const generateStartBoard = (): Board => {
  const n = random(0, 2) === 0 ? sample([8, 10])! : sample([7, 9])!;
  return {
    circle: Array(n).fill(true),
    lastMove: null,
    firstMove: null
  }
}
