import { isGameEnd, hasFirstPlayerWon } from "./helpers";

describe('isGameEnd', () => {
  it('should end game if there are 3 in a row', () => {
    const board = [
      'blue', 'blue', 'blue',
      'blue', 'red', 'red',
      'red', null, 'red'
    ];
    expect(isGameEnd(board)).toBe(true);
  });

  it('should end game if the table is full', () => {
    const board = [
      'blue', 'red', 'blue',
      'blue', 'red', 'red',
      'red', 'blue', 'red'
    ];
    expect(isGameEnd(board)).toBe(true);
  });
});

describe('hasFirstPlayerWon', () => {
  it('should end game if the table is full', () => {
    const board = [
      'blue', 'red', 'blue',
      'blue', 'red', 'red',
      'red', 'blue', 'red'
    ];
    expect(hasFirstPlayerWon(board)).toBe(true);
  });

  it('should declare 1st player loser when they make 3-in-a-row early (anti-tictactoe)', () => {
    // red (1st player) completes top row on the 5th overall piece (odd count)
    const board = [
      'red', 'red', 'red',
      'blue', 'blue', null,
      null, null, null
    ];
    expect(isGameEnd(board)).toBe(true);
    expect(hasFirstPlayerWon(board)).toBe(false);
  });

  it('should declare 1st player winner when 2nd makes 3-in-a-row early (anti-tictactoe)', () => {
    // blue (2nd player) completes a row on the 6th overall piece (even count)
    const board = [
      'red', 'red', null,
      'blue', 'blue', 'blue',
      'red', null, null
    ];
    expect(isGameEnd(board)).toBe(true);
    expect(hasFirstPlayerWon(board)).toBe(true);
  });

  it('should declare 2nd as winner even if they win at last piece', () => {
    const board = [
      'blue', 'blue', 'red',
      'blue', 'red', 'red',
      'red', 'red', 'blue'
    ];
    expect(hasFirstPlayerWon(board)).toBe(false);
  });
});
