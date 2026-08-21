import { getSmartMove, getRandomMove } from './bot-strategy';
import {
  type Board, getLegalMoves, hasLegalMove, isOpposite, isWinningForMover,
  generateStartBoard, OPPOSITE_PAIRS, pairSum
} from './gameplay';

const applyMove = (board: Board, [i, j]: [number, number]): Board => {
  const next = board.slice();
  next[i] -= 1; next[j] -= 1;
  return next;
};

const allPairSumsEven = (board: Board) =>
  OPPOSITE_PAIRS.every((pair) => pairSum(board, pair) % 2 === 0);

// Enumerate every reachable position with each field capped at `max`.
const enumerateBoards = (max: number): Board[] => {
  const boards: Board[] = [];
  const b = [0, 0, 0, 0, 0, 0];
  const rec = (pos: number) => {
    if (pos === 6) {
      if (b.reduce((a, c) => a + c, 0) % 2 === 0) boards.push(b.slice());
      return;
    }
    for (let v = 0; v <= max; v++) { b[pos] = v; rec(pos + 1); }
    b[pos] = 0;
  };
  rec(0);
  return boards;
};

describe('six fields on a circle — strategy', () => {
  it('only opposite pairs are illegal; every other pair with two discs is legal', () => {
    expect(getLegalMoves([1, 1, 0, 0, 0, 0])).toEqual([[0, 1]]);
    // 0 and 3 are opposite, so no legal move despite both being non-empty.
    expect(getLegalMoves([1, 0, 0, 1, 0, 0])).toEqual([]);
    expect(hasLegalMove([1, 0, 0, 1, 0, 0])).toBe(false);
  });

  it('a position is winning for the mover iff some opposite-pair sum is odd', () => {
    expect(isWinningForMover([1, 1, 0, 0, 0, 0])).toBe(true); // pair (0,3) sum 1 is odd
    expect(isWinningForMover([1, 0, 0, 1, 0, 0])).toBe(false); // all pair sums even (terminal)
    expect(isWinningForMover([2, 1, 1, 2, 1, 1])).toBe(false); // all sums even
  });

  it('matches exhaustive minimax on all boards up to field value 4', () => {
    const memo = new Map<string, boolean>();
    const solve = (board: Board): boolean => {
      const key = board.join(',');
      if (memo.has(key)) return memo.get(key)!;
      memo.set(key, false);
      const win = getLegalMoves(board).some((m) => !solve(applyMove(board, m)));
      memo.set(key, win);
      return win;
    };
    for (const board of enumerateBoards(4)) {
      expect(isWinningForMover(board)).toBe(solve(board));
    }
  });

  it('from a winning position the smart bot moves to an all-even (losing) position', () => {
    for (const board of enumerateBoards(3)) {
      if (!isWinningForMover(board)) continue;
      for (let i = 0; i < 8; i++) {
        const move = getSmartMove(board);
        const [a, b] = move;
        expect(board[a]).toBeGreaterThan(0);
        expect(board[b]).toBeGreaterThan(0);
        expect(isOpposite(a, b)).toBe(false);
        const next = applyMove(board, move);
        expect(allPairSumsEven(next)).toBe(true);
        expect(isWinningForMover(next)).toBe(false);
      }
    }
  });

  it('from a losing position the smart bot still makes a legal move', () => {
    for (const board of enumerateBoards(4)) {
      if (isWinningForMover(board) || !hasLegalMove(board)) continue;
      const move = getSmartMove(board);
      expect(getLegalMoves(board)).toContainEqual(move);
    }
  });

  it('optimal play beats every opponent line from a winning start', () => {
    // Player 0 plays getSmartMove; player 1 tries every reply. Player 0 (the
    // mover from a winning position) must make the last move in every line.
    const start: Board = [2, 1, 1, 1, 0, 1]; // pair sums 3, 1, 2 -> winning
    expect(isWinningForMover(start)).toBe(true);
    let games = 0;
    const play = (board: Board, toMove: number, lastMover: number) => {
      if (!hasLegalMove(board)) {
        games += 1;
        expect(lastMover).toBe(0);
        return;
      }
      if (toMove === 0) {
        play(applyMove(board, getSmartMove(board)), 1, 0);
      } else {
        for (const m of getLegalMoves(board)) play(applyMove(board, m), 0, 1);
      }
    };
    play(start, 0, -1);
    expect(games).toBeGreaterThan(0);
  });

  it('the test bot takes an immediately winning move when one is available', () => {
    // From [1,1,0,1,0,0] the only legal moves are (0,1) and (1,3); (0,1) leaves
    // [0,0,0,1,0,0] which is terminal, an immediate win.
    const board: Board = [1, 1, 0, 1, 0, 0];
    for (let i = 0; i < 20; i++) {
      const move = getRandomMove(board);
      expect(hasLegalMove(applyMove(board, move))).toBe(false);
    }
  });

  it('generateStartBoard yields balanced, playable, even-total boards', () => {
    let winning = 0;
    for (let i = 0; i < 400; i++) {
      const board = generateStartBoard();
      expect(board.reduce((a, c) => a + c, 0) % 2).toBe(0);
      expect(hasLegalMove(board)).toBe(true);
      if (isWinningForMover(board)) winning += 1;
    }
    // Should be roughly half winning, half losing for the first player.
    expect(winning).toBeGreaterThan(120);
    expect(winning).toBeLessThan(280);
  });
});
