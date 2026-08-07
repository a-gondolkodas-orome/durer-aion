import { isPile, moves, type TurnState } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isMergeAllowed = moveValidator(moves.mergePiles);

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx<TurnState>({ currentPlayer }) });

describe('isPile', () => {
  const board = [3, 2, 5];

  it('accepts every pile on the table', () => {
    expect(isPile(board, 0)).toBe(true);
    expect(isPile(board, 2)).toBe(true);
  });

  it('refuses an index off the table', () => {
    expect(isPile(board, 3)).toBe(false);
    expect(isPile(board, -1)).toBe(false);
    expect(isPile(board, 1.5)).toBe(false);
  });

  it('refuses everything once the table is empty', () => {
    expect(isPile([], 0)).toBe(false);
  });
});

describe('isMergeAllowed', () => {
  const board = [3, 2, 5];

  it('accepts two different piles, in either order', () => {
    expect(isMergeAllowed(board, [0, 1])).toBe(true);
    expect(isMergeAllowed(board, [1, 0])).toBe(true);
    expect(isMergeAllowed(board, [0, 2])).toBe(true);
  });

  it('refuses merging a pile with itself', () => {
    expect(isMergeAllowed(board, [1, 1])).toBe(false);
  });

  it('refuses a pile that is not on the table', () => {
    expect(isMergeAllowed(board, [0, 3])).toBe(false);
    expect(isMergeAllowed(board, [-1, 0])).toBe(false);
  });

  it('refuses anything that is not a pair of piles', () => {
    expect(isMergeAllowed(board, [0])).toBe(false);
    expect(isMergeAllowed(board, [0, 1, 2])).toBe(false);
  });

  it('refuses a merge on a single-pile table — there is nothing to merge with', () => {
    expect(isMergeAllowed([4], [0, 1])).toBe(false);
  });
});

// Taking the last match wins. Merging two piles can never end the game — it
// always leaves at least one pile behind.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on taking the last match', player => {
    const outcome = moves.removeOne.apply([1], asPlayer(player), 0);
    expect(outcome.nextBoard).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('drops an emptied pile without ending the game while others remain', () => {
    const outcome = moves.removeOne.apply([1, 2], asPlayer(0), 0);
    expect(outcome.nextBoard).toEqual([2]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a merge — a merge always leaves a pile', () => {
    const outcome = moves.mergePiles.apply([1, 1], asPlayer(0), [0, 1]);
    expect(outcome.nextBoard).toEqual([2]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
