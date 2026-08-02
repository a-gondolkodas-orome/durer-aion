import { moves } from './tictactoe';
import { makeCtx } from '../../../../test-utils';

// 'red' is player 0, 'blue' is player 1, in board order.
const grid = (cells: (string | null)[]) => cells;

describe('tictactoe end of game', () => {
  // Which colour a placement writes depends on the mode, so these run in
  // human-vs-human, where player 0 is blue and player 1 is red.
  const vsHuman = (currentPlayer: number) =>
    ({ ctx: makeCtx({ currentPlayer, isHumanVsHumanGame: true }) });

  it('ends for the mover when placing completes a line', () => {
    const board = grid(['blue', 'blue', null, 'red', 'red', null, null, null, null]);
    const outcome = moves.placePiece.apply(board, vsHuman(0), 2);
    expect(outcome.nextBoard[2]).toBe('blue');
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends for the mover when whitening completes a line of whites', () => {
    // whitening cell 2 leaves three whites across the top row
    const board = grid(['white', 'white', 'red', 'blue', 'red', 'blue', 'red', 'blue', 'red']);
    const outcome = moves.whitenPiece.apply(board, vsHuman(1), 2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn on an ordinary placement', () => {
    const outcome = moves.placePiece.apply(grid(Array(9).fill(null)), vsHuman(0), 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
