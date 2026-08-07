import {
  applyMove,
  generateStartBoard,
  isFull,
  isTerminal,
  legalDigits,
  legalMoves,
  moves,
  playerToMove,
  type Board
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isLegalPlacement = moveValidator(moves.placeDigit);

describe('latin-square-filling gameplay', () => {
  describe('legality', () => {
    it('rejects a digit already present in the same row', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 1, 1)).toBe(false);
      expect(isLegalPlacement(board, 2, 1)).toBe(false);
      expect(isLegalPlacement(board, 1, 2)).toBe(true);
    });

    it('rejects a digit already present in the same column', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 3, 1)).toBe(false);
      expect(isLegalPlacement(board, 6, 1)).toBe(false);
      expect(isLegalPlacement(board, 3, 3)).toBe(true);
    });

    it('rejects writing into an occupied cell', () => {
      const board: Board = [1, 0, 0, 0, 0, 0, 0, 0, 0];
      expect(isLegalPlacement(board, 0, 2)).toBe(false);
    });

    it('legalDigits lists exactly the placeable digits for a cell', () => {
      // centre cell shares row with a 1 and column with a 2 -> only 3 fits
      const board: Board = [0, 2, 0, 1, 0, 0, 0, 0, 0];
      expect(legalDigits(board, 4)).toEqual([3]);
    });

    it('a cell can become dead (no legal digit) while others remain open', () => {
      // cell 4 shares its row with {1,2} and its column with {3} -> nothing fits
      const board: Board = [0, 3, 0, 1, 0, 2, 0, 0, 0];
      expect(legalDigits(board, 4)).toEqual([]);
      // the position is not terminal: other cells still accept digits
      expect(isTerminal(board)).toBe(false);
    });
  });

  describe('turn bookkeeping', () => {
    it('player 0 moves on even fill counts, player 1 on odd', () => {
      expect(playerToMove(generateStartBoard())).toBe(0);
      expect(playerToMove([1, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(1);
      expect(playerToMove([1, 2, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    });

    it('a completed Latin square is full and terminal', () => {
      const solved: Board = [1, 2, 3, 2, 3, 1, 3, 1, 2];
      expect(isFull(solved)).toBe(true);
      expect(isTerminal(solved)).toBe(true);
    });
  });
});

describe('isLegalPlacement argument checks', () => {
  it('refuses a digit outside 1..3', () => {
    const board = generateStartBoard();
    expect(isLegalPlacement(board, 0, 0)).toBe(false);
    expect(isLegalPlacement(board, 0, 4)).toBe(false);
    expect(isLegalPlacement(board, 0, 1.5)).toBe(false);
  });

  it('refuses a cell outside the 3x3 grid', () => {
    const board = generateStartBoard();
    expect(isLegalPlacement(board, -1, 1)).toBe(false);
    expect(isLegalPlacement(board, 9, 1)).toBe(false);
    expect(isLegalPlacement(board, 0.5, 1)).toBe(false);
  });

  it('accepts exactly the moves the generator lists', () => {
    const board = applyMove(applyMove(generateStartBoard(), { cell: 0, digit: 1 }), { cell: 4, digit: 2 });
    const listed = new Set(legalMoves(board).map(m => `${m.cell},${m.digit}`));
    for (let cell = 0; cell < 9; cell++) {
      for (const digit of [1, 2, 3]) {
        expect(isLegalPlacement(board, cell, digit)).toBe(listed.has(`${cell},${digit}`));
      }
    }
  });
});

// Two different endings: filling the ninth cell wins for the first player,
// while leaving the next player stuck in front of an empty cell wins for the
// second. The move reads no ctx, so the winner is fixed by the position.
const meta = { ctx: makeCtx() };

describe('end of game', () => {
  it('gives the game to the first player when the grid gets filled', () => {
    //  1 2 3 / 2 3 1 / 3 1 _  — writing 2 into the last cell completes the square
    const board: Board = [1, 2, 3, 2, 3, 1, 3, 1, 0];
    const outcome = moves.placeDigit.apply(board, meta, 8, 2);
    expect(isFull(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the second player when the next player is stuck', () => {
    // writing 1 into the top-left cell reaches
    //   1 2 _ / 2 1 _ / _ _ 3
    // where all four empty cells see all three digits along their row and
    // column, so the next player cannot move although the grid is not full
    const board: Board = [0, 2, 0, 2, 1, 0, 0, 0, 3];
    const outcome = moves.placeDigit.apply(board, meta, 0, 1);
    expect(isFull(outcome.nextBoard)).toBe(false);
    expect(legalMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while legal moves remain and cells are empty', () => {
    const outcome = moves.placeDigit.apply(Array(9).fill(0) as Board, meta, 0, 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
