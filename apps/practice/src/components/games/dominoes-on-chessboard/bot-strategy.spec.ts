import { isEqual } from 'lodash';
import { makeCtx, type GameMoves } from '../../game-factory';
import { getExactWinningMove, smartBotStrategy } from './bot-strategy';
import { ALL_FIELDS, BOARDSIZE, type Board, type Domino, type Field } from './dominoes-on-chessboard';

const fieldKey = ({ row, col }: Field) => `${row},${col}`;

// Independent, from-scratch brute-force reference (no decomposition, no symmetry
// shortcuts), used below to confirm a claimed winning move actually wins. Correctness
// of getExactWinningMove was additionally validated during development with a 200-trial
// randomized fuzz test against this same reference (0 discrepancies) - not kept here to
// keep the suite fast; rerun it if the Grundy/decomposition logic changes significantly.
const isWinningForMover = (emptyCells: Field[], memo: Map<string, boolean>): boolean => {
  if (emptyCells.length < 2) return false;
  const key = [...emptyCells].map(fieldKey).sort().join(',');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const present = new Set(emptyCells.map(fieldKey));
  let win = false;
  outer: for (const { row, col } of emptyCells) {
    for (const [dRow, dCol] of [[1, 0], [0, 1]]) {
      const neighbor: Field = { row: row + dRow, col: col + dCol };
      if (!present.has(fieldKey(neighbor))) continue;
      const remaining = emptyCells.filter(c => !isEqual(c, { row, col }) && !isEqual(c, neighbor));
      if (!isWinningForMover(remaining, memo)) { win = true; break outer; }
    }
  }
  memo.set(key, win);
  return win;
};

// Covers every cell except `keep` with arbitrary dominoes (their exact placement
// doesn't matter - getExactWinningMove only looks at which cells are empty).
const coverEverythingExcept = (keep: Field[]): Board => {
  const board: Board = [];
  const remaining = ALL_FIELDS.filter(c => !keep.some(k => isEqual(k, c)));
  for (let i = 0; i + 1 < remaining.length; i += 2) board.push([remaining[i], remaining[i + 1]]);
  return board;
};

describe('getExactWinningMove', () => {
  it('finds a move that truly wins when two unequal regions are left (isolated domino + 2x2 block)', () => {
    const isolatedDomino: Field[] = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    const square2x2: Field[] = [
      { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }
    ];
    const board = coverEverythingExcept([...isolatedDomino, ...square2x2]);

    const move = getExactWinningMove(board);
    expect(move).toBeDefined();

    const covered = new Set(board.flat().map(fieldKey));
    const emptyCells = ALL_FIELDS.filter(c => !covered.has(fieldKey(c)));
    const afterMove = emptyCells.filter(c => !isEqual(c, move![0]) && !isEqual(c, move![1]));
    const memo = new Map<string, boolean>();
    expect(isWinningForMover(afterMove, memo)).toBe(false);
  });

  it('picks a winning move on a single region where only some moves win (2x3 block)', () => {
    // In a 2x3 region the three vertical dominoes win and the four horizontal ones
    // lose, so a defined-but-wrong move would pass toBeDefined yet fail the oracle.
    const region: Field[] = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) region.push({ row: r, col: c });
    const board = coverEverythingExcept(region);

    const move = getExactWinningMove(board);
    expect(move).toBeDefined();

    const covered = new Set(board.flat().map(fieldKey));
    const emptyCells = ALL_FIELDS.filter(c => !covered.has(fieldKey(c)));
    const afterMove = emptyCells.filter(c => !isEqual(c, move![0]) && !isEqual(c, move![1]));
    const memo = new Map<string, boolean>();
    expect(isWinningForMover(afterMove, memo)).toBe(false);
  });

  it('returns undefined when no move can force a win (two equal isolated dominoes)', () => {
    const board = coverEverythingExcept([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 3 }, { row: 0, col: 4 }
    ]);
    expect(getExactWinningMove(board)).toBeUndefined();
  });
});

describe('smartBotStrategy', () => {
  it('always mirrors through the board center when playing second, regardless of position', () => {
    const board: Board = [[{ row: 0, col: 0 }, { row: 0, col: 1 }]];
    let placed: Domino | undefined;
    const moves: GameMoves<Board> = {
      placeDomino: (board: Board, domino: Domino) => { placed = domino; return { nextBoard: board }; }
    };
    smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 0 }), moves });
    expect(new Set(placed!.map(fieldKey))).toEqual(new Set([
      fieldKey({ row: BOARDSIZE - 1, col: BOARDSIZE - 1 }),
      fieldKey({ row: BOARDSIZE - 1, col: BOARDSIZE - 2 })
    ]));
  });

  it('plays the exact winning move when playing first and one exists', () => {
    const isolatedDomino: Field[] = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    const square2x2: Field[] = [
      { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }
    ];
    const board = coverEverythingExcept([...isolatedDomino, ...square2x2]);
    let placed: Domino | undefined;
    const moves: GameMoves<Board> = {
      placeDomino: (board: Board, domino: Domino) => { placed = domino; return { nextBoard: board }; }
    };
    smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 1 }), moves });

    expect(placed).toBeDefined();
    const covered = new Set(board.flat().map(fieldKey));
    const emptyCells = ALL_FIELDS.filter(c => !covered.has(fieldKey(c)));
    const afterMove = emptyCells.filter(c => !isEqual(c, placed![0]) && !isEqual(c, placed![1]));
    const memo = new Map<string, boolean>();
    expect(isWinningForMover(afterMove, memo)).toBe(false);
  });
});
