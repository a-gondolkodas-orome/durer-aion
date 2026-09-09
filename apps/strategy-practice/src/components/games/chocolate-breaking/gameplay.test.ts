import {
  allMoves,
  generateStartBoard,
  grundy,
  hasSafeBreak,
  isFlexible,
  moves,
  type Board,
  type Move
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isBreakAllowed = moveValidator(moves.breakPiece);

const single = (w: number, h: number): Board => ({ pieces: [{ id: 0, w, h }], nextId: 1 });

describe('grundy()', () => {
  it('gives 0 to strips that cannot be broken safely', () => {
    expect(grundy(1, 1)).toBe(0);
    expect(grundy(1, 2)).toBe(0);
    expect(grundy(1, 3)).toBe(0);
  });

  it('matches known Sprague–Grundy values', () => {
    expect(grundy(1, 4)).toBe(1);
    expect(grundy(2, 2)).toBe(1);
    expect(grundy(3, 3)).toBe(0);
    // the original competition board: first player wins
    expect(grundy(5, 10)).toBe(2);
  });
});

describe('isFlexible()', () => {
  it('identifies pieces that still have a safe break', () => {
    expect(isFlexible({ w: 1, h: 1 })).toBe(false);
    expect(isFlexible({ w: 1, h: 3 })).toBe(false);
    expect(isFlexible({ w: 1, h: 4 })).toBe(true);
    expect(isFlexible({ w: 2, h: 2 })).toBe(true);
  });
});

describe('generateStartBoard()', () => {
  it('produces a single breakable rectangle', () => {
    for (let i = 0; i < 50; i++) {
      const board = generateStartBoard();
      expect(board.pieces).toHaveLength(1);
      expect(hasSafeBreak(board.pieces)).toBe(true);
    }
  });
});

describe('isBreakAllowed', () => {
  it('accepts a safe cut on a piece that is on the table', () => {
    expect(isBreakAllowed(single(3, 3), { id: 0, dir: 'v', pos: 1 })).toBe(true);
    expect(isBreakAllowed(single(3, 3), { id: 0, dir: 'h', pos: 2 })).toBe(true);
  });

  it('refuses a cut that would snap off a 1x1 — that is the loss, not a move', () => {
    // A 1x3 strip has no safe cut at all: either half would be a 1x1.
    expect(isBreakAllowed(single(1, 3), { id: 0, dir: 'h', pos: 1 })).toBe(false);
    expect(isBreakAllowed(single(1, 3), { id: 0, dir: 'h', pos: 2 })).toBe(false);
    // A 1x4 strip may only be cut down the middle.
    expect(isBreakAllowed(single(1, 4), { id: 0, dir: 'h', pos: 2 })).toBe(true);
    expect(isBreakAllowed(single(1, 4), { id: 0, dir: 'h', pos: 1 })).toBe(false);
  });

  it('refuses a cut outside the piece, or along its edge', () => {
    expect(isBreakAllowed(single(3, 3), { id: 0, dir: 'v', pos: 0 })).toBe(false);
    expect(isBreakAllowed(single(3, 3), { id: 0, dir: 'v', pos: 3 })).toBe(false);
  });

  it('refuses a piece that is not on the table', () => {
    expect(isBreakAllowed(single(3, 3), { id: 7, dir: 'v', pos: 1 })).toBe(false);
  });

  it('accepts exactly the cuts the generator lists', () => {
    const board: Board = { pieces: [{ id: 0, w: 3, h: 4 }, { id: 1, w: 2, h: 2 }], nextId: 2 };
    const listed = new Set(allMoves(board.pieces).map(m => `${m.id}${m.dir}${m.pos}`));
    for (const piece of board.pieces) {
      for (const dir of ['v', 'h'] as const) {
        for (let pos = 0; pos <= 5; pos++) {
          const move: Move = { id: piece.id, dir, pos };
          expect(isBreakAllowed(board, move)).toBe(listed.has(`${piece.id}${dir}${pos}`));
        }
      }
    }
  });
});

// The player forced to break off the first 1×1 loses, so the game ends on the
// move that leaves the table with no safe break at all.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });


describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when no safe break is left', p => {
    // 1×4 splits into two 1×2 strips, neither of which can be broken safely
    const outcome = moves.breakPiece.apply(single(1, 4), asPlayer(p), { id: 0, dir: 'h', pos: 2 });
    expect(outcome.nextBoard.pieces.map(({ w, h }) => [w, h])).toEqual([[1, 2], [1, 2]]);
    expect(hasSafeBreak(outcome.nextBoard.pieces)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some piece can still be broken safely', () => {
    // 2×4 into 2×1 and 2×3: the 2×3 is still flexible
    const outcome = moves.breakPiece.apply(single(2, 4), asPlayer(0), { id: 0, dir: 'h', pos: 1 });
    expect(hasSafeBreak(outcome.nextBoard.pieces)).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
