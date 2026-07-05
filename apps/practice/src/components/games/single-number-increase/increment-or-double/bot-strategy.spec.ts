import { getBotNextNumber } from './increment-or-double';

const target = 99;

// Independent brute-force solve of the game to lock in the analysis: the mover
// (who must say x+1 or 2x) wins from `board` iff there is a move to a number <=
// target from which the opponent loses. A number > target is an immediate loss.
const solveWinningPositions = () => {
  const wins: boolean[] = [];
  for (let x = target; x >= 1; x--) {
    const moves = [x + 1, x * 2].filter(y => y <= target);
    wins[x] = moves.some(y => !wins[y]);
  }
  return wins;
};

describe('increment-or-double game analysis', () => {
  it('mover wins exactly when the last number is even', () => {
    const wins = solveWinningPositions();
    for (let x = 1; x <= target; x++) {
      expect(wins[x]).toBe(x % 2 === 0);
    }
  });

  it('the starting player (who must say 1) wins', () => {
    const wins = solveWinningPositions();
    // After the forced opening "1", the other player is to move from x = 1 and
    // loses, so the starter wins.
    expect(wins[1]).toBe(false);
  });
});

describe('increment-or-double getBotNextNumber', () => {
  it('plays the unique winning move x+1 from an even board (incl. the forced opening 0 -> 1)', () => {
    const wins = solveWinningPositions();
    for (let board = 0; board < target; board += 2) {
      expect(getBotNextNumber(board)).toBe(board + 1);
      // The move is genuinely winning: it hands the opponent a losing position.
      expect(board + 1).toBeLessThanOrEqual(target);
      expect(wins[board + 1]).toBe(false);
    }
  });

  it('from an odd (losing) board plays either x+1 or 2x, both even', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 300; i++) {
      const next = getBotNextNumber(7);
      expect([8, 14]).toContain(next);
      expect(next % 2).toBe(0);
      seen.add(next);
    }
    expect(seen).toEqual(new Set([8, 14]));
  });
});
