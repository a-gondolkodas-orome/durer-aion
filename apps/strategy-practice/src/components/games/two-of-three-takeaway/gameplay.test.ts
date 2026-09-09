import {
  applyMove,
  canMove,
  generateStartBoard,
  getLegalMoves,
  isTerminal,
  moves,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isTakeAllowed = moveValidator(moves.takeChips);

describe('two-of-three-takeaway gameplay', () => {
  describe('move mechanics', () => {
    it('takes one chip from each chosen field', () => {
      expect(applyMove([3, 2, 5], [0, 2])).toEqual([2, 2, 4]);
    });

    it('a player can move iff at least two fields are non-empty', () => {
      expect(canMove([1, 1, 0])).toBe(true);
      expect(canMove([4, 0, 0])).toBe(false);
      expect(canMove([0, 0, 0])).toBe(false);
      expect(isTerminal([4, 0, 0])).toBe(true);
    });

    it('lists all pairs of non-empty fields as legal moves', () => {
      expect(getLegalMoves([2, 3, 0])).toEqual([[0, 1]]);
      expect(getLegalMoves([2, 3, 1])).toEqual([[0, 1], [0, 2], [1, 2]]);
      expect(getLegalMoves([5, 0, 0])).toEqual([]);
    });
  });

  describe('generateStartBoard', () => {
    it('produces playable even-total boards within bounds', () => {
      for (let i = 0; i < 500; i++) {
        const board = generateStartBoard();
        const total = board[0] + board[1] + board[2];
        expect(board).toHaveLength(3);
        expect(total % 2).toBe(0);
        expect(total).toBeGreaterThanOrEqual(4);
        expect(total).toBeLessThanOrEqual(20);
        expect(board.every(v => v > 0)).toBe(true);
        expect(canMove(board)).toBe(true);
      }
    });
  });
});

describe('isTakeAllowed', () => {
  const board: Board = [3, 1, 0];

  it('accepts two distinct non-empty piles, in either order', () => {
    expect(isTakeAllowed(board, 0, 1)).toBe(true);
    expect(isTakeAllowed(board, 1, 0)).toBe(true);
  });

  it('refuses an empty pile, the same pile twice, and indices off the board', () => {
    expect(isTakeAllowed(board, 0, 2)).toBe(false); // pile 2 is empty
    expect(isTakeAllowed(board, 0, 0)).toBe(false);
    expect(isTakeAllowed(board, 0, 3)).toBe(false);
    expect(isTakeAllowed(board, -1, 0)).toBe(false);
  });

  it('accepts every move the generator lists, and nothing else', () => {
    const listed = new Set(getLegalMoves(board).map(([i, j]) => `${i},${j}`));
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        expect(isTakeAllowed(board, i, j)).toBe(listed.has(`${i},${j}`));
      }
    }
  });
});

// A move takes one chip from each of two distinct non-empty piles, so a
// position with fewer than two non-empty piles is a loss for the player to move.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when the opponent is left stuck', p => {
    const outcome = moves.takeChips.apply([1, 1, 0], asPlayer(p), 0, 1);
    expect(outcome.nextBoard).toEqual([0, 0, 0]);
    expect(isTerminal(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('also ends when a single non-empty pile is left — one pile cannot be played', () => {
    const outcome = moves.takeChips.apply([2, 1, 0], asPlayer(0), 0, 1);
    expect(outcome.nextBoard).toEqual([1, 0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while two piles stay non-empty', () => {
    const outcome = moves.takeChips.apply([2, 2, 0], asPlayer(0), 0, 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
