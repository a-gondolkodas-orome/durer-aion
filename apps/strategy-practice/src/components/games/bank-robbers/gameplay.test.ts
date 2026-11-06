import { moves, type Board } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const isRobbable = moveValidator(moves.rob);

const board = (standing: boolean[]): Board => ({
  circle: standing,
  lastMove: null,
  firstMove: 0
});

describe('isRobbable', () => {
  it('accepts any standing bank while the circle is untouched', () => {
    const untouched = board(Array(7).fill(true));
    for (let i = 0; i < 7; i++) expect(isRobbable(untouched, i)).toBe(true);
  });

  it('refuses a bank that has already been robbed', () => {
    const b = board([true, false, true, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(false);
  });

  it('refuses a bank whose two neighbours are both gone — the police wait there', () => {
    const b = board([false, true, false, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(false);
    // Its own neighbours still standing, so this one is fine.
    expect(isRobbable(b, 4)).toBe(true);
  });

  it('accepts a bank with just one neighbour still standing', () => {
    const b = board([false, true, true, true, true, true, true]);
    expect(isRobbable(b, 1)).toBe(true);
  });

  it('treats the circle as a circle — index 0 and the last bank are neighbours', () => {
    const b = board([true, false, true, true, true, true, false]);
    // Bank 0's neighbours are 6 and 1, both robbed.
    expect(isRobbable(b, 0)).toBe(false);
  });

  it('refuses a bank that is not on the circle', () => {
    const b = board(Array(7).fill(true));
    expect(isRobbable(b, -1)).toBe(false);
    expect(isRobbable(b, 7)).toBe(false);
  });
});

// A bank can be robbed only while at least one of its two neighbours still
// stands, so the game ends as soon as every survivor is isolated.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when every standing bank is isolated', p => {
    // robbing bank 0 leaves only bank 1, whose neighbours (3 and 2) are both gone
    const outcome = moves.rob.apply(board([true, true, false, false]), asPlayer(p), 0);
    expect(outcome.nextBoard.circle).toEqual([false, true, false, false]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some bank still has a standing neighbour', () => {
    const outcome = moves.rob.apply(board([true, true, true, false]), asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
