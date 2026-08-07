import { runMatch, type MatchResult } from 'strategy-game-factory';
import {
  type Board, type Grid, applyMove, isEmpty, getAllMoves, moves
} from './gameplay';
import { grundy, boardGrundy, smartBotStrategy, randomBotStrategy } from './bot-strategy';

const full = (rows: number, cols: number): Grid =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));

// Play a real game through the engine: the same moves, validators and win
// detection the site runs on.
const play = (
  grid: Grid, strategies: [typeof smartBotStrategy, typeof smartBotStrategy]
): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard: { grid } });

// The board the first bot produced, for judging a single decision.
const afterFirstMove = (grid: Grid) =>
  play(grid, [smartBotStrategy, randomBotStrategy]).history[0]!.board.grid;

describe('grundy', () => {
  it('is zero exactly when both sides are even', () => {
    for (let a = 1; a <= 8; a++) {
      for (let b = 1; b <= 8; b++) {
        const bothEven = a % 2 === 0 && b % 2 === 0;
        expect(grundy(a, b) === 0).toBe(bothEven);
      }
    }
  });

  it('is symmetric', () => {
    expect(grundy(3, 5)).toBe(grundy(5, 3));
    expect(grundy(2, 7)).toBe(grundy(7, 2));
  });
});

describe('boardGrundy', () => {
  it('xors the values of independent rectangles', () => {
    // two identical rectangles cancel to zero
    const grid: Grid = [
      [true, true, false, true, true],
      [true, true, false, true, true],
      [true, true, false, true, true]
    ];
    expect(boardGrundy(grid)).toBe(0);
  });
});

describe('smartBotStrategy', () => {
  it('moves to a zero (losing-for-opponent) position from a winning board', () => {
    for (const [r, c] of [[3, 3], [1, 4], [2, 3], [5, 2], [3, 6]] as const) {
      expect(boardGrundy(afterFirstMove(full(r, c)))).toBe(0);
    }
  });

  it('wins as the first mover from every odd-sided board vs the random bot', () => {
    for (const [r, c] of [[3, 3], [1, 4], [2, 3], [5, 4], [3, 6]] as const) {
      for (let trial = 0; trial < 20; trial++) {
        expect(play(full(r, c), [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
      }
    }
  });

  it('wins as the second mover from every both-even board vs the random bot', () => {
    for (const [r, c] of [[2, 2], [2, 4], [4, 4], [6, 2]] as const) {
      for (let trial = 0; trial < 20; trial++) {
        expect(play(full(r, c), [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
      }
    }
  });

  it('the first mover wins an odd-sided board even in optimal-vs-optimal play', () => {
    expect(play(full(3, 5), [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
  });

  it('from a lost position usually keeps the game alive, conceding only ~25%', () => {
    // 2×8 is lost for the mover; removing a row leaves a trivially-won 1×8,
    // while removing a column keeps a real 2×7. The bot should mostly keep it
    // alive and only occasionally concede fast.
    const trials = 400;
    let conceded = 0;
    for (let i = 0; i < trials; i++) {
      const next = afterFirstMove(full(2, 8));
      if (getAllMoves(next).some(m => isEmpty(applyMove(next, m)))) conceded++;
    }
    const rate = conceded / trials;
    // both behaviours occur, and keeping the game alive dominates (~75%)
    expect(conceded).toBeGreaterThan(0);
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.4);
  });
});

describe('randomBotStrategy', () => {
  it('takes an immediate winning move when one exists', () => {
    // a single row of discs: removing it empties the board in one move
    const { winnerIndex, history } = play(
      [[true, true, true, true]], [randomBotStrategy, randomBotStrategy]
    );
    expect(history).toHaveLength(1);
    expect(winnerIndex).toBe(0);
  });
});
