import { getRandomBotMove, getSmartBotMove } from './bot-strategy';
import {
  applyMove,
  getLegalMoves,
  isTerminal,
  isWinningBoard,
  isWinningInOneMove,
  type Board
} from './gameplay';

// Exhaustive game-theoretic value: the player to move wins iff some move leads
// to a position from which the opponent loses. Positions are symmetric in the
// four piles, so we memoise on the sorted quadruple.
const minimaxWin = (() => {
  const memo = new Map<string, boolean>();
  const solve = (board: Board): boolean => {
    const key = [...board].sort((a, b) => a - b).join(',');
    if (memo.has(key)) return memo.get(key)!;
    const win = getLegalMoves(board).some(m => !solve(applyMove(board, m)));
    memo.set(key, win);
    return win;
  };
  return solve;
})();

// All boards with each pile in 0..MAX (up to symmetry: sorted, non-decreasing).
const MAX = 7;
const allBoards = (): Board[] => {
  const boards: Board[] = [];
  for (let a = 0; a <= MAX; a++) {
    for (let b = a; b <= MAX; b++) {
      for (let c = b; c <= MAX; c++) {
        for (let d = c; d <= MAX; d++) {
          boards.push([a, b, c, d]);
        }
      }
    }
  }
  return boards;
};

describe('four-piles-two-grabs bot', () => {
  describe('winning-position characterisation', () => {
    it('matches exhaustive minimax on every board', () => {
      for (const board of allBoards()) {
        expect(isWinningBoard(board)).toBe(minimaxWin(board));
      }
    });

    it('is a loss exactly when the three smallest piles are equal', () => {
      expect(isWinningBoard([6, 7, 8, 9])).toBe(true);
      expect(isWinningBoard([6, 6, 6, 9])).toBe(false);
      expect(isWinningBoard([2, 2, 2, 2])).toBe(false);
      expect(isWinningBoard([5, 0, 0, 0])).toBe(false); // terminal position
    });
  });

  describe('smart bot', () => {
    it('from a winning position leaves the opponent a losing position', () => {
      for (const board of allBoards()) {
        if (!isWinningBoard(board)) continue;
        const next = applyMove(board, getSmartBotMove(board));
        expect(minimaxWin(next)).toBe(false);
      }
    });

    it('always makes a legal move', () => {
      for (const board of allBoards()) {
        if (isTerminal(board)) continue;
        const move = getSmartBotMove(board);
        expect(getLegalMoves(board)).toContainEqual(move);
      }
    });

    it('grabs an immediate win when it has one', () => {
      expect(isWinningInOneMove([2, 3, 4, 0], getSmartBotMove([2, 3, 4, 0]))).toBe(true);
    });
  });

  describe('random (test) bot', () => {
    it('grabs an immediate one-move win when available', () => {
      expect(isWinningInOneMove([1, 3, 0, 0], getRandomBotMove([1, 3, 0, 0]))).toBe(true);
      expect(isWinningInOneMove([1, 1, 4, 0], getRandomBotMove([1, 1, 4, 0]))).toBe(true);
    });

    it('makes a legal move otherwise', () => {
      const board = [4, 2, 6, 3];
      expect(getLegalMoves(board)).toContainEqual(getRandomBotMove(board));
    });
  });
});
