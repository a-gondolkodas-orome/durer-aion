import { moves } from './anti-tictactoe';
import { makeCtx } from '../../../../test-utils';

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
