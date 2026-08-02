import { moves } from './cube-coloring';
import { generateStartBoard, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// The first player wants all eight vertices coloured; the second wants the
// colouring to get stuck first. The move reads no ctx, so the winner is fixed
// by the resulting position.
const meta = { ctx: makeCtx() };

// Vertices 0-3 are the front face, 4-7 the back, i is joined to i+4, and 2-4 is
// the drawn diagonal.
describe('end of game', () => {
  it('gives the game to the first player when the last vertex gets coloured', () => {
    const board: Board = ['red', 'blue', 'yellow', 'blue', 'blue', 'red', 'blue', ''];
    // 7 neighbours 6, 4 and 3, all blue, so red fits
    const outcome = moves.colorVertex.apply(board, meta, { vertex: 7, color: 'red' });
    expect(outcome.nextBoard)
      .toEqual(['red', 'blue', 'yellow', 'blue', 'blue', 'red', 'blue', 'red']);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the second player when the colouring gets stuck', () => {
    const board: Board = ['', 'red', '', 'blue', 'yellow', 'blue', 'yellow', ''];
    const outcome = moves.colorVertex.apply(board, meta, { vertex: 7, color: 'red' });
    // 0 (neighbours 1, 3, 4) and 2 (neighbours 1, 3, 4, 6) each face all three
    // colours, so the cube is stuck two vertices short
    expect(outcome.nextBoard).toEqual(['', 'red', '', 'blue', 'yellow', 'blue', 'yellow', 'red']);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while a colour still fits somewhere', () => {
    const outcome = moves.colorVertex.apply(
      generateStartBoard(), meta, { vertex: 0, color: 'red' }
    );
    expect(outcome.nextBoard).toEqual(['red', '', '', '', '', '', '', '']);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
