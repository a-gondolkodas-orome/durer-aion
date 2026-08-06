import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { range } from 'lodash';

// The board is a 4-field graph holding coin counts: K4 minus one edge. Indices
// 0=A, 1=B are the two "hub" fields (degree 3, adjacent to each other and to both
// C, D); indices 2=C, 3=D are the two degree-2 fields, each adjacent only to A
// and B (C and D are NOT joined).
export type Board = number[];

export const hubs = [0, 1];
export const others = [2, 3];

export const neighbours: Record<number, number[]> = {
  0: [1, 2, 3],
  1: [0, 2, 3],
  2: [0, 1],
  3: [0, 1]
};

// A field can receive a coin in two ways: it is empty (place a coin on any empty
// field), or it is joined by a line to a field holding the same number of coins
// (add a coin to one end of an equal-valued line). Anything that is not a field
// of the graph is rejected rather than looked up.
export const isNodePlayable = (board: Board, node: number): boolean =>
  neighbours[node] !== undefined
    && (board[node] === 0 || neighbours[node].some((other) => board[other] === board[node]));

export const legalNodes = (board: Board): number[] =>
  range(4).filter((node) => isNodePlayable(board, node));

// The game ends when no field is empty and no line has equal endpoints, i.e.
// when there is no legal move left.
export const hasAnyMove = (board: Board): boolean =>
  legalNodes(board).length > 0;

export const moves = {
  placeCoin: {
    validate: (board: Board, _, node: number) => isNodePlayable(board, node),
    apply: (board: Board, { ctx }: { ctx: Ctx }, node: number): MoveOutcome<Board> => {
      const nextBoard = board.slice();
      nextBoard[node] += 1;
      if (!hasAnyMove(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
