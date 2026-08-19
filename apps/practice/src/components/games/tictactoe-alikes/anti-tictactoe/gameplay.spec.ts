import { hasFirstPlayerWon, isGameEnd, moves } from './gameplay';
import { makeCtx } from 'test-utils';

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

// Completing a line hands the game to the *other* player.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// 'red' is player 0, 'blue' is player 1, in board order.
const grid = (cells: (string | null)[]) => cells;

describe('anti-tictactoe end of game', () => {
  it('gives the game to the second player when the first completes a line', () => {
    // red already holds cells 0 and 1; taking 2 makes the top row
    const board = grid(['red', 'red', null, 'blue', 'blue', null, null, null, null]);
    const outcome = moves.placePiece.apply(board, asPlayer(0), 2);
    expect(outcome.nextBoard[2]).toBe('red');
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while no line is complete', () => {
    const outcome = moves.placePiece.apply(grid(Array(9).fill(null)), asPlayer(0), 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
