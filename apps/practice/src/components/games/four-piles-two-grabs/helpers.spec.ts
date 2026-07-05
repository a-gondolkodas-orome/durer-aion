import {
  type Board,
  applyMove,
  canMove,
  isTerminal,
  getLegalMoves,
  isWinningInOneMove,
  isWinningBoard,
  getSmartBotMove,
  getRandomBotMove,
  generateStartBoard
} from './helpers';

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

describe('four-piles-two-grabs helpers', () => {
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
});
