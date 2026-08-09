import { runMatch } from 'strategy-game-factory';
import { randomBotStrategy } from './bot-strategy';
import { moves, type Board } from './gameplay';

// The random bot reads the number of piles off the board, so one spec covers
// all three sibling games. `runMatch` throws on a move the rules reject, which
// is the assertion here: whatever it picks, both halves of the turn are legal —
// including on boards where only one pile can be split, so most removals are
// not allowed at all.
const startBoards: Board[] = [[2, 3], [1, 4], [3, 5, 4], [1, 1, 4], [2, 6, 3, 7], [1, 1, 1, 5]];

// It picks at random, so each board has to hold for every draw it can make.
const ITERATIONS = 20;

describe('random pile-splitting bot', () => {
  it.each(startBoards)('only ever plays legal turns, from %j', (...startBoard) => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { winnerIndex } = runMatch({
        gameplay: { moves },
        strategies: [randomBotStrategy, randomBotStrategy],
        startBoard
      });
      expect([0, 1]).toContain(winnerIndex);
    }
  });
});
