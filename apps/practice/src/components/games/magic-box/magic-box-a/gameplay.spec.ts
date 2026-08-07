import { generateEmptyBoard, hasFullLine, isPlacementAllowed, moves } from './gameplay';
import { makeCtx } from 'test-utils';

describe('hasFullLine', () => {
  it('should be false for an empty board', () => {
    expect(hasFullLine(generateEmptyBoard())).toBe(false);
  });

  it('should be true if a row is fully occupied', () => {
    const board = [
      true, true, true,
      false, false, false,
      false, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be true if a column is fully occupied', () => {
    const board = [
      true, false, false,
      true, false, false,
      true, false, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });

  it('should be false for the maximal 6-stone configuration with no full line', () => {
    // diagonal cells [0, 4, 8] left empty, the other six filled
    const board = [
      false, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(false);
  });

  it('should be true once a 7th stone is added to the maximal configuration', () => {
    const board = [
      true, true, true,
      true, false, true,
      true, true, false
    ];
    expect(hasFullLine(board)).toBe(true);
  });
});

describe('isPlacementAllowed', () => {
  it('allows any empty compartment', () => {
    const board = generateEmptyBoard();
    expect([0, 4, 8].every(id => isPlacementAllowed(board, id))).toBe(true);
  });

  it('rejects a compartment that already holds a stone', () => {
    const board = generateEmptyBoard();
    board[4] = true;
    expect(isPlacementAllowed(board, 4)).toBe(false);
    expect(isPlacementAllowed(board, 3)).toBe(true);
  });

  it('rejects a compartment outside the box', () => {
    const board = generateEmptyBoard();
    expect(isPlacementAllowed(board, 9)).toBe(false);
    expect(isPlacementAllowed(board, -1)).toBe(false);
    expect(isPlacementAllowed(board, 1.5)).toBe(false);
  });
});

// The player whose stone bursts the box loses, so the ending credits the
// mover's opponent.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('magic-box-a end of game', () => {
  it.each([0, 1])('ends AGAINST the mover (player %i) when the box bursts', player => {
    // stones on the first two cells of the top row; the third bursts it
    const board = generateEmptyBoard();
    board[0] = true;
    board[1] = true;
    const outcome = moves.placeStone.apply(board, asPlayer(player), 2);
    expect(hasFullLine(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while no line is complete', () => {
    const outcome = moves.placeStone.apply(generateEmptyBoard(), asPlayer(0), 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
