import { moves } from './triangle-circle-game';
import { LINE, CIRCLE, generateStartBoard, applyShade, applyCircle } from './helpers';
import { TRIANGLES, TRIANGLE_COUNT } from './geometry';
import { makeEvents } from '../../../test-utils';

describe('moves.shadeEdge', () => {
  it('shades the edge and passes the turn', () => {
    const events = makeEvents();
    const { nextBoard } = moves.shadeEdge.legacyApply(generateStartBoard(), { events }, 0);
    expect(nextBoard.edges[0]).toBe(true);
    expect(events.endTurn).toHaveBeenCalled();
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the game for the line player when it completes an un-circled triangle', () => {
    const [e0, e1, e2] = TRIANGLES[0].edgeIds;
    const board = applyShade(applyShade(generateStartBoard(), e0), e1);
    const events = makeEvents();
    moves.shadeEdge.legacyApply(board, { events }, e2);
    expect(events.endGame).toHaveBeenCalledWith(LINE);
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('only passes the turn when the completed triangle is circled', () => {
    const [e0, e1, e2] = TRIANGLES[0].edgeIds;
    const board = applyCircle(applyShade(applyShade(generateStartBoard(), e0), e1), 0);
    const events = makeEvents();
    moves.shadeEdge.legacyApply(board, { events }, e2);
    expect(events.endTurn).toHaveBeenCalled();
    expect(events.endGame).not.toHaveBeenCalled();
  });
});

describe('moves.placeCircle', () => {
  it('places the circle and passes the turn', () => {
    const events = makeEvents();
    const { nextBoard } = moves.placeCircle.legacyApply(generateStartBoard(), { events }, 7);
    expect(nextBoard.circles[7]).toBe(true);
    expect(events.endTurn).toHaveBeenCalled();
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the game for the circle player when the last triangle gets circled', () => {
    const circles = new Array(TRIANGLE_COUNT).fill(true);
    circles[12] = false;
    const events = makeEvents();
    moves.placeCircle.legacyApply({ edges: generateStartBoard().edges, circles }, { events }, 12);
    expect(events.endGame).toHaveBeenCalledWith(CIRCLE);
    expect(events.endTurn).not.toHaveBeenCalled();
  });
});
