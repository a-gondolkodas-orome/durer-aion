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

  it('should declare 2nd as winner even if they win at last piece', () => {
    const board = [
      'blue', 'blue', 'red',
      'blue', 'red', 'red',
      'red', 'red', 'blue'
    ];
    expect(hasFirstPlayerWon(board)).toBe(false);
  });
});
