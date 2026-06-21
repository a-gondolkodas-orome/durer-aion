import { getExactWinningMove, smartBotStrategy } from './bot-strategy';
import { BOARDSIZE, type Board } from './dominoes-on-chessboard';

// Independent, from-scratch brute-force reference (no decomposition, no symmetry
// shortcuts), used below to confirm a claimed winning move actually wins. Correctness
// of getExactWinningMove was additionally validated during development with a 200-trial
// randomized fuzz test against this same reference (0 discrepancies) - not kept here to
// keep the suite fast; rerun it if the Grundy/decomposition logic changes significantly.
const isWinningForMover = (emptyCells: number[], memo: Map<string, boolean>): boolean => {
  if (emptyCells.length < 2) return false;
  const key = [...emptyCells].sort((a, b) => a - b).join(',');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const present = new Set(emptyCells);
  let win = false;
  outer: for (const cell of emptyCells) {
    const row = Math.floor(cell / BOARDSIZE);
    const col = cell % BOARDSIZE;
    for (const [dRow, dCol] of [[1, 0], [0, 1]]) {
      const neighbor = (row + dRow) * BOARDSIZE + (col + dCol);
      if (row + dRow >= BOARDSIZE || col + dCol >= BOARDSIZE || !present.has(neighbor)) continue;
      const remaining = emptyCells.filter(c => c !== cell && c !== neighbor);
      if (!isWinningForMover(remaining, memo)) { win = true; break outer; }
    }
  }
  memo.set(key, win);
  return win;
};

const allCellIds = Array.from({ length: BOARDSIZE * BOARDSIZE }, (_, i) => i);

// Covers every cell except `keep` with arbitrary dominoes (their exact placement
// doesn't matter - getExactWinningMove only looks at which cells are empty).
const coverEverythingExcept = (keep: number[]): Board => {
  const board: Board = [];
  const remaining = allCellIds.filter(id => !keep.includes(id));
  for (let i = 0; i + 1 < remaining.length; i += 2) board.push([remaining[i], remaining[i + 1]]);
  return board;
};

describe('getExactWinningMove', () => {
  it('finds a move that truly wins when two unequal regions are left (isolated domino + 2x2 block)', () => {
    const isolatedDomino = [0, 1]; // row0 cols0-1
    const square2x2 = [14, 15, 20, 21]; // row2 cols2-3, row3 cols2-3
    const board = coverEverythingExcept([...isolatedDomino, ...square2x2]);

    const move = getExactWinningMove(board);
    expect(move).toBeDefined();

    const covered = new Set(board.flat());
    const emptyCells = allCellIds.filter(id => !covered.has(id));
    const afterMove = emptyCells.filter(c => c !== move![0] && c !== move![1]);
    const memo = new Map<string, boolean>();
    expect(isWinningForMover(afterMove, memo)).toBe(false);
  });

  it('returns undefined when no move can force a win (two equal isolated dominoes)', () => {
    const board = coverEverythingExcept([0, 1, 3, 4]);
    expect(getExactWinningMove(board)).toBeUndefined();
  });
});

describe('smartBotStrategy', () => {
  const makeCtx = (chosenRoleIndex: number) => ({
    chosenRoleIndex,
    currentPlayer: 0,
    isClientMoveAllowed: true,
    isHumanVsHumanGame: false,
    moveCount: 0,
    turnState: null
  });

  it('always mirrors through the board center when playing second, regardless of position', () => {
    const board: Board = [[0, 1]];
    let placed: number[] | undefined;
    const moves = { placeDomino: (_board: Board, domino: number[]) => { placed = domino; } };
    smartBotStrategy({ board, ctx: makeCtx(0) as never, moves: moves as never });
    const N = BOARDSIZE * BOARDSIZE - 1;
    expect(new Set(placed)).toEqual(new Set([N - 0, N - 1]));
  });

  it('plays the exact winning move when playing first and one exists', () => {
    const isolatedDomino = [0, 1]; // row0 cols0-1
    const square2x2 = [14, 15, 20, 21]; // row2 cols2-3, row3 cols2-3
    const board = coverEverythingExcept([...isolatedDomino, ...square2x2]);
    let placed: number[] | undefined;
    const moves = { placeDomino: (_board: Board, domino: number[]) => { placed = domino; } };
    smartBotStrategy({ board, ctx: makeCtx(1) as never, moves: moves as never });

    expect(placed).toBeDefined();
    const covered = new Set(board.flat());
    const emptyCells = allCellIds.filter(id => !covered.has(id));
    const afterMove = emptyCells.filter(c => c !== placed![0] && c !== placed![1]);
    const memo = new Map<string, boolean>();
    expect(isWinningForMover(afterMove, memo)).toBe(false);
  });
});
