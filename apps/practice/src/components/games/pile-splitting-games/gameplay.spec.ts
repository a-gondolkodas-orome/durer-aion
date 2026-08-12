import { range } from 'lodash';
import {
  emptiedPileId, isLosingForMover, isRemovalAllowed, isSplitAllowed, moves, withPileRemoved,
  type Board
} from './gameplay';
import { makeCtx } from 'test-utils';

describe('pile-splitting shared turn legality', () => {
  describe('emptiedPileId', () => {
    it('is undefined at the start of a turn, when every pile stands', () => {
      expect(emptiedPileId([5, 3, 4])).toBe(undefined);
    });

    it('is the slot emptied by the removal half of the turn', () => {
      expect(emptiedPileId([5, 0, 4])).toBe(1);
    });
  });

  describe('isRemovalAllowed', () => {
    it('allows removing a pile while another one can still be split', () => {
      expect(isRemovalAllowed([5, 3, 4], 0)).toBe(true);
    });

    it('rejects a removal that would leave nothing splittable', () => {
      // only pile 2 has 2+ pieces, so it is the one that must be split
      expect(isRemovalAllowed([1, 1, 4], 2)).toBe(false);
      expect(isRemovalAllowed([1, 1, 4], 0)).toBe(true);
    });

    it('rejects a second removal in the same turn', () => {
      expect(isRemovalAllowed([5, 0, 4], 2)).toBe(false);
    });

    it('rejects a pile id outside the board', () => {
      expect(isRemovalAllowed([5, 3, 4], 3)).toBe(false);
      expect(isRemovalAllowed([5, 3, 4], -1)).toBe(false);
    });
  });

  describe('isSplitAllowed', () => {
    it('allows any split leaving both halves non-empty', () => {
      expect([1, 2, 3].every(pieceCount => isSplitAllowed([0, 3, 4], 2, pieceCount))).toBe(true);
    });

    it('rejects a split that would leave a half empty', () => {
      expect(isSplitAllowed([0, 3, 4], 2, 0)).toBe(false);
      expect(isSplitAllowed([0, 3, 4], 2, 4)).toBe(false);
    });

    it('rejects splitting before a pile has been removed this turn', () => {
      expect(isSplitAllowed([5, 3, 4], 2, 2)).toBe(false);
    });

    it('rejects splitting the pile that was just removed', () => {
      expect(isSplitAllowed([0, 3, 4], 0, 1)).toBe(false);
    });

    it('rejects a non-integer piece count', () => {
      expect(isSplitAllowed([0, 3, 4], 2, 1.5)).toBe(false);
    });
  });

  describe('withPileRemoved', () => {
    it('empties the removed pile and leaves the others untouched', () => {
      expect(withPileRemoved([5, 3, 4], 1)).toEqual([5, 0, 4]);
    });

    it('does not mutate the board it is given', () => {
      const board = [5, 3, 4];
      withPileRemoved(board, 1);
      expect(board).toEqual([5, 3, 4]);
    });
  });
});

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// A turn is two moves: empty one pile, then split another into it. The three
// sibling games play this same turn on 2, 3 and 4 piles.
describe('pile-splitting shared turn', () => {
  it('gates each half of the turn on the legality above', () => {
    expect(moves.removePile.validate([1, 2, 5], null, 0)).toBe(true);
    expect(moves.removePile.validate([1, 2, 0], null, 0)).toBe(false);
    expect(moves.splitPile.validate([1, 2, 0], null, { pileId: 1, pieceCount: 1 })).toBe(true);
    expect(moves.splitPile.validate([1, 2, 5], null, { pileId: 1, pieceCount: 1 })).toBe(false);
  });

  it('leaves the turn open after emptying a pile', () => {
    const outcome = moves.removePile.apply([1, 2, 5], asPlayer(0), 2);
    expect(outcome.nextBoard).toEqual([1, 2, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  // The halves take the split pile's own slot and the one emptied this turn,
  // the first half in whichever of the two comes first.
  it('splits into the slot emptied to its left', () => {
    const outcome = moves.splitPile.apply([1, 0, 7], asPlayer(0), { pileId: 2, pieceCount: 3 });
    expect(outcome.nextBoard).toEqual([1, 3, 4]);
  });

  it('splits into the slot emptied to its right', () => {
    const outcome = moves.splitPile.apply([7, 0, 1], asPlayer(0), { pileId: 0, pieceCount: 3 });
    expect(outcome.nextBoard).toEqual([3, 4, 1]);
  });

  it('does not mutate the board it is given', () => {
    const board = [1, 0, 7];
    moves.splitPile.apply(board, asPlayer(0), { pileId: 2, pieceCount: 3 });
    expect(board).toEqual([1, 0, 7]);
  });

  it('passes the turn while a pile can still be split', () => {
    const outcome = moves.splitPile.apply([1, 5, 0], asPlayer(0), { pileId: 1, pieceCount: 1 });
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  // The end of the game is every pile being down to a single piece, which is
  // read off the board rather than matched against a per-game [1, 1, …].
  const endgames = [
    { pileCount: 2, board: [2, 0], pileId: 0, allOnes: [1, 1] },
    { pileCount: 3, board: [1, 2, 0], pileId: 1, allOnes: [1, 1, 1] },
    { pileCount: 4, board: [1, 1, 2, 0], pileId: 2, allOnes: [1, 1, 1, 1] }
  ];

  it.each(endgames.flatMap(endgame => [0, 1].map(player => ({ ...endgame, player }))))(
    'ends for the mover (player $player) with all $pileCount piles down to one',
    ({ board, pileId, allOnes, player }) => {
      const outcome = moves.splitPile.apply(board, asPlayer(player), { pileId, pieceCount: 1 });
      expect(outcome.nextBoard).toEqual(allOnes);
      expect(outcome.gameEnd).toEqual({ winnerIndex: player });
      expect(outcome.isTurnEnd).toBeUndefined();
    }
  );
});

// `isLosingForMover` is a claim about the game, so it is checked against the
// game rather than against the parity rule it is written from — restating that
// rule would pass just as happily with the sign the wrong way round, which is
// how the four-pile generator carried an inverted copy of it. Every line is
// searched through the real moves and the real legality predicates, on boards
// small enough to solve outright.
const solved = new Map<string, boolean>();

const canWinBySearch = (board: Board): boolean => {
  // A turn discards a whole pile, so the total strictly shrinks and the search
  // terminates; only the pile sizes matter, not which slot holds them.
  const key = `${board.length}|${[...board].sort((a, b) => a - b).join(',')}`;
  if (solved.has(key)) return solved.get(key)!;

  const won = range(board.length).filter(id => isRemovalAllowed(board, id)).some(removedPileId => {
    const afterRemoval = withPileRemoved(board, removedPileId);

    return range(board.length).some(pileId => range(1, board[pileId]).some(pieceCount => {
      if (!isSplitAllowed(afterRemoval, pileId, pieceCount)) return false;
      const { nextBoard, gameEnd } = moves.splitPile.apply(
        afterRemoval, asPlayer(0), { pileId, pieceCount }
      );
      return gameEnd !== undefined || !canWinBySearch(nextBoard);
    }));
  });

  solved.set(key, won);
  return won;
};

// Non-decreasing tuples: the value of a position depends on the pile sizes
// alone, so one ordering of each stands for all of them.
const boardsUpTo = (pileCount: number, maxPile: number): Board[] =>
  pileCount === 0
    ? [[]]
    : boardsUpTo(pileCount - 1, maxPile).flatMap(rest =>
      range(rest[rest.length - 1] ?? 1, maxPile + 1).map(size => [...rest, size]));

describe('isLosingForMover', () => {
  it.each([2, 3, 4])('agrees with a search of every line, on %i piles', pileCount => {
    const boards = boardsUpTo(pileCount, 6);

    expect(boards.length).toBeGreaterThan(20);
    boards.forEach(board => {
      expect([board, isLosingForMover(board)]).toEqual([board, !canWinBySearch(board)]);
    });
  });

  it('reads a board with no even pile as lost, whatever the piles are', () => {
    expect(isLosingForMover([1, 1])).toBe(true);
    expect(isLosingForMover([3, 5, 7])).toBe(true);
    expect(isLosingForMover([1, 1, 1, 1])).toBe(true);
  });

  // The two branches past a decided turn: every pile even halves, and four piles
  // around a lone odd one top that pile up. Both were the four-pile game's own
  // reduction, and are what the sibling games now share.
  it('reduces a position no single turn decides', () => {
    expect(isLosingForMover([2, 2, 2, 2])).toBe(isLosingForMover([1, 1, 1, 1]));
    expect(isLosingForMover([1, 2, 2, 2])).toBe(isLosingForMover([2, 2, 2, 2]));
  });
});
