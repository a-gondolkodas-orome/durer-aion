import { botMovedLast, GUESSER_PLAYER, JUDGE_PLAYER } from './types';

describe('botMovedLast', () => {
  test("is the bot's on the team's turn, and not on its own", () => {
    expect(botMovedLast({ winner: null }, { currentPlayer: GUESSER_PLAYER })).toBe(true);
    expect(botMovedLast({ winner: null }, { currentPlayer: JUDGE_PLAYER })).toBe(false);
  });

  // A winning move ends the game, not the turn: the winner is still to move.
  test('is the winner\'s once a move has won', () => {
    expect(botMovedLast({ winner: JUDGE_PLAYER }, { currentPlayer: JUDGE_PLAYER })).toBe(true);
    expect(botMovedLast({ winner: GUESSER_PLAYER }, { currentPlayer: GUESSER_PLAYER })).toBe(false);
  });
});
