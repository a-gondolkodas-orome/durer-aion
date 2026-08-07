import { range } from 'lodash';
import type { Ctx } from 'strategy-game-factory';

// The board is the K(2,3) bipartite graph of 5 fields, holding coin counts.
// Indices 0=A, 1=B are the two "hub" fields (side 1, each adjacent to all of
// C, D, E); indices 2=C, 3=D, 4=E are the three fields on side 2, each adjacent
// to A and B.
export type Board = number[];

export const side1 = [0, 1];
export const side2 = [2, 3, 4];

export const neighbours: Record<number, number[]> = {
  0: side2,
  1: side2,
  2: side1,
  3: side1,
  4: side1
};

// A field can receive a coin iff it is joined by a line to a field holding the
// same number of coins. Anything that is not a field of the graph is rejected
// rather than looked up.
export const isNodePlayable = (board: Board, node: number): boolean =>
  neighbours[node] !== undefined
    && neighbours[node].some((other) => board[other] === board[node]);

export const legalNodes = (board: Board): number[] =>
  range(5).filter((node) => isNodePlayable(board, node));

export const hasAnyMove = (board: Board): boolean =>
  legalNodes(board).length > 0;

export const generateStartBoard = (): Board => [0, 0, 0, 0, 0];

export const moves = {
  placeCoin: {
    validate: (board: Board, _, node: number) => isNodePlayable(board, node),
    apply: (board: Board, { ctx }: { ctx: Ctx }, node: number) => {
      const nextBoard = board.slice();
      nextBoard[node] += 1;
      // The player who places the last coin wins: the game ends when no line has
      // equal endpoints, i.e. when the mover just made all further moves impossible.
      if (!hasAnyMove(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
