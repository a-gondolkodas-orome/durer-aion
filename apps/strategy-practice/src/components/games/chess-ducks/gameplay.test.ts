import { range } from 'lodash';
import {
  DUCK, FORBIDDEN, moves, getAllowedMoves, withDuckPlaced, type Board
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const isPlacementAllowed = moveValidator(moves.placeDuck);

const emptyBoard = (rows: number, cols: number): Board =>
  range(rows).map(() => range(cols).map(() => null));

describe('isPlacementAllowed', () => {
  it('accepts a free field', () => {
    expect(isPlacementAllowed(emptyBoard(4, 6), { row: 0, col: 0 })).toBe(true);
    expect(isPlacementAllowed(emptyBoard(4, 6), { row: 3, col: 5 })).toBe(true);
  });

  it('refuses a field that already holds a duck', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = DUCK;
    expect(isPlacementAllowed(board, { row: 1, col: 2 })).toBe(false);
  });

  it('refuses a field a duck attacks', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = FORBIDDEN;
    expect(isPlacementAllowed(board, { row: 1, col: 2 })).toBe(false);
  });

  it('refuses a field off the board', () => {
    const board = emptyBoard(4, 6);
    expect(isPlacementAllowed(board, { row: -1, col: 0 })).toBe(false);
    expect(isPlacementAllowed(board, { row: 4, col: 0 })).toBe(false);
    expect(isPlacementAllowed(board, { row: 0, col: 6 })).toBe(false);
  });

  it('accepts exactly the fields the generator lists', () => {
    const board = emptyBoard(4, 6);
    board[1][2] = DUCK;
    board[0][2] = FORBIDDEN;
    board[1][1] = FORBIDDEN;
    const listed = new Set(getAllowedMoves(board).map(f => `${f.row},${f.col}`));
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        expect(isPlacementAllowed(board, { row, col })).toBe(listed.has(`${row},${col}`));
      }
    }
  });
});

// A duck forbids its four neighbours, so the free squares run out; the player
// who places the last duck wins.
describe.each([[4, 7], [4, 6]])('end of game on a %ix%i board', (rows, cols) => {
  it('ends exactly on the placement that fills the board', () => {
    let board = emptyBoard(rows, cols);
    let player = 0;
    let outcome = moves.placeDuck.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeDuck.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});

describe('withDuckPlaced', () => {
  it('produces exactly the board the move returns — the bot search shares it', () => {
    const board = emptyBoard(4, 7);
    const field = { row: 1, col: 2 };
    expect(moves.placeDuck.apply(board, asPlayer(0), field).nextBoard)
      .toEqual(withDuckPlaced(board, field));
  });
});
