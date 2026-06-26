import { getNextSharkPositionByAI } from './bot-strategy';
import type { Board } from './shark-chase';

const makeBoard = (submarines: number[], shark: number, turn: number): Board => ({
  submarines, shark, turn, sharkMovesInTurn: 0
});

describe('getNextSharkPositionByAI', () => {
  it('picks the move that guarantees survival rather than the old heuristic\'s losing pick (regression)', () => {
    // From here, the old component-size + location-preference heuristic deterministically
    // picked cell 3 (its only candidate), which loses by force. Cell 7 is the actual
    // winning move (verified by exhaustive game-tree search).
    const submarines = [
      0, 1, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 1, 2,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ];
    const shark = 2;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 12));
    expect(position).toEqual(7);
  });

  it('uses the precomputed exception table for early turns instead of the live search', () => {
    // Turn 8 is within PRECOMPUTE_MAX_TURN, so this must resolve via table lookup, not
    // the (multi-second, on early turns) exact search. The plain heuristic alone would
    // pick cell 2 here; the table overrides it with the actual winning move, 5.
    const submarines = [
      0, 0, 0, 0, 1,
      0, 0, 0, 0, 0,
      0, 1, 0, 1, 1,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ];
    const shark = 0;
    const position = getNextSharkPositionByAI(makeBoard(submarines, shark, 8));
    expect(position).toEqual(5);
  });
});
