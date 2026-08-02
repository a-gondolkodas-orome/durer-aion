import { moves } from './modified-mill';
import { generateEmptyBoard, playerColor, playerHasLine, isBoardFull, CELL_COUNT } from './helpers';
import { LINES } from './board-data';
import { makeCtx } from '../../../test-utils';

// Two ways to finish, crediting different players: three in a line wins for
// whoever placed them, while a full board with no line for the mover goes to
// the second player.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on completing a line', player => {
    const [a, b, c] = LINES[0];
    const board = generateEmptyBoard();
    board[a] = playerColor(player);
    board[b] = playerColor(player);

    const outcome = moves.placePiece.apply(board, asPlayer(player), c);
    expect(playerHasLine(outcome.nextBoard, player)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives a full board to the second player when the mover has no line', () => {
    // every cell but one belongs to blue; red\'s single disc cannot be a line
    const board = generateEmptyBoard();
    const lastCell = CELL_COUNT - 1;
    board.forEach((_, i) => {
      if (i !== lastCell) board[i] = playerColor(1);
    });

    const outcome = moves.placePiece.apply(board, asPlayer(0), lastCell);
    expect(isBoardFull(outcome.nextBoard)).toBe(true);
    expect(playerHasLine(outcome.nextBoard, 0)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn on an ordinary placement', () => {
    const outcome = moves.placePiece.apply(generateEmptyBoard(), asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
