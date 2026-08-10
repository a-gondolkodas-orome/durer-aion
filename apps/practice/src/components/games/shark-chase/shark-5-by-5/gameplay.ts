import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { cloneDeep } from 'lodash';
import { RESEARCHERS, SHARK, isSharkMoveAllowed, isSubmarineMoveAllowed, type Board } from '../gameplay';

// The shark wins by surviving to the end of day 15.
export const MAX_TURN = 15;

export const isGameEnd = (board: Board): boolean =>
  board.submarines[board.shark] >= 1 || board.turn > MAX_TURN;

export const getWinnerIndex = (board: Board): number =>
  board.submarines[board.shark] >= 1 ? 0 : 1;

export const startBoard: Board = {
submarines: [
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0]
].flat(),
shark: 20,
turn: 1,
sharkMovesInTurn: 0
};

export const moves = {
  moveSubmarine: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, move: { from: number; to: number }) =>
      ctx.currentPlayer === RESEARCHERS && !!move && isSubmarineMoveAllowed(board, move.from, move.to),
    apply: (
      board: Board, _, { from, to }: { from: number; to: number }
    ): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.submarines[from] -= 1;
      nextBoard.submarines[to] += 1;
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: getWinnerIndex(nextBoard) } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  moveShark: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, to: number) =>
      ctx.currentPlayer === SHARK && isSharkMoveAllowed(board, to),
    apply: (board: Board, _, to: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.shark = to;

      const isAnotherSharkMoveAllowed = (
        board.submarines[to] === 0 &&
          to !== board.shark &&
          board.sharkMovesInTurn === 0
      );
      // A free first step earns a second one, so the turn stays open.
      if (isAnotherSharkMoveAllowed) {
        nextBoard.sharkMovesInTurn = 1;
        return { nextBoard };
      }

      nextBoard.turn += 1;
      nextBoard.sharkMovesInTurn = 0;
      if (isGameEnd(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: getWinnerIndex(nextBoard) } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
