import {
  CELL_COUNT,
  boardMasks,
  completesLine,
  generateEmptyBoard,
  hasLine,
  isBoardFull,
  moves,
  playerColor,
  playerHasLine
} from './gameplay';
import { LINES } from './board-data';
import { makeCtx, moveValidator } from 'test-utils';

const isPlacementAllowed = moveValidator(moves.placePiece);

describe('modified mill helpers', () => {
  it('has a 24-cell board and 16 winning lines of three cells each', () => {
    // 12 square sides + 4 corner diagonals; no radial spokes between squares.
    expect(CELL_COUNT).toBe(24);
    expect(LINES).toHaveLength(16);
    expect(LINES.every((line) => line.length === 3)).toBe(true);
  });

  it('maps player index to disc colour', () => {
    expect(playerColor(0)).toBe('red');
    expect(playerColor(1)).toBe('blue');
  });

  it('detects three of a colour in a line as a win for that player', () => {
    const board = generateEmptyBoard();
    const [a, b, c] = LINES[0];
    board[a] = 'red';
    board[b] = 'red';
    board[c] = 'red';
    expect(playerHasLine(board, 0)).toBe(true);
    expect(playerHasLine(board, 1)).toBe(false);
  });

  it('two of a colour in a line is not yet a win', () => {
    const board = generateEmptyBoard();
    const [a, b] = LINES[0];
    board[a] = 'red';
    board[b] = 'red';
    expect(playerHasLine(board, 0)).toBe(false);
  });

  it('completesLine flags exactly the cell that finishes a line', () => {
    const board = generateEmptyBoard();
    const [a, b, c] = LINES[5];
    board[a] = 'blue';
    board[b] = 'blue';
    const { blue } = boardMasks(board);
    expect(completesLine(blue, c)).toBe(true);
    expect(hasLine(blue)).toBe(false);
  });

  it('recognises a full board', () => {
    const board = generateEmptyBoard();
    expect(isBoardFull(board)).toBe(false);
    board.fill('red');
    expect(isBoardFull(board)).toBe(true);
  });

  it('allows placing on an empty cell but not on an occupied one', () => {
    const board = generateEmptyBoard();
    board[7] = 'red';
    board[8] = 'blue';
    expect(isPlacementAllowed(board, 0)).toBe(true);
    expect(isPlacementAllowed(board, 7)).toBe(false);
    expect(isPlacementAllowed(board, 8)).toBe(false);
  });

  it('rejects cells outside the board', () => {
    const board = generateEmptyBoard();
    expect(isPlacementAllowed(board, -1)).toBe(false);
    expect(isPlacementAllowed(board, CELL_COUNT)).toBe(false);
    expect(isPlacementAllowed(board, 1.5)).toBe(false);
  });
});

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
