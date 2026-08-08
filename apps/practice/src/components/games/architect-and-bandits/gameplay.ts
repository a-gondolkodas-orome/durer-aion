import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

// Both variants play the same game on a regular polygon, differing only in how
// many vertices the wall has and how far the architect may walk in a day.
export type Board = { architectPosition: number; towers: boolean[]; day: number; kmUsedToday: number }

// The two players have disjoint move sets, so which of them is to move is part
// of a move's legality rather than merely of whose turn it is.
export const ARCHITECT = 0;
export const BANDITS = 1;

export const KM_PER_EDGE = 10;

const isVertex = (board: Board, vertex: number): boolean =>
  Number.isInteger(vertex) && vertex >= 0 && vertex < board.towers.length;

// The architect walks the wall one edge at a time, so a step is legal when the
// target is a neighbouring vertex and the day's allowance still covers an edge.
export const isArchitectStepAllowed = (board: Board, targetVertex: number, kmPerDay: number): boolean => {
  if (!isVertex(board, targetVertex)) return false;
  if (board.kmUsedToday + KM_PER_EDGE > kmPerDay) return false;
  const gap = Math.abs(targetVertex - board.architectPosition);
  return gap === 1 || gap === board.towers.length - 1; // neighbours, wrapping round
};

export const makeStartBoard = (vertexCount: number) => (): Board => {
  const towers = Array(vertexCount).fill(false);
  /*
  Workaround to have a tower at the start of day 1, as startOfTurnMove or
  similar is not supported by framework.
  */
  towers[0] = true;
  return {
    architectPosition: 0,
    towers,
    day: 1,
    kmUsedToday: 0
  };
};

export const makeMoves = (kmPerDay: number) => ({
  moveArchitect: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, targetVertex: number) =>
      ctx.currentPlayer === ARCHITECT && isArchitectStepAllowed(board, targetVertex, kmPerDay),
    // The architect keeps walking within the day, so the turn stays open until
    // `endDay`.
    apply: (board: Board, _, targetVertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.architectPosition = targetVertex;
      nextBoard.towers[targetVertex] = true;
      nextBoard.kmUsedToday += KM_PER_EDGE;
      return { nextBoard };
    }
  },

  endDay: {
    validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.currentPlayer === ARCHITECT,
    apply: (board: Board): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.kmUsedToday = 0;
      if (board.day === 4) {
        const allTowers = nextBoard.towers.every(t => t);
        return { nextBoard, gameEnd: { winnerIndex: allTowers ? ARCHITECT : BANDITS } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  destroyTower: {
    // The bandits knock down one standing tower each night.
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === BANDITS && isVertex(board, vertex) && board.towers[vertex],
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.towers[vertex] = false;
      return { nextBoard, autoEndOfTurn: true };
    }
  },
  startNextDay: {
    apply: (board: Board): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.day += 1;
      nextBoard.kmUsedToday = 0;
      nextBoard.towers[nextBoard.architectPosition] = true;
      return { nextBoard, isTurnEnd: true };
    }
  }
});

export type Moves = ReturnType<typeof makeMoves>;
