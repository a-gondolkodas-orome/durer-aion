import {
  getRandomBotMove,
  getSmartBotMove,
  isWinningBoard,
  isWinningInOneMove
} from './bot-strategy';
import { applyMove, generateStartBoard, getLegalMoves, isTerminal, type Board } from './gameplay';

// Exhaustive game-theoretic value: the player to move wins iff some move leads
// to a position from which the opponent loses. Positions are symmetric in the
// three fields, so we memoise on the sorted triple.
const minimaxWin = (() => {
  const memo = new Map<string, boolean>();
  const solve = (board: Board): boolean => {
    const key = [...board].sort((a, b) => a - b).join(',');
    if (memo.has(key)) return memo.get(key)!;
    const moves = getLegalMoves(board);
    // Set before recursing to guard against re-entry; positions are acyclic
    // (the total strictly decreases) so this is only a micro-optimisation.
    const win = moves.some(m => !solve(applyMove(board, m)));
    memo.set(key, win);
    return win;
  };
  return solve;
})();

// All boards with an even total (the only positions reachable during play) and
// each field in 0..10.
const evenTotalBoards = (): Board[] => {
  const boards: Board[] = [];
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      for (let c = 0; c <= 10; c++) {
        if ((a + b + c) % 2 === 0) boards.push([a, b, c]);
      }
    }
  }
  return boards;
};

describe('two-of-three-takeaway bot', () => {
  it('detects a move that wins immediately', () => {
    expect(isWinningInOneMove([1, 1, 0], [0, 1])).toBe(true); // -> [0,0,0]
    expect(isWinningInOneMove([1, 3, 0], [0, 1])).toBe(true); // -> [0,2,0]
    expect(isWinningInOneMove([2, 2, 0], [0, 1])).toBe(false); // -> [1,1,0]
  });

  describe('winning-position characterisation', () => {
    it('matches exhaustive minimax on every even-total board', () => {
      for (const board of evenTotalBoards()) {
        expect(isWinningBoard(board)).toBe(minimaxWin(board));
      }
    });

    it('is a type (b) position (two odd fields) that wins', () => {
      expect(isWinningBoard([3, 2, 5])).toBe(true);
      expect(isWinningBoard([1, 0, 0])).toBe(false); // odd total is unreachable, still not two odds
      expect(isWinningBoard([2, 2, 2])).toBe(false);
    });
  });

  describe('smart bot', () => {
    it('from a winning position leaves the opponent a losing position', () => {
      for (const board of evenTotalBoards()) {
        if (!isWinningBoard(board)) continue;
        const next = applyMove(board, getSmartBotMove(board));
        expect(minimaxWin(next)).toBe(false);
      }
    });

    it('always makes a legal move', () => {
      for (const board of evenTotalBoards()) {
        if (isTerminal(board)) continue;
        const move = getSmartBotMove(board);
        expect(getLegalMoves(board)).toContainEqual(move);
      }
    });

    it('takes from the two odd fields in a type (b) position', () => {
      expect(getSmartBotMove([4, 1, 3])).toEqual([1, 2]);
      expect(getSmartBotMove([5, 1, 0])).toEqual([0, 1]);
    });
  });

  // generateStartBoard aims for a ~50/50 split between the two roles, which is a
  // claim about the characterisation rather than about the board shape.
  describe('generateStartBoard balance', () => {
    it('produces both winning and losing starting positions', () => {
      const results = new Set<boolean>();
      for (let i = 0; i < 500; i++) results.add(isWinningBoard(generateStartBoard()));
      expect(results).toEqual(new Set([true, false]));
    });
  });

  describe('random (test) bot', () => {
    it('grabs an immediate one-move win when available', () => {
      expect(isWinningInOneMove([1, 3, 0], getRandomBotMove([1, 3, 0]))).toBe(true);
      expect(isWinningInOneMove([1, 1, 4], getRandomBotMove([1, 1, 4]))).toBe(true);
    });

    it('makes a legal move otherwise', () => {
      const move = getRandomBotMove([4, 2, 6]);
      expect(getLegalMoves([4, 2, 6])).toContainEqual(move);
    });
  });
});
