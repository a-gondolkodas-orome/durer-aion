import { hasFirstPlayerWon, isGameEnd, moves } from './gameplay';
import { makeCtx } from '../../../../test-utils';

describe('isGameEnd, hasFirstPlayerWon', () => {
  it('should end the game if there are 3 pieces in a row for the second player', () => {
    // only blue (2nd player) has a winning row; board not yet full
    const board = [
      'red', 'red', null,
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

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// 'red' is player 0, 'blue' is player 1, in board order.
const grid = (cells: (string | null)[]) => cells;

describe('tictactoe-doublestart end of game', () => {
  it('leaves the turn open after the first of the two opening pieces', () => {
    const outcome = moves.placePiece.apply(grid(Array(9).fill(null)), asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('closes the turn on the second of them', () => {
    const board = grid(['red', null, null, null, null, null, null, null, null]);
    const outcome = moves.placePiece.apply(board, asPlayer(0), 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('ends only on a blue line or a full board — a red line is not an ending', () => {
    // red completing the top row leaves the game running, because the first
    // player gets two opening pieces and only blue's line stops play
    const redLine = grid(['red', 'red', null, 'blue', 'blue', null, null, null, null]);
    const carriesOn = moves.placePiece.apply(redLine, asPlayer(0), 2);
    expect(carriesOn.gameEnd).toBeUndefined();
    expect(carriesOn.isTurnEnd).toBe(true);

    // blue completing the middle row does end it, for blue
    const blueLine = grid(['red', 'red', 'red', 'blue', 'blue', null, null, null, null]);
    const outcome = moves.placePiece.apply(blueLine, asPlayer(1), 5);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
