import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { EDGES, TRIANGLES, TRIANGLE_COUNT, EDGE_COUNT } from './geometry';

// Board state. `edges[e]` is true once the line player has shaded edge e;
// `circles[t]` is true once the circle player has dropped a circle into
// triangle t. Both are dense boolean arrays indexed by the ids from geometry.ts.
export interface Board {
  edges: boolean[];
  circles: boolean[];
}

export const LINE = 0;
export const CIRCLE = 1;

export const generateStartBoard = (): Board => ({
  edges: new Array(EDGE_COUNT).fill(false),
  circles: new Array(TRIANGLE_COUNT).fill(false)
});

// How many of a triangle's three edges are shaded.
export const shadedCount = (board: Board, triangleId: number): number =>
  TRIANGLES[triangleId].edgeIds.reduce((sum, e) => sum + (board.edges[e] ? 1 : 0), 0);

// The line player wins the moment some triangle is fully shaded yet has no
// circle in it.
export const isLineWin = (board: Board): boolean =>
  TRIANGLES.some(t => !board.circles[t.id] && shadedCount(board, t.id) === 3);

// The circle player wins once every triangle holds a circle.
export const isCircleWin = (board: Board): boolean => board.circles.every(Boolean);

// Ids of the edges the line player may still shade.
export const freeEdges = (board: Board): number[] => {
  const result: number[] = [];
  for (let e = 0; e < EDGE_COUNT; e++) if (!board.edges[e]) result.push(e);
  return result;
};

// Ids of the triangles the circle player may still fill.
export const freeTriangles = (board: Board): number[] => {
  const result: number[] = [];
  for (let t = 0; t < TRIANGLE_COUNT; t++) if (!board.circles[t]) result.push(t);
  return result;
};

export const applyShade = (board: Board, edgeId: number): Board => {
  const edges = board.edges.slice();
  edges[edgeId] = true;
  return { edges, circles: board.circles };
};

export const applyCircle = (board: Board, triangleId: number): Board => {
  const circles = board.circles.slice();
  circles[triangleId] = true;
  return { edges: board.edges, circles };
};

// --- Threat vocabulary shared by the board UI and the bot ------------------
//
// The game reduces to a threat race. After the line player moves, they win at
// once if a triangle is complete-and-uncircled; failing that they win on the
// next turn if two or more triangles each have two shaded edges and no circle
// (a "double threat" — the circle player can only cover one). So a triangle
// with exactly two shaded edges and no circle is a live threat the circle
// player must neutralise immediately.

// Un-circled triangles with exactly two shaded edges: the line player completes
// any of these on their next move.
export const liveThreats = (board: Board): number[] =>
  freeTriangles(board).filter(t => shadedCount(board, t) === 2);

// A free edge whose two adjacent triangles are both un-circled and each already
// carry exactly one shaded edge. Shading such an edge turns both into live
// threats at once — an immediate double threat — so on the circle player's turn
// these are the real danger, one move earlier than a live threat.
export const preThreatEdges = (board: Board): number[] =>
  freeEdges(board).filter(e => {
    const tris = EDGES[e].triangleIds;
    return tris.length === 2 && tris.every(t => !board.circles[t] && shadedCount(board, t) === 1);
  });

// Does shading `edgeId` immediately win for the line player?
export const isWinningShade = (board: Board, edgeId: number): boolean =>
  EDGES[edgeId].triangleIds.some(
    t => !board.circles[t] && shadedCount(board, t) === 2
  );

// Each move belongs to exactly one role, so both validators check who is on
// turn: shading is not a thing the circle player can do at all. Beyond that the
// two players never compete for the same resource — the line player only shades
// edges, the circle player only fills triangles — so "still free" is the whole
// of legality on both sides.
export const moves = {
  // Line player shades one edge; they win at once if it completes an un-circled
  // triangle, otherwise the turn passes.
  shadeEdge: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, edgeId: number) =>
      ctx.currentPlayer === LINE
        && Number.isInteger(edgeId) && edgeId >= 0 && edgeId < EDGE_COUNT
        && !board.edges[edgeId],
    apply: (board: Board, _, edgeId: number): MoveOutcome<Board> => {
      const nextBoard = applyShade(board, edgeId);
      if (isLineWin(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: LINE } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  // Circle player drops a circle into one triangle; they win once every triangle
  // is circled, otherwise the turn passes.
  placeCircle: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, triangleId: number) =>
      ctx.currentPlayer === CIRCLE
        && Number.isInteger(triangleId) && triangleId >= 0 && triangleId < TRIANGLE_COUNT
        && !board.circles[triangleId],
    apply: (board: Board, _, triangleId: number): MoveOutcome<Board> => {
      const nextBoard = applyCircle(board, triangleId);
      if (isCircleWin(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: CIRCLE } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
