import {
  LINES,
  emptyCellsInLine,
  isLineFull,
  isPlacementAllowed,
  moves,
  placeStoneAt,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from '../../../../test-utils';

const isDesignationAllowed = moveValidator(moves.designateLine);

describe('isLineFull', () => {
  it('should be false when a row is not fully occupied', () => {
    const stones = [true, true, false, false, false, false, false, false, false];
    expect(isLineFull(stones, 0)).toBe(false);
  });

  it('should be true when a row is fully occupied', () => {
    const stones = [true, true, true, false, false, false, false, false, false];
    expect(isLineFull(stones, 0)).toBe(true);
  });

  it('should be true when a column is fully occupied', () => {
    const stones = [true, false, false, true, false, false, true, false, false];
    expect(isLineFull(stones, 3)).toBe(true);
  });
});

describe('emptyCellsInLine', () => {
  it('should return only the empty cells of the given line', () => {
    const stones = [true, false, true, false, false, false, false, false, false];
    expect(emptyCellsInLine(stones, 0)).toEqual([1]);
  });

  it('should return all three cells when the line is fully empty', () => {
    const stones = Array(9).fill(false);
    expect(emptyCellsInLine(stones, 5)).toEqual([2, 5, 8]);
  });
});

describe('placeStoneAt', () => {
  it('should set the given cell to true without mutating the input', () => {
    const stones = Array(9).fill(false);
    const next = placeStoneAt(stones, 4);
    expect(next).toEqual([false, false, false, false, true, false, false, false, false]);
    expect(stones[4]).toBe(false);
  });
});

// Row 1 is line 0 (cells 0,1,2); column 1 is line 3 (cells 0,3,6).
const boardAwaitingStoneInRow1 = (): Board => ({ stones: Array(9).fill(false), pendingLine: 0 });
const boardAwaitingDesignation = (): Board => ({ stones: Array(9).fill(false), pendingLine: null });

describe('isPlacementAllowed', () => {
  it('allows an empty cell of the designated line', () => {
    const board = boardAwaitingStoneInRow1();
    expect([0, 1, 2].every(id => isPlacementAllowed(board, id))).toBe(true);
  });

  it('rejects a cell outside the designated line', () => {
    expect(isPlacementAllowed(boardAwaitingStoneInRow1(), 3)).toBe(false);
  });

  it('rejects a cell of the designated line that is already taken', () => {
    const board = boardAwaitingStoneInRow1();
    board.stones[1] = true;
    expect(isPlacementAllowed(board, 1)).toBe(false);
  });

  it('rejects placing while no line has been designated', () => {
    expect(isPlacementAllowed(boardAwaitingDesignation(), 0)).toBe(false);
  });

  it('rejects a cell outside the box', () => {
    expect(isPlacementAllowed(boardAwaitingStoneInRow1(), 9)).toBe(false);
  });
});

describe('isDesignationAllowed', () => {
  it('allows any of the six lines once the stone has been placed', () => {
    const board = boardAwaitingDesignation();
    expect([0, 1, 2, 3, 4, 5].every(line => isDesignationAllowed(board, line))).toBe(true);
  });

  it('rejects designating while a line is still awaiting its stone', () => {
    expect(isDesignationAllowed(boardAwaitingStoneInRow1(), 2)).toBe(false);
  });

  it('rejects a line index that does not exist', () => {
    const board = boardAwaitingDesignation();
    expect(isDesignationAllowed(board, 6)).toBe(false);
    expect(isDesignationAllowed(board, -1)).toBe(false);
  });
});

// Designating an already-full line wins, because the opponent cannot answer it.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('magic-box-b end of game', () => {
  const stonesFilling = (lineIndex: number) => {
    const stones = Array(9).fill(false);
    LINES[lineIndex].forEach(i => { stones[i] = true; });
    return stones;
  };

  it.each([0, 1])('ends FOR the mover (player %i) on designating a full line', player => {
    const board = { stones: stonesFilling(0), pendingLine: null };
    expect(isLineFull(board.stones, 0)).toBe(true);
    const outcome = moves.designateLine.apply(board, asPlayer(player), 0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn when the designated line still has room', () => {
    const board = { stones: Array(9).fill(false), pendingLine: null };
    const outcome = moves.designateLine.apply(board, asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('leaves the turn open after placing, before the line is designated', () => {
    const board = { stones: Array(9).fill(false), pendingLine: 0 };
    const outcome = moves.placeStone.apply(board, asPlayer(0), 4);
    expect(outcome.nextBoard.pendingLine).toBeNull();
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
