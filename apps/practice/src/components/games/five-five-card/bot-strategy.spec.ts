import { runMatch, type MatchResult } from '../../strategy-game-factory';
import { type Board, getWinnerIndex, moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// Each player takes cards from the *other* hand, so over the eight moves each
// side decides which single card its opponent is left with. The second player
// moves last, which is what makes the whole game theirs.
type Bot = typeof smartBotStrategy

// generateStartBoard lives in the game .tsx; this is the same deal.
const START: Board = [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]];

const play = (startBoard: Board, strategies: [Bot, Bot]): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

// Solved offline against the real getWinnerIndex: the opening is a second-player
// win, and so is every position still holding four cards a side — the first
// player never gets a chance to take the game. The earliest boards it can win
// from have three cards each.
const WON_FOR_MOVER: Board = [[null, 2, null, 4, 5], [null, null, 3, 4, 5]];
const LOST_FOR_MOVER_AT_FOUR: Board = [[null, 2, 3, 4, 5], [null, 2, 3, 4, 5]];

describe('smartBotStrategy', () => {
  it('wins as the second player from the real start board, against a random opponent', () => {
    for (let trial = 0; trial < 40; trial++) {
      expect(play(START, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  it('wins as the second player from the start board even against optimal play', () => {
    for (let trial = 0; trial < 10; trial++) {
      expect(play(START, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  // Whatever the first player opens with, the game is still the second
  // player's — there is no recovering opening to find.
  it('still wins as the second player once each hand is down to four', () => {
    for (let trial = 0; trial < 20; trial++) {
      expect(play(LOST_FOR_MOVER_AT_FOUR, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  it('wins as the mover from a board that is winnable for the mover', () => {
    for (let trial = 0; trial < 40; trial++) {
      expect(play(WON_FOR_MOVER, [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('wins as the mover there even against optimal play', () => {
    for (let trial = 0; trial < 20; trial++) {
      expect(play(WON_FOR_MOVER, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
    }
  });

  // There is deliberately no "wins as the first player from the start board"
  // case: no such line exists, so the assertion could only be written by
  // weakening it into something that proves nothing.
});

describe('the game itself', () => {
  it('always ends with one card each, after eight removals', () => {
    const { board, history } = play(START, [randomBotStrategy, randomBotStrategy]);
    expect(history).toHaveLength(8);
    expect(board[0]!.filter(v => v !== null)).toHaveLength(1);
    expect(board[1]!.filter(v => v !== null)).toHaveLength(1);
    expect(getWinnerIndex(board)).toBeDefined();
  });
});

describe('randomBotStrategy', () => {
  it('only ever names a card still lying in the opponent hand', () => {
    for (let trial = 0; trial < 30; trial++) {
      // runMatch throws on a move its validator rejects, so completing is the
      // assertion; this pins that it is the *opponent* hand it reads.
      expect(play(START, [randomBotStrategy, randomBotStrategy]).history).toHaveLength(8);
    }
  });
});
