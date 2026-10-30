import { cloneDeep, range } from 'lodash';
import type { MoveDefs, MoveOutcome } from 'strategy-game-factory';

export const BOARD_SIZE = 5;

export type Mark = 'X' | 'O';

// The two categories play the same game and differ only in who moves first: in C
// the first player places the Xs, in D and E the Os.
export interface Board { cells: (Mark | null)[]; firstMark: Mark }

// How many Xs the X player has placed so far this turn.
export interface TurnState { xsPlaced: number }

const emptyCells = (): (Mark | null)[] => Array(BOARD_SIZE * BOARD_SIZE).fill(null);

export const startBoardXFirst: Board = { cells: emptyCells(), firstMark: 'X' };
export const startBoardOFirst: Board = { cells: emptyCells(), firstMark: 'O' };

export const markOf = (board: Board, playerIndex: number): Mark =>
  (playerIndex === 0) === (board.firstMark === 'X') ? 'X' : 'O';

export const playerOf = (board: Board, mark: Mark): number => markOf(board, 0) === mark ? 0 : 1;

export const lines: number[][] = range(BOARD_SIZE).flatMap(i => [
  range(BOARD_SIZE).map(j => i * BOARD_SIZE + j),
  range(BOARD_SIZE).map(j => j * BOARD_SIZE + i)
]);

export const winningLine = (cells: Board['cells']): number[] | undefined =>
  lines.find(line => line.every(id => cells[id] === 'X'));

export const isEmptyCell = (board: Board, id: number): boolean =>
  Number.isInteger(id) && id >= 0 && id < board.cells.length && board.cells[id] === null;

export const moves = {
  placeMark: {
    validate: (board, _, id: number) => isEmptyCell(board, id),
    // X places two marks a turn and O one. A full board ends the game even after
    // the first of the two Xs, and so does a line completed by it.
    apply: (board, { ctx }, id: number): MoveOutcome<Board, TurnState> => {
      const mark = markOf(board, ctx.currentPlayer!);
      const nextBoard = cloneDeep(board);
      nextBoard.cells[id] = mark;
      if (winningLine(nextBoard.cells)) {
        return { nextBoard, gameEnd: { winnerIndex: playerOf(board, 'X') } };
      }
      if (nextBoard.cells.every(cell => cell !== null)) {
        return { nextBoard, gameEnd: { winnerIndex: playerOf(board, 'O') } };
      }
      const xsPlaced = mark === 'X' ? (ctx.turnState?.xsPlaced ?? 0) + 1 : 0;
      if (mark === 'X' && xsPlaced < 2) {
        return { nextBoard, nextTurnState: { xsPlaced } };
      }
      return { nextBoard, isTurnEnd: true, nextTurnState: null };
    }
  }
} satisfies MoveDefs<Board, TurnState>;

export type Moves = typeof moves;
