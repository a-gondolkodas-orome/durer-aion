import { moves, type Board } from './gameplay';
import { makeCtx } from '../../../../test-utils';

const isIncreaseValid = ({ board, number }: { board: Board; number: number }) =>
  moves.increaseTo.validate(board, { ctx: makeCtx() }, number);

describe('isIncreaseValid', () => {
  it('allows advancing by 1, 2 or 3', () => {
    expect([11, 12, 13].every(number => isIncreaseValid({ board: 10, number }))).toBe(true);
  });

  it('rejects advancing by more than 3', () => {
    expect(isIncreaseValid({ board: 10, number: 14 })).toBe(false);
  });

  it('rejects standing still or stepping backwards', () => {
    expect(isIncreaseValid({ board: 10, number: 10 })).toBe(false);
    expect(isIncreaseValid({ board: 10, number: 9 })).toBe(false);
  });

  it('allows stepping past the target, which is how a player loses', () => {
    expect(isIncreaseValid({ board: 40, number: 41 })).toBe(true);
  });

  it('rejects a non-integer target', () => {
    expect(isIncreaseValid({ board: 10, number: 11.5 })).toBe(false);
  });
});

// The player who passes 40 *loses*, so every ending credits the mover's
// opponent — the opposite of most games in the repo.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('plus-one-two-three end of game', () => {
  it.each([0, 1])('ends against the mover (player %i) when the limit is passed', player => {
    const outcome = moves.increaseTo.apply(39, asPlayer(player), 41);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while short of the limit', () => {
    const outcome = moves.increaseTo.apply(10, asPlayer(0), 12);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('does not end on exactly 40 — only passing it loses', () => {
    const outcome = moves.increaseTo.apply(38, asPlayer(0), 40);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
