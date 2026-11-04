// The boards drawn as rows of X, O and . are not words.
// cspell:ignoreRegExp /[XO.\/]{5,}/g
import { cloneDeep, range } from 'lodash';
import { makeCtx, moveValidator } from 'test-utils';
import { markOf, moves, startBoardOFirst, startBoardXFirst, type Board, type Mark, type TurnState } from './gameplay';

const isAllowed = moveValidator(moves.placeMark);

// A board drawn as five rows of `X`, `O` and `.`, e.g. 'XX.../...../...'.
const drawn = (rows: string, start: Board = startBoardXFirst): Board => ({
  ...cloneDeep(start),
  cells: rows.replace(/\//g, '').split('').map(c => c === '.' ? null : c as Mark)
});

const place = (board: Board, currentPlayer: number, id: number, turnState: TurnState | null = null) =>
  moves.placeMark.apply(board, { ctx: makeCtx<TurnState>({ currentPlayer, turnState }) }, id);

describe('placeMark legality', () => {
  it('accepts any empty cell', () => {
    expect(range(25).every(id => isAllowed(startBoardXFirst, id))).toBe(true);
  });

  it('refuses an occupied cell, and anything that is not a cell', () => {
    const board = drawn('X..../.O.../...../...../.....');
    expect(isAllowed(board, 0)).toBe(false);
    expect(isAllowed(board, 6)).toBe(false);
    expect(isAllowed(board, -1)).toBe(false);
    expect(isAllowed(board, 25)).toBe(false);
    expect(isAllowed(board, 1.5)).toBe(false);
  });
});

describe('who places what', () => {
  it('gives the first player the Xs in C, and the Os in D and E', () => {
    expect([markOf(startBoardXFirst, 0), markOf(startBoardXFirst, 1)]).toEqual(['X', 'O']);
    expect([markOf(startBoardOFirst, 0), markOf(startBoardOFirst, 1)]).toEqual(['O', 'X']);
  });
});

describe('a turn', () => {
  it('ends after one O', () => {
    const outcome = place(startBoardOFirst, 0, 12);
    expect(outcome.nextBoard.cells[12]).toBe('O');
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('stays with X after its first X, and ends after the second', () => {
    const first = place(startBoardXFirst, 0, 0);
    expect(first.nextBoard.cells[0]).toBe('X');
    expect(first.isTurnEnd).toBeUndefined();
    expect(first.nextTurnState).toEqual({ xsPlaced: 1 });

    const second = place(first.nextBoard, 0, 6, first.nextTurnState);
    expect(second.nextBoard.cells[6]).toBe('X');
    expect(second.isTurnEnd).toBe(true);
    expect(second.nextTurnState).toBeNull();
  });
});

describe('end of game', () => {
  it.each([
    ['C', startBoardXFirst, 0],
    ['D and E', startBoardOFirst, 1]
  ])('in %s, X wins as soon as a row or column is all X, even on the first X of a turn', (_, start, xPlayer) => {
    const row = place(drawn('XXXX./O..../.O.../..O../.....', start), xPlayer, 4);
    expect(row.gameEnd).toEqual({ winnerIndex: xPlayer });

    const column = place(drawn('X.O../X..../X.O../X..O./.....', start), xPlayer, 20);
    expect(column.gameEnd).toEqual({ winnerIndex: xPlayer });
  });

  it('does not count a diagonal', () => {
    const outcome = place(drawn('X..../.X.../..X../...X./.....'), 0, 24);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it.each([
    ['C', startBoardXFirst, 1],
    ['D and E', startBoardOFirst, 0]
  ])('in %s, O wins when the board fills up without a line of Xs', (_, start, oPlayer) => {
    // Every row and column holds an O, so no fill-in can make a line of Xs.
    const byO = place(drawn('OXXXX/XOXXX/XXOXX/XXXOX/XXX.O', start), oPlayer, 23);
    expect(byO.gameEnd).toEqual({ winnerIndex: oPlayer });

    const byFirstX = place(drawn('OXXXX/XOXXX/XXOXX/XXXOX/XXX.O', start), 1 - oPlayer, 23);
    expect(byFirstX.gameEnd).toEqual({ winnerIndex: oPlayer });
  });

  it('gives X the win when the last empty cell completes a line', () => {
    // The last column is all X once cell 24 is filled.
    const outcome = place(drawn('OXXXX/XOXXX/XXOXX/XXXOX/XXXO.'), 0, 24);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });
});
