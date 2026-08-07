import { runMatch } from 'strategy-game-factory';
import { isLostForMover, moves, type Board } from './gameplay';
import { makeCtx } from 'test-utils';
import { planTurn, smartBotStrategy, randomBotStrategy } from './bot-strategy';

describe('coins-in-3-piles planTurn', () => {
  it('evens out both odd piles when two piles are odd', () => {
    expect(planTurn([3, 2, 5])).toEqual({ remove: 3, add: 1 });
    expect(planTurn([5, 1, 0])).toEqual({ remove: 2, add: 1 });
  });

  it('takes from the only odd pile, placing nothing back', () => {
    expect(planTurn([0, 1, 0])).toEqual({ remove: 2, add: null });
    expect(planTurn([4, 1, 2])).toEqual({ remove: 2, add: null });
  });

  it('takes the cheapest coin available from a lost position', () => {
    expect(planTurn([0, 2, 4])).toEqual({ remove: 2, add: null });
    expect(planTurn([1, 5, 3])).toEqual({ remove: 1, add: null });
  });
});

describe('coins-in-3-piles bot moves', () => {
  it('names the take and the place-back as one turn', () => {
    expect(smartBotStrategy({ board: [3, 2, 5], ctx: makeCtx() })).toEqual([
      { move: 'removeCoin', args: [3] },
      { move: 'addCoin', args: [1] }
    ]);
  });

  it('names no place-back after taking a 1-pengő coin, which ends the turn', () => {
    expect(smartBotStrategy({ board: [1, 5, 3], ctx: makeCtx() })).toEqual([
      { move: 'removeCoin', args: [1] }
    ]);
  });

  it('names passing when nothing may be placed back', () => {
    expect(smartBotStrategy({ board: [0, 1, 0], ctx: makeCtx() })).toEqual([
      { move: 'removeCoin', args: [2] },
      { move: 'passAddition' }
    ]);
  });
});

// A full-strength optimality check: from a position the mover can win, the
// smart bot must win as the mover; from one it cannot, every move loses, so the
// smart bot must win as the replier no matter what the random bot does.
describe('coins-in-3-piles smartBotStrategy', () => {
  const smallBoards: Board[] = [];
  for (let ones = 0; ones <= 4; ones++) {
    for (let twos = 0; twos <= 4; twos++) {
      for (let threes = 0; threes <= 4; threes++) {
        if (ones + twos + threes > 0) smallBoards.push([ones, twos, threes]);
      }
    }
  }

  const winnerAgainstRandom = (startBoard: Board, smartSeat: 0 | 1) => runMatch({
    gameplay: { moves },
    strategies: smartSeat === 0
      ? [smartBotStrategy, randomBotStrategy]
      : [randomBotStrategy, smartBotStrategy],
    startBoard
  }).winnerIndex;

  it('wins from every winning start board, playing first', () => {
    for (const board of smallBoards.filter(board => !isLostForMover(board))) {
      for (let trial = 0; trial < 3; trial++) {
        expect(winnerAgainstRandom(board, 0), `board ${board}`).toBe(0);
      }
    }
  });

  it('wins from every losing start board, playing second', () => {
    for (const board of smallBoards.filter(isLostForMover)) {
      for (let trial = 0; trial < 3; trial++) {
        expect(winnerAgainstRandom(board, 1), `board ${board}`).toBe(1);
      }
    }
  });

  // The competition's own 3-5-7 setup: all three piles odd, so the opener is
  // lost and optimal play on both sides has to bear that out.
  it('wins as the replier from 3-5-7 in optimal-vs-optimal play', () => {
    expect(runMatch({
      gameplay: { moves },
      strategies: [smartBotStrategy, smartBotStrategy],
      startBoard: [3, 5, 7]
    }).winnerIndex).toBe(1);
  });
});
