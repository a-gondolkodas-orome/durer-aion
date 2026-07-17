import { cloneDeep, range } from "lodash";
import { deficiency } from "./danger";
import {
  type Board,
  bacteriaCoords,
  totalBacteria
} from "./helpers";
import {
  simulate,
  legalAttackMoves,
  attackerMove,
  defenderMove
} from "./bot-strategy";
import { scatteredStartBoards, adjacentStartBoards } from "./start-boards";

// --- Independent brute-force game solver (small boards only) ---------------
// attacker moves first; returns true iff the attacker can force a win.
const buildSolver = () => {
  const resolved = new Map<string, boolean>();
  const key = (turn: string, board: Board) =>
    turn + "g" + board.goals.join(",") + ";" + board.bacteria.map(r => r.join("")).join("|");

  const attackerWins = (board: Board, visiting: Set<string>): boolean => {
    if (totalBacteria(board) === 0) return false;
    const k = key("a", board);
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
    const k = key("d", board);
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

describe("deficiency equals the true game value (brute force)", () => {
  const solver = buildSolver();

  const cases: { rows: number; wide: number; maxBacteria: number }[] = [
    { rows: 3, wide: 3, maxBacteria: 2 },
    { rows: 5, wide: 3, maxBacteria: 2 },
    { rows: 5, wide: 5, maxBacteria: 1 },
    { rows: 7, wide: 3, maxBacteria: 1 }
  ];

  it("matches on all small boards", () => {
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

const playAttackerBotVsDefender = (start: Board, maxPlies = 400): "attacker" | "defender" => {
  let board = cloneDeep(start);
  for (let ply = 0; ply < maxPlies; ply++) {
    const move = attackerMove(board);
    const { board: next, reachedGoal } = simulate(board, move);
    board = next;
    if (reachedGoal) return "attacker";
    if (totalBacteria(board) === 0) return "defender";
    board = adversarialDefense(board);
    if (totalBacteria(board) === 0) return "defender";
  }
  return "defender"; // attacker failed to force a win in time
};

describe("smart bot plays the 9x17 game optimally", () => {
  // The real scattered-variant start boards (generateScatteredStartBoard).
  const boards = scatteredStartBoards();

  it("has a mix of attacker- and defender-winning start boards", () => {
    const values = boards.map(board => deficiency(board) >= 1);
    expect(values.some(Boolean)).toBe(true);   // some attacker wins
    expect(values.some(v => !v)).toBe(true);    // some defender wins
  });

  it("attacker bot wins from every attacker-winning start against an optimal defender", () => {
    for (const board of boards) {
      if (deficiency(board) >= 1) {
        expect(playAttackerBotVsDefender(board), `goals ${board.goals}`).toBe("attacker");
      }
    }
  });

  it("defender bot never loses from a defender-winning start against a spreading attacker", () => {
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
describe("smart bot plays the 9x11 adjacent-goals game optimally", () => {
  const boards = adjacentStartBoards();

  it("has a mix of attacker- and defender-winning start boards", () => {
    const values = boards.map(board => deficiency(board) >= 1);
    expect(values.some(Boolean)).toBe(true);
    expect(values.some(v => !v)).toBe(true);
  });

  it("attacker bot wins from every attacker-winning start against an optimal defender", () => {
    for (const board of boards) {
      if (deficiency(board) >= 1) {
        expect(playAttackerBotVsDefender(board), `goals ${board.goals}`).toBe("attacker");
      }
    }
  });

  it("defender bot never loses from a defender-winning start against a spreading attacker", () => {
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
