import { isRemovalAllowed, isSplitAllowed, moves, type Board } from './gameplay';
import { makeCtx } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board: Board = [1, 3, 5];

describe('isRemovalAllowed', () => {
  it('allows taking a match from any pile', () => {
    expect([0, 1, 2].every(pileId => isRemovalAllowed(board, pileId))).toBe(true);
  });

  it('rejects a pile id outside the board', () => {
    expect(isRemovalAllowed(board, 3)).toBe(false);
    expect(isRemovalAllowed(board, -1)).toBe(false);
    expect(isRemovalAllowed(board, 1.5)).toBe(false);
  });
});

describe('isSplitAllowed', () => {
  it('allows any split leaving both halves non-empty', () => {
    expect([1, 2].every(firstPart => isSplitAllowed(board, 1, firstPart))).toBe(true);
  });

  it('rejects a split that would leave a half empty', () => {
    expect(isSplitAllowed(board, 1, 0)).toBe(false);
    expect(isSplitAllowed(board, 1, 3)).toBe(false);
  });

  it('rejects splitting a single-match pile', () => {
    expect(isSplitAllowed(board, 0, 1)).toBe(false);
  });

  it('rejects a non-integer split point or pile id', () => {
    expect(isSplitAllowed(board, 1, 1.5)).toBe(false);
    expect(isSplitAllowed(board, 3, 1)).toBe(false);
  });
});

// Taking the last match wins. Splitting a pile can never end the game, since a
// split always leaves more piles than it started with.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on taking the last match', player => {
    const outcome = moves.removeMatch.apply([1], asPlayer(player), 0);
    expect(outcome.nextBoard).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('drops an emptied pile without ending the game while others remain', () => {
    const outcome = moves.removeMatch.apply([1, 3], asPlayer(0), 0);
    expect(outcome.nextBoard).toEqual([3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a split — a split only ever adds a pile', () => {
    const outcome = moves.splitPile.apply([4], asPlayer(0), 0, 1);
    expect(outcome.nextBoard).toEqual([1, 3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
