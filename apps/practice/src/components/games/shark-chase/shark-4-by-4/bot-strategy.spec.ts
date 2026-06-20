import { getNextSharkPositionByAI } from './bot-strategy';
import type { Board } from './shark-chase';

const makeBoard = (submarines: number[], shark: number, turn: number): Board => ({
  submarines, shark, turn, sharkMovesInTurn: 0
});

describe('getNextSharkPositionByAI', () => {
  it('avoid losing in next step if possible', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 4;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('avoid losing in next step by staying in place', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v1', () => {
    const submarines = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 1,
      0, 0, 1, 0
    ];
    const shark = 15;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(15);
  });

  it('stays in place if instant losing otherwise: v2', () => {
    const submarines = [
      0, 0, 1, 0,
      0, 0, 0, 1,
      1, 0, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 3;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(3);
  });

  it('stays in place if instant losing otherwise: v3', () => {
    const submarines = [
      0, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0,
      0, 1, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(0);
  });

  it('stays in place if instant losing otherwise: v4', () => {
    const submarines = [
      0, 1, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 0,
      0, 1, 0, 0
    ];
    const shark = 12;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 1));
    expect(position).toEqual(12);
  });

  it('picks the move that guarantees survival rather than the old heuristic\'s losing pick (regression)', () => {
    // From here, the old component-size + center>edge>corner heuristic deterministically
    // picked cell 2 (its only candidate), which loses by force in a few turns. Cell 14 is
    // the actual winning move (verified by exhaustive game-tree search).
    const submarines = [
      0, 0, 0, 0,
      0, 0, 0, 2,
      0, 1, 0, 0,
      0, 0, 0, 0
    ];
    const shark = 10;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 6));
    expect(position).toEqual(14);
  });
});
