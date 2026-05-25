import { isGameEnd, hasFirstPlayerWon } from "./helpers";

describe('isGameEnd, hasFirstPlayerWon', () => {
  it('should end the game if there are 3 pieces in a row for the second player', () => {
    const board = [
      'red', 'red', 'red',
      'blue', 'blue', 'blue',
      'red', null, null
    ];

    expect(isGameEnd(board)).toBe(true);
    expect(hasFirstPlayerWon(board)).toBe(false);
  });

  it('should end the game when there are 9 pieces', () => {
    const board = [
      'red', 'blue', 'red',
      'blue', 'red', 'blue',
      'red', 'red', 'blue'
    ];

    expect(isGameEnd(board)).toBe(true);
    expect(hasFirstPlayerWon(board)).toBe(true);
  });

  it('should end the game when there are 9 pieces but no winning subset', () => {
    const board = [
      'red', 'blue', 'red',
      'red', 'blue', 'red',
      'blue', 'red', 'blue'
    ];

    expect(isGameEnd(board)).toBe(true);
    expect(hasFirstPlayerWon(board)).toBe(false);
  });

  it('should not end game if winning subset for first but no 9 pieces yet', () => {
    const board = [
      'red', 'blue', 'red',
      null, 'red', null,
      'red', null, 'blue'
    ];

    expect(isGameEnd(board)).toBe(false);
  })
});
