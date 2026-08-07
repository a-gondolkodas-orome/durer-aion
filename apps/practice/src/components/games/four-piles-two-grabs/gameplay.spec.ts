import {
  applyMove,
  canMove,
  generateStartBoard,
  getLegalMoves,
  isTerminal,
  isWinningBoard,
  isWinningInOneMove,
  moves,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isMoveLegal = moveValidator(moves.takeStones);

describe('four-piles-two-grabs gameplay', () => {
  describe('move mechanics', () => {
    it('removes the chosen amount from each chosen pile', () => {
      expect(applyMove([6, 7, 8, 9], [0, 1, 2, 0])).toEqual([6, 6, 6, 9]);
    });

    it('a player can move iff at least two piles are non-empty', () => {
      expect(canMove([1, 1, 0, 0])).toBe(true);
      expect(canMove([4, 0, 0, 0])).toBe(false);
      expect(canMove([0, 0, 0, 0])).toBe(false);
      expect(isTerminal([4, 0, 0, 0])).toBe(true);
    });

    it('lists moves as amounts removed from exactly two non-empty piles', () => {
      // Only piles 0 and 1 are non-empty, each can lose 1..2 stones.
      expect(getLegalMoves([2, 2, 0, 0])).toEqual([
        [1, 1, 0, 0], [1, 2, 0, 0], [2, 1, 0, 0], [2, 2, 0, 0]
      ]);
      expect(getLegalMoves([5, 0, 0, 0])).toEqual([]);
    });

    it('detects a move that wins immediately', () => {
      expect(isWinningInOneMove([1, 1, 0, 0], [1, 1, 0, 0])).toBe(true); // -> all empty
      expect(isWinningInOneMove([2, 3, 4, 0], [2, 3, 0, 0])).toBe(true); // -> only pile 2 left
      expect(isWinningInOneMove([2, 2, 2, 2], [1, 1, 0, 0])).toBe(false);
    });
  });

  describe('generateStartBoard', () => {
    it('produces four non-empty piles within bounds', () => {
      for (let i = 0; i < 500; i++) {
        const board = generateStartBoard();
        expect(board).toHaveLength(4);
        expect(board.every(v => v >= 2 && v <= 9)).toBe(true);
        expect(canMove(board)).toBe(true);
      }
    });

    it('produces both winning and losing starting positions', () => {
      const results = new Set<boolean>();
      for (let i = 0; i < 500; i++) results.add(isWinningBoard(generateStartBoard()));
      expect(results).toEqual(new Set([true, false]));
    });
  });

  describe('isMoveLegal', () => {
    const board: Board = [3, 4, 0, 5];

    it('allows taking from exactly two non-empty piles', () => {
      expect(isMoveLegal(board, [1, 2, 0, 0])).toBe(true);
      expect(isMoveLegal(board, [3, 0, 0, 5])).toBe(true);
    });

    it('rejects taking from fewer or more than two piles', () => {
      expect(isMoveLegal(board, [1, 0, 0, 0])).toBe(false);
      expect(isMoveLegal(board, [0, 0, 0, 0])).toBe(false);
      expect(isMoveLegal(board, [1, 1, 0, 1])).toBe(false);
    });

    it('rejects taking more than a pile holds', () => {
      expect(isMoveLegal(board, [4, 1, 0, 0])).toBe(false);
    });

    it('rejects taking from an empty pile', () => {
      expect(isMoveLegal(board, [1, 0, 1, 0])).toBe(false);
    });

    it('rejects a malformed move', () => {
      expect(isMoveLegal(board, [1, 2])).toBe(false);
      expect(isMoveLegal(board, [1.5, 2, 0, 0])).toBe(false);
      expect(isMoveLegal(board, [-1, 2, 0, 0])).toBe(false);
      expect(isMoveLegal(board, undefined as unknown as number[])).toBe(false);
    });
  });
});

// A move takes from exactly two piles, so a position with fewer than two
// non-empty piles is a loss for the player to move.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when the board empties', player => {
    const outcome = moves.takeStones.apply([1, 1, 0, 0], asPlayer(player), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([0, 0, 0, 0]);
    expect(isTerminal(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('also ends when a single non-empty pile is left — one pile cannot be played', () => {
    const outcome = moves.takeStones.apply([2, 1, 0, 0], asPlayer(0), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([1, 0, 0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while two piles stay non-empty', () => {
    const outcome = moves.takeStones.apply([2, 2, 0, 0], asPlayer(0), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([1, 1, 0, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
