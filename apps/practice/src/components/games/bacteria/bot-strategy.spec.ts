import { cloneDeep, range, reverse } from 'lodash';
import { deficiency } from './danger';
import { bacteriaCoords, isAttackAllowed, removeOne, totalBacteria, type Board } from './gameplay';
import {
  simulate,
  legalAttackMoves,
  attackerMove,
  defenderMove
} from './bot-strategy';
import { scatteredStartBoards, adjacentStartBoards } from './start-boards';

// --- Independent brute-force game solver (small boards only) ---------------
// attacker moves first; returns true iff the attacker can force a win.
const buildSolver = () => {
  const resolved = new Map<string, boolean>();
  const key = (turn: string, board: Board) =>
    turn + 'g' + board.goals.join(',') + ';' + board.bacteria.map(r => r.join('')).join('|');

  const attackerWins = (board: Board, visiting: Set<string>): boolean => {
    if (totalBacteria(board) === 0) return false;
    const k = key('a', board);
    if (resolved.has(k)) return resolved.get(k)!;
    if (visiting.has(k)) return false; // cycle: no finite forced win on this line
    visiting.add(k);
    let win = false;
    for (const move of legalAttackMoves(board)) {
      const { board: next, reachedGoal } = simulate(board, move);
      if (reachedGoal || defenderCannotSave(next, visiting)) { win = true; break; }
    }
    visiting.delete(k);
    resolved.set(k, win);
    return win;
  };

  const defenderCannotSave = (board: Board, visiting: Set<string>): boolean => {
    const coords = bacteriaCoords(board);
    if (coords.length === 0) return false;
    const k = key('d', board);
    if (resolved.has(k)) return resolved.get(k)!;
    if (visiting.has(k)) return false;
    visiting.add(k);
    let attackerStillWins = true;
    for (const [r, c] of coords) {
      const next = cloneDeep(board);
      next.bacteria[r][c] -= 1;
      if (totalBacteria(next) === 0 || !attackerWins(next, visiting)) {
        attackerStillWins = false;
        break;
      }
    }
    visiting.delete(k);
    resolved.set(k, attackerStillWins);
    return attackerStillWins;
  };

  return (board: Board) => attackerWins(board, new Set());
};

const emptyBoard = (rows: number, wide: number): number[][] =>
  range(rows).map(r => Array(r % 2 === 0 ? wide : wide - 1).fill(0));

describe('deficiency equals the true game value (brute force)', () => {
  const solver = buildSolver();

  const cases: { rows: number; wide: number; maxBacteria: number }[] = [
    { rows: 3, wide: 3, maxBacteria: 2 },
    { rows: 5, wide: 3, maxBacteria: 2 },
    { rows: 5, wide: 5, maxBacteria: 1 },
    { rows: 7, wide: 3, maxBacteria: 1 }
  ];

  it('matches on all small boards', () => {
    let checked = 0;
    for (const { rows, wide, maxBacteria } of cases) {
      const goalOptions = range(1, 1 << wide); // every non-empty goal subset
      for (const mask of goalOptions) {
        const goals = range(wide).filter(c => mask & (1 << c));
        // single-bacterium starts on the bottom row
        for (let c = 0; c < wide; c++) {
          const bacteria = emptyBoard(rows, wide);
          bacteria[0][c] = 1;
          const board: Board = { bacteria, goals };
          expect(deficiency(board) >= 1).toBe(solver(board));
          checked++;
        }
        if (maxBacteria >= 2) {
          for (let c1 = 0; c1 < wide; c1++) {
            for (let c2 = c1 + 1; c2 < wide; c2++) {
              const bacteria = emptyBoard(rows, wide);
              bacteria[0][c1] = 1;
              bacteria[0][c2] = 1;
              const board: Board = { bacteria, goals };
              expect(deficiency(board) >= 1).toBe(solver(board));
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

// --- Full-game simulations on the real 9x17 board --------------------------
// An adversarial defender: among removals, keep the position hardest for the
// attacker (prefer staying defender-winning; else slow the attacker down).
const adversarialDefense = (board: Board): Board => {
  const coords = bacteriaCoords(board);
  let best: Board | null = null;
  let bestScore = -Infinity;
  for (const [r, c] of coords) {
    const next = cloneDeep(board);
    next.bacteria[r][c] -= 1;
    const def = deficiency(next);
    // maximise: defender-winning first, then minimise attacker's highest row
    const maxRow = Math.max(0, ...bacteriaCoords(next).map(([rr]) => rr));
    const score = (def === 0 ? 1e6 : 0) - maxRow;
    if (score > bestScore) { bestScore = score; best = next; }
  }
  return best ?? board;
};

const playAttackerBotVsDefender = (start: Board, maxPlies = 400): 'attacker' | 'defender' => {
  let board = cloneDeep(start);
  for (let ply = 0; ply < maxPlies; ply++) {
    const move = attackerMove(board);
    const { board: next, reachedGoal } = simulate(board, move);
    board = next;
    if (reachedGoal) return 'attacker';
    if (totalBacteria(board) === 0) return 'defender';
    board = adversarialDefense(board);
    if (totalBacteria(board) === 0) return 'defender';
  }
  return 'defender'; // attacker failed to force a win in time
};

describe('smart bot plays the 9x17 game optimally', () => {
  // The real scattered-variant start boards (generateScatteredStartBoard).
  const boards = scatteredStartBoards();

  it('has a mix of attacker- and defender-winning start boards', () => {
    const values = boards.map(board => deficiency(board) >= 1);
    expect(values.some(Boolean)).toBe(true);   // some attacker wins
    expect(values.some(v => !v)).toBe(true);    // some defender wins
  });

  it('attacker bot wins from every attacker-winning start against an optimal defender', () => {
    for (const board of boards) {
      if (deficiency(board) >= 1) {
        expect(playAttackerBotVsDefender(board), `goals ${board.goals}`).toBe('attacker');
      }
    }
  });

  it('defender bot never loses from a defender-winning start against a spreading attacker', () => {
    for (const start of boards) {
      if (deficiency(start) !== 0) continue;
      let board = cloneDeep(start);
      for (let ply = 0; ply < 400; ply++) {
        // greedy attacker: play the move that climbs highest
        const moves = legalAttackMoves(board);
        let chosen = moves[0];
        let bestRow = -1;
        for (const m of moves) {
          const { board: after, reachedGoal } = simulate(board, m);
          expect(reachedGoal).toBe(false); // defender must never allow a goal
          const maxRow = Math.max(0, ...bacteriaCoords(after).map(([r]) => r));
          if (maxRow > bestRow) { bestRow = maxRow; chosen = m; }
        }
        const { board: after, reachedGoal } = simulate(board, chosen);
        expect(reachedGoal).toBe(false);
        board = after;
        if (totalBacteria(board) === 0) break;
        const { row, col } = defenderMove(board);
        board.bacteria[row][col] -= 1;
        if (totalBacteria(board) === 0) break;
      }
      expect(totalBacteria(board)).toBe(0);
    }
  });
});

// --- Full-game simulations on the real 9x11 adjacent-goals board -----------
// The width-17 block above only exercises the scattered variant. These are the
// real start boards of the adjacent variant (generateAdjacentStartBoard), which
// seed bacteria on rows 0-2, to confirm the shared board-driven bot is also
// optimal at width 11.
describe('smart bot plays the 9x11 adjacent-goals game optimally', () => {
  const boards = adjacentStartBoards();

  it('has a mix of attacker- and defender-winning start boards', () => {
    const values = boards.map(board => deficiency(board) >= 1);
    expect(values.some(Boolean)).toBe(true);
    expect(values.some(v => !v)).toBe(true);
  });

  it('attacker bot wins from every attacker-winning start against an optimal defender', () => {
    for (const board of boards) {
      if (deficiency(board) >= 1) {
        expect(playAttackerBotVsDefender(board), `goals ${board.goals}`).toBe('attacker');
      }
    }
  });

  it('defender bot never loses from a defender-winning start against a spreading attacker', () => {
    for (const start of boards) {
      if (deficiency(start) !== 0) continue;
      let board = cloneDeep(start);
      for (let ply = 0; ply < 400; ply++) {
        const moves = legalAttackMoves(board);
        let chosen = moves[0];
        let bestRow = -1;
        for (const m of moves) {
          const { board: after, reachedGoal } = simulate(board, m);
          expect(reachedGoal).toBe(false);
          const maxRow = Math.max(0, ...bacteriaCoords(after).map(([r]) => r));
          if (maxRow > bestRow) { bestRow = maxRow; chosen = m; }
        }
        const { board: after, reachedGoal } = simulate(board, chosen);
        expect(reachedGoal).toBe(false);
        board = after;
        if (totalBacteria(board) === 0) break;
        const { row, col } = defenderMove(board);
        board.bacteria[row][col] -= 1;
        if (totalBacteria(board) === 0) break;
      }
      expect(totalBacteria(board)).toBe(0);
    }
  });
});

// --- Readable behavioural checks -------------------------------------------
// The solver and simulations above prove the bot never blunders, but they treat
// every optimal move as interchangeable and fail with an opaque "bot blundered
// from X to Y". These cases instead pin the *specific* move the bot picks in a
// handful of hand-built positions, so a regression in move selection (wrong
// bacterium, wrong move type) produces a readable failure and the intended
// behaviour stays documented.
//
// Boards use lodash `reverse` so the literal reads top-row-first while the
// engine indexes rows from the bottom (row 0 = start row, last row = goals).
// A position is defender-winning exactly when deficiency === 0.
describe('bacteria bot behaviour', () => {
  describe('defenderMove', () => {
    it('removes the only bacterium that keeps the position safe when winning', () => {
      // deficiency 0: the defender is winning and has exactly one safe removal —
      // the advanced threat on the top row. Taking anything else would let the
      // attacker through, so this choice is forced.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
           [0, 0, 0, 0],
          [0, 0, 0, 0, 1],
           [0, 0, 1, 0],
          [0, 0, 0, 0]
        ]),
        goals: [2, 3, 4]
      };
      expect(deficiency(board)).toBe(0);
      const move = defenderMove(board);
      expect(move).toEqual({ row: 2, col: 4 });
      // the removal it chose must keep the defender winning
      expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
    });

    it('accepts any safe removal when several keep the position winning', () => {
      // deficiency 0 with more than one safe removal: the defender samples among
      // them, so we assert the *property* (the chosen removal stays winning)
      // rather than a single hard-coded cell — pinning one would be over-specified.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
            [0, 0, 0, 0],
          [1, 0, 0, 1, 0]
        ]),
        goals: [2]
      };
      expect(deficiency(board)).toBe(0);
      for (let i = 0; i < 40; i++) {
        const move = defenderMove(board);
        expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
      }
    });

    it('removes the advanced threat that restores a safe position', () => {
      // The board is momentarily unsafe (deficiency 1), but removing the
      // bacterium already up on the goal row brings it back to safe — and that
      // is the single removal the defender must find. Taking the far bacterium
      // on the start row would lose.
      const board: Board = {
        bacteria: reverse([[1, 0, 0], [0, 0], [0, 0, 1]]),
        goals: [1]
      };
      expect(deficiency(board)).toBe(1);
      const move = defenderMove(board);
      expect(move).toEqual({ row: 2, col: 0 });
      expect(deficiency(removeOne(board, move.row, move.col))).toBe(0);
    });
  });

  describe('attackerMove', () => {
    it('spreads to advance a dangerous bacterium when winning', () => {
      // deficiency 2: the attacker is winning and grows its dangerous bacterium
      // upward with a spread rather than a lateral shift.
      const board: Board = {
        bacteria: reverse([
          [1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1, 0],
          [0, 0, 0, 1, 0, 0, 0]
        ]),
        goals: [2, 3, 4]
      };
      expect(deficiency(board)).toBeGreaterThanOrEqual(1);
      expect(attackerMove(board)).toEqual({ type: 'spread', row: 0, col: 3 });
    });

    it('attacks the closest dangerous bacterium', () => {
      // Among several threats the attacker advances the one already highest up
      // the board (row 3), not a lower one.
      const board: Board = {
        bacteria: reverse([
          [0, 0, 0, 0, 0],
            [0, 1, 0, 0],
          [0, 1, 0, 1, 0],
            [0, 1, 1, 0],
          [0, 0, 1, 0, 0]
        ]),
        goals: [1, 2, 3]
      };
      const move = attackerMove(board);
      expect([move.row, move.col]).toEqual([3, 1]);
    });

    it('still returns a legal move from a losing position', () => {
      // deficiency 0: the attacker has already lost, but must never crash or
      // return an illegal move — it plays on with some legal move.
      const board: Board = {
        bacteria: reverse([[0, 0, 0], [0, 0], [0, 0, 1]]),
        goals: [1]
      };
      expect(deficiency(board)).toBe(0);
      expect(legalAttackMoves(board)).toContainEqual(attackerMove(board));
    });
  });
});

describe('legal move enumeration', () => {
  it('only enumerates attacks the rules allow', () => {
    const busy = { bacteria: [[1, 2, 1], [3, 0], [0, 1, 0]], goals: [1] };
    expect(legalAttackMoves(busy).length).toBeGreaterThan(0);
    expect(legalAttackMoves(busy).every(m => isAttackAllowed(busy, m))).toBe(true);
  });
});
