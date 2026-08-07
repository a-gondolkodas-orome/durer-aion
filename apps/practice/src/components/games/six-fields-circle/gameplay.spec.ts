import {
  getLegalMoves, hasLegalMove, isOpposite, isRemovalAllowed, moves, type Board, type TurnState
} from './gameplay';
import { makeCtx } from 'test-utils';

describe('isRemovalAllowed', () => {
  const board: Board = [2, 1, 0, 3, 1, 1];

  it('accepts two non-empty fields that are not opposite each other', () => {
    expect(isRemovalAllowed(board, [0, 1])).toBe(true); // neighbours
    expect(isRemovalAllowed(board, [0, 4])).toBe(true); // second neighbours
  });

  it('accepts the pair in either order — the client hands it over in click order', () => {
    expect(isRemovalAllowed(board, [4, 0])).toBe(true);
    expect(isRemovalAllowed(board, [1, 0])).toBe(true);
  });

  it('refuses the three diameters', () => {
    expect(isRemovalAllowed(board, [0, 3])).toBe(false);
    expect(isRemovalAllowed(board, [1, 4])).toBe(false);
    expect(isRemovalAllowed([1, 1, 1, 1, 1, 1], [2, 5])).toBe(false);
  });

  it('refuses an empty field and the same field twice', () => {
    expect(isRemovalAllowed(board, [1, 2])).toBe(false); // field 2 is empty
    expect(isRemovalAllowed(board, [0, 0])).toBe(false);
  });

  it('refuses anything that is not one of the six field indices', () => {
    expect(isRemovalAllowed(board, [0, 6])).toBe(false);
    expect(isRemovalAllowed(board, [-1, 0])).toBe(false);
    expect(isRemovalAllowed(board, [0, 2.5])).toBe(false);
  });

  it('accepts every move the generator lists, and nothing else', () => {
    const listed = new Set(getLegalMoves(board).map(([i, j]) => `${i},${j}`));
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        expect(isRemovalAllowed(board, [i, j])).toBe(listed.has(`${i},${j}`));
      }
    }
  });

  it('agrees with isOpposite on which pairs are diameters', () => {
    const full: Board = [1, 1, 1, 1, 1, 1];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        expect(isRemovalAllowed(full, [i, j])).toBe(!isOpposite(i, j));
      }
    }
  });
});

// A move needs two non-empty fields that are not opposite each other, so two
// survivors facing each other across the circle is a dead position.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx<TurnState>({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when only opposite fields remain', p => {
    const outcome = moves.removeFromTwo.apply([1, 1, 0, 2, 0, 0], asPlayer(p), [1, 3]);
    expect(outcome.nextBoard).toEqual([1, 0, 0, 1, 0, 0]);
    expect(hasLegalMove(outcome.nextBoard)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while a legal pair remains', () => {
    const outcome = moves.removeFromTwo.apply([2, 2, 1, 0, 0, 0], asPlayer(0), [0, 1]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
