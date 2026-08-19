import { describe, expect, it } from 'vitest';
import { startBoardIndexForTally } from './start-board-policy';

const tally = (losses: number, streak: number) => ({ losses, streak, tries: 0, points: 0 });

describe('startBoardIndexForTally', () => {
  // The old 19ocd startingPosition: streak even → the first board, odd → the
  // second, whatever was lost before — a single pair reads as streak alone.
  it('a two-board list is indexed by the streak alone', () => {
    expect(startBoardIndexForTally(tally(0, 0), 2)).toBe(0);
    expect(startBoardIndexForTally(tally(0, 1), 2)).toBe(1);
    expect(startBoardIndexForTally(tally(4, 0), 2)).toBe(0);
    expect(startBoardIndexForTally(tally(4, 1), 2)).toBe(1);
  });

  // The old stones table: initialPositions[min(numberOfLoss, 5)][winningStreak].
  it('a twelve-board list walks loss-indexed pairs and clamps at the last', () => {
    expect(startBoardIndexForTally(tally(0, 0), 12)).toBe(0);
    expect(startBoardIndexForTally(tally(0, 1), 12)).toBe(1);
    expect(startBoardIndexForTally(tally(2, 0), 12)).toBe(4);
    expect(startBoardIndexForTally(tally(2, 1), 12)).toBe(5);
    expect(startBoardIndexForTally(tally(5, 1), 12)).toBe(11);
    expect(startBoardIndexForTally(tally(9, 0), 12)).toBe(10);
    expect(startBoardIndexForTally(tally(9, 1), 12)).toBe(11);
  });

  it('rejects a list that cannot be pairs', () => {
    expect(() => startBoardIndexForTally(tally(0, 0), 3)).toThrow(/pairs/);
    expect(() => startBoardIndexForTally(tally(0, 0), 0)).toThrow(/pairs/);
  });
});
