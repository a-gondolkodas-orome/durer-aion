import { EDGES, TRIANGLES, TRIANGLE_COUNT } from './geometry';
import {
  CIRCLE,
  LINE,
  applyCircle,
  applyShade,
  freeEdges,
  freeTriangles,
  generateStartBoard,
  isCircleWin,
  isLineWin,
  isWinningShade,
  liveThreats,
  moves,
  preThreatEdges,
  shadedCount,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from '../../../test-utils';

const isShadeAllowed = moveValidator(moves.shadeEdge, makeCtx({ currentPlayer: LINE }));
const isCirclePlacementAllowed = moveValidator(moves.placeCircle, makeCtx({ currentPlayer: CIRCLE }));

// Shade the three edges of a triangle on a fresh board.
const boardWithFullTriangle = (t: number): Board => {
  let board = generateStartBoard();
  for (const e of TRIANGLES[t].edgeIds) board = applyShade(board, e);
  return board;
};

// An interior edge and its two triangles, each given one *other* shaded edge —
// i.e. a pre-threat edge: shading it makes both triangles live threats at once.
const preThreatSetup = () => {
  const edge = EDGES.find(e => e.triangleIds.length === 2)!;
  const [t1, t2] = edge.triangleIds;
  const otherEdge = (t: number) => TRIANGLES[t].edgeIds.find(e => e !== edge.id)!;
  let board = generateStartBoard();
  board = applyShade(board, otherEdge(t1));
  board = applyShade(board, otherEdge(t2));
  return { board, edge: edge.id, t1, t2 };
};

describe('start board', () => {
  it('has no shaded edges and no circles', () => {
    const board = generateStartBoard();
    expect(board.edges).toHaveLength(63);
    expect(board.circles).toHaveLength(36);
    expect(board.edges.some(Boolean)).toBe(false);
    expect(board.circles.some(Boolean)).toBe(false);
    expect(freeEdges(board)).toHaveLength(63);
    expect(freeTriangles(board)).toHaveLength(36);
  });
});

describe('win detection', () => {
  it('line wins when a triangle is fully shaded and un-circled', () => {
    const board = boardWithFullTriangle(0);
    expect(shadedCount(board, 0)).toBe(3);
    expect(isLineWin(board)).toBe(true);
  });

  it('a circled triangle can no longer be won by the line player', () => {
    const board = applyCircle(boardWithFullTriangle(0), 0);
    expect(isLineWin(board)).toBe(false);
  });

  it('circle wins only once every triangle is circled', () => {
    let board = generateStartBoard();
    expect(isCircleWin(board)).toBe(false);
    board = { edges: board.edges, circles: new Array(36).fill(true) };
    expect(isCircleWin(board)).toBe(true);
  });

  it('a nearly-complete circle board is not yet a win', () => {
    const circles = new Array(36).fill(true);
    circles[17] = false;
    expect(isCircleWin({ edges: generateStartBoard().edges, circles })).toBe(false);
  });
});

describe('threat vocabulary', () => {
  it('isWinningShade is true exactly for the third edge of an un-circled 2-edge triangle', () => {
    const t = 5;
    const [e0, e1, e2] = TRIANGLES[t].edgeIds;
    let board = generateStartBoard();
    board = applyShade(board, e0);
    board = applyShade(board, e1);
    expect(isWinningShade(board, e2)).toBe(true);
    // Circling the triangle removes the win.
    expect(isWinningShade(applyCircle(board, t), e2)).toBe(false);
  });

  it('a 2-edge un-circled triangle is a live threat; circling it clears the threat', () => {
    const t = 5;
    const [e0, e1] = TRIANGLES[t].edgeIds;
    let board = applyShade(applyShade(generateStartBoard(), e0), e1);
    expect(liveThreats(board)).toContain(t);
    board = applyCircle(board, t);
    expect(liveThreats(board)).not.toContain(t);
  });

  it('detects a pre-threat edge and stops treating it as one once a partner is circled', () => {
    const { board, edge, t1 } = preThreatSetup();
    expect(liveThreats(board)).toHaveLength(0);
    expect(preThreatEdges(board)).toContain(edge);
    // Shading the pre-threat edge yields a genuine double threat.
    expect(liveThreats(applyShade(board, edge)).length).toBeGreaterThanOrEqual(2);
    // Circling one partner defuses it.
    expect(preThreatEdges(applyCircle(board, t1))).not.toContain(edge);
  });

  it('allows shading a free edge and refuses an already shaded or non-existent one', () => {
    const board = applyShade(generateStartBoard(), 3);
    expect(isShadeAllowed(board, 4)).toBe(true);
    expect(isShadeAllowed(board, 3)).toBe(false);
    expect(isShadeAllowed(board, -1)).toBe(false);
    expect(isShadeAllowed(board, EDGES.length)).toBe(false);
  });

  it('allows circling a free triangle and refuses an already circled or non-existent one', () => {
    const board = applyCircle(generateStartBoard(), 2);
    expect(isCirclePlacementAllowed(board, 1)).toBe(true);
    expect(isCirclePlacementAllowed(board, 2)).toBe(false);
    expect(isCirclePlacementAllowed(board, -1)).toBe(false);
    expect(isCirclePlacementAllowed(board, TRIANGLES.length)).toBe(false);
  });

  it('agrees with the free-edge and free-triangle listings', () => {
    const board = applyCircle(applyShade(generateStartBoard(), 3), 2);
    expect(freeEdges(board).every(e => isShadeAllowed(board, e))).toBe(true);
    expect(freeTriangles(board).every(t => isCirclePlacementAllowed(board, t))).toBe(true);
  });
});

const meta = { ctx: makeCtx() };

describe('moves.shadeEdge', () => {
  it('shades the edge and passes the turn', () => {
    const outcome = moves.shadeEdge.apply(generateStartBoard(), meta, 0);
    expect(outcome.nextBoard.edges[0]).toBe(true);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('ends the game for the line player when it completes an un-circled triangle', () => {
    const [e0, e1, e2] = TRIANGLES[0].edgeIds;
    const board = applyShade(applyShade(generateStartBoard(), e0), e1);
    const outcome = moves.shadeEdge.apply(board, meta, e2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: LINE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('only passes the turn when the completed triangle is circled', () => {
    const [e0, e1, e2] = TRIANGLES[0].edgeIds;
    const board = applyCircle(applyShade(applyShade(generateStartBoard(), e0), e1), 0);
    const outcome = moves.shadeEdge.apply(board, meta, e2);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });
});

describe('moves.placeCircle', () => {
  it('places the circle and passes the turn', () => {
    const outcome = moves.placeCircle.apply(generateStartBoard(), meta, 7);
    expect(outcome.nextBoard.circles[7]).toBe(true);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('ends the game for the circle player when the last triangle gets circled', () => {
    const circles = new Array(TRIANGLE_COUNT).fill(true);
    circles[12] = false;
    const board = { edges: generateStartBoard().edges, circles };
    const outcome = moves.placeCircle.apply(board, meta, 12);
    expect(outcome.gameEnd).toEqual({ winnerIndex: CIRCLE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
