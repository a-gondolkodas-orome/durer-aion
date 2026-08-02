import { moves } from './triangle-circle-game';
import { LINE, CIRCLE, generateStartBoard, applyShade, applyCircle } from './helpers';
import { TRIANGLES, TRIANGLE_COUNT } from './geometry';
import { makeCtx } from '../../../test-utils';

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
