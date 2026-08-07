import { runMatch, type MatchResult } from 'strategy-game-factory';
import { type Board, moves, generateStartBoard } from './gameplay';
import { grundy, xorSum, smartBotStrategy, randomBotStrategy } from './bot-strategy';

// An impartial game, so the piles are independent and a position is won for the
// mover exactly when the XOR of the pile values is non-zero. The bot leans
// entirely on the closed form for a single pile, which is what the first block
// below checks against a reference computed from the moves themselves.
type Bot = typeof smartBotStrategy

const play = (startBoard: Board, strategies: [Bot, Bot]): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

// The Grundy value of a pile of n, worked out from the two moves the game
// actually has — take one match, or split into two non-empty parts — rather
// than from the formula under test.
const referenceGrundy = (() => {
  const memo = new Map<number, number>([[0, 0]]);
  const value = (n: number): number => {
    if (memo.has(n)) return memo.get(n)!;
    const reachable = new Set<number>([value(n - 1)]);
    for (let firstPart = 1; firstPart < n; firstPart++) {
      reachable.add(value(firstPart) ^ value(n - firstPart));
    }
    let mex = 0;
    while (reachable.has(mex)) mex++;
    memo.set(n, mex);
    return mex;
  };
  return value;
})();

describe('grundy', () => {
  // Start piles hold 2-6 matches and every move only shrinks them, so this
  // range covers everything a real game can reach, with room to spare.
  it('matches a reference computed from the moves, for every reachable pile size', () => {
    for (let n = 0; n <= 12; n++) {
      expect(grundy(n)).toBe(referenceGrundy(n));
    }
  });

  it('is zero exactly for the empty pile and odd piles of three or more', () => {
    for (let n = 0; n <= 12; n++) {
      expect(grundy(n) === 0).toBe(n === 0 || (n >= 3 && n % 2 === 1));
    }
  });
});

describe('xorSum', () => {
  it('cancels two piles of the same size', () => {
    expect(xorSum([4, 4])).toBe(0);
    expect(xorSum([5, 5])).toBe(0);
  });

  it('is zero for a position lost for the mover, non-zero for a won one', () => {
    expect(xorSum([2, 2])).toBe(0);
    expect(xorSum([3, 5])).toBe(0);
    expect(xorSum([4, 6])).toBe(0);
    expect(xorSum([2, 5])).not.toBe(0);
    expect(xorSum([3, 4])).not.toBe(0);
  });
});

const WON_FOR_MOVER: Board[] = [[2, 5], [3, 4], [6, 5], [2, 3, 5], [4, 3, 3]];
const LOST_FOR_MOVER: Board[] = [[2, 2], [3, 5], [4, 6], [2, 4, 3], [5, 5]];

describe('smartBotStrategy', () => {
  it('moves to a zero position whenever the board offers one', () => {
    for (const board of WON_FOR_MOVER) {
      for (let trial = 0; trial < 10; trial++) {
        const { history } = play(board, [smartBotStrategy, randomBotStrategy]);
        expect(xorSum(history[0]!.board)).toBe(0);
      }
    }
  });

  it('wins as the mover from every won board, against a random opponent', () => {
    for (const board of WON_FOR_MOVER) {
      for (let trial = 0; trial < 10; trial++) {
        expect(play(board, [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
      }
    }
  });

  it('wins as the replier from every board lost for the mover', () => {
    for (const board of LOST_FOR_MOVER) {
      for (let trial = 0; trial < 10; trial++) {
        expect(play(board, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
      }
    }
  });

  it('wins from a won board even against optimal play', () => {
    for (const board of WON_FOR_MOVER) {
      expect(play(board, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('sees whichever side of a random start board it is on', () => {
    for (let trial = 0; trial < 30; trial++) {
      const board = generateStartBoard();
      const moverShouldWin = xorSum(board) !== 0;
      const { winnerIndex } = moverShouldWin
        ? play(board, [smartBotStrategy, randomBotStrategy])
        : play(board, [randomBotStrategy, smartBotStrategy]);
      expect(winnerIndex).toBe(moverShouldWin ? 0 : 1);
    }
  });
});

describe('randomBotStrategy', () => {
  it('takes the last match when the board offers it', () => {
    const { winnerIndex, history } = play([1], [randomBotStrategy, randomBotStrategy]);
    expect(history).toHaveLength(1);
    expect(winnerIndex).toBe(0);
  });
});
