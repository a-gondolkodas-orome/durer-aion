import { isEqual } from 'lodash';
import { runMatch, type MatchResult } from '../../../strategy-game-factory';
import { type Board, generateStartBoard, moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// Six squares are placed in all, and only the final board decides: player 1
// wins if the four counts end up all distinct (0,1,2,3), player 0 otherwise.
// Turn parity is fixed — player 0 places at even sums — so a board's sum says
// whose move it is, and every start board below is one a real game can reach.
type Bot = typeof smartBotStrategy

const play = (startBoard: Board, strategies: [Bot, Bot]): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

// Lost for whoever is to move: two squares left, and player 1 places the last
// one whatever player 0 does. [3,2,0,0] and [2,2,1,0] both let it finish on
// 0,1,2,3.
const LOST_FOR_MOVER: Board = [2, 2, 0, 0];

const isAllDistinct = (board: Board) => isEqual([...board].sort(), [0, 1, 2, 3]);

describe('smartBotStrategy', () => {
  // The opening is a first-player win, and — unusually — every first move keeps
  // it, so there is no opening decision to get wrong. What has to hold is that
  // the bot never loses the win later.
  it('wins as the first player from the start board, against a random opponent', () => {
    for (let trial = 0; trial < 60; trial++) {
      expect(play(generateStartBoard(), [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('wins as the first player even against optimal play', () => {
    for (let trial = 0; trial < 20; trial++) {
      expect(play(generateStartBoard(), [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('wins as the second player from a board lost for the mover', () => {
    for (let trial = 0; trial < 60; trial++) {
      expect(play(LOST_FOR_MOVER, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  it('wins as the second player there even when the mover plays optimally', () => {
    for (let trial = 0; trial < 20; trial++) {
      expect(play(LOST_FOR_MOVER, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  // Reading the decision rather than only the result: from the lost board the
  // reply is forced to land on 0,1,2,3, whichever square the mover took.
  it('answers every mover choice with the square that completes 0,1,2,3', () => {
    for (let trial = 0; trial < 40; trial++) {
      const { board, winnerIndex } = play(LOST_FOR_MOVER, [randomBotStrategy, smartBotStrategy]);
      expect(isAllDistinct(board)).toBe(true);
      expect(winnerIndex).toBe(1);
    }
  });
});

describe('randomBotStrategy', () => {
  it('only ever names squares that exist', () => {
    for (let trial = 0; trial < 40; trial++) {
      const { history } = play(generateStartBoard(), [randomBotStrategy, randomBotStrategy]);
      for (const { args } of history) {
        expect(args[0]).toBeTypeOf('number');
        expect(args[0] as number).toBeGreaterThanOrEqual(0);
        expect(args[0] as number).toBeLessThan(4);
      }
    }
  });
});
