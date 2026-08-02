import { moves } from './recolouring-discs';
import { RED, BLUE, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// Red wins on strictly more than half the cells, blue on half or more; if
// neither gets there within 200 plies the game is awarded to blue.
const at = (currentPlayer: number, moveCount = 0) =>
  ({ ctx: makeCtx({ currentPlayer, moveCount }) });

const board = (cells: Board['cells']): Board => ({ cells });

describe('end of game', () => {
  it('ends for red once red holds more than half the cells', () => {
    // 3 of 4 red — red needs 3 (2*3 > 4)
    const outcome = moves.pass.apply(board(['red', 'red', 'red', 'blue']), at(RED));
    expect(outcome.gameEnd).toEqual({ winnerIndex: RED });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends for blue once blue holds half the cells', () => {
    // 2 of 4 blue is already enough (2*2 >= 4)
    const outcome = moves.pass.apply(board(['red', null, 'blue', 'blue']), at(BLUE));
    expect(outcome.gameEnd).toEqual({ winnerIndex: BLUE });
  });

  it('passes the turn while neither side has its majority', () => {
    const outcome = moves.pass.apply(board(['red', null, null, 'blue', null, null]), at(RED));
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('awards a stalled game to blue on the 200th ply', () => {
    const cells = board(['red', null, null, 'blue', null, null]);
    expect(moves.pass.apply(cells, at(RED, 198)).gameEnd).toBeUndefined();
    expect(moves.pass.apply(cells, at(RED, 199)).gameEnd).toEqual({ winnerIndex: BLUE });
  });
});
