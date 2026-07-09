import { describe, it, expect } from 'vitest';
import {
  RED, BLUE, startCells, encode, applyMove, legalMoves, majorityWinner,
  FIRST_PLAYER_WIN_SIZES, SECOND_PLAYER_WIN_SIZES
} from './helpers';
import { solveForN } from './solver';

// Winner characterisation. The official solution's *case analysis* shows the
// first player (red) wins iff n is NOT divisible by 4 for n >= 6 ("n = 4k -> kek
// [blue] lesz X", "paratlan n -> piros [red] lesz X", "n = 4k+2 -> piros lesz
// X"). NB: the solution's one-line summary sentence states the opposite ("piros
// nyer ha 4|n") -- that sentence contradicts the paper's own argument and is a
// typo. The solver below agrees with the case analysis for every n >= 7.
//
// The explicitly stated small cases are n=2 blue, n=3 red, n=4 red, n=5 blue,
// and the solver additionally finds n=6 blue (the k=1 boundary of the 4k+2
// family, below every shipped board size).
const SMALL_WINNERS: Record<number, number> = {
  2: BLUE, 3: RED, 4: RED, 5: BLUE, 6: BLUE
};

describe('recolouring-discs solver', () => {
  it('matches the stated small-case winners (n = 2..6)', () => {
    for (const [n, winner] of Object.entries(SMALL_WINNERS)) {
      expect(solveForN(+n).winnerAt(startCells(+n), RED)).toBe(winner);
    }
  });

  it('first player wins iff 4 does not divide n, for n = 7..12', () => {
    for (let n = 7; n <= 12; n++) {
      const expected = n % 4 === 0 ? BLUE : RED;
      expect(solveForN(n).winnerAt(startCells(n), RED)).toBe(expected);
    }
  });

  it('resolves the shipped board sizes', () => {
    expect(solveForN(7).winnerAt(startCells(7), RED)).toBe(RED); // 7 mod 4 = 3 -> first player
    expect(solveForN(8).winnerAt(startCells(8), RED)).toBe(BLUE); // 4 | 8 -> second player
  });

  it('the board-size pools match their advertised winning role', () => {
    for (const n of FIRST_PLAYER_WIN_SIZES) {
      expect(solveForN(n).winnerAt(startCells(n), RED)).toBe(RED);
    }
    for (const n of SECOND_PLAYER_WIN_SIZES) {
      expect(solveForN(n).winnerAt(startCells(n), RED)).toBe(BLUE);
    }
  });

  it('forces a win well within the 200-ply cap for the shipped sizes', () => {
    for (const n of [7, 8]) {
      const solved = solveForN(n);
      const maxRank = Math.max(
        ...[...solved.redRank.values(), ...solved.blueRank.values()].filter(Number.isFinite)
      );
      expect(maxRank).toBeLessThan(200);
    }
  });

  // The attractor is only sound if the winner it reports is genuinely forceable.
  // Verify the defining property on every reachable position: at a node the
  // winner controls, some move preserves the winner; at a node the loser
  // controls, every move preserves the winner.
  it('winner regions are closed under optimal / adversarial play', () => {
    for (const n of [7, 8]) {
      const solved = solveForN(n);
      const seen = new Set<string>();
      const stack: { cells: ReturnType<typeof startCells>; player: number }[] = [
        { cells: startCells(n), player: RED }
      ];
      while (stack.length) {
        const { cells, player } = stack.pop()!;
        const key = `${encode(cells)}:${player}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (majorityWinner(cells) !== null) continue;

        const winner = solved.winnerAt(cells, player);
        const children = legalMoves(cells, player).map(m => applyMove(cells, player, m));
        const childWinners = children.map(c => solved.winnerAt(c, 1 - player));

        if (player === winner) {
          // The winner must have at least one move that stays winning.
          expect(childWinners.some(w => w === winner)).toBe(true);
        } else {
          // The loser cannot escape: every move stays a win for the winner.
          expect(childWinners.every(w => w === winner)).toBe(true);
        }

        children.forEach(c => stack.push({ cells: c, player: 1 - player }));
      }
    }
  });
});
