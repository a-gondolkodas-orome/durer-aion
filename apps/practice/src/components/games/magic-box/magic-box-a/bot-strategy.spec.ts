import { getOptimalPlacingPosition } from './bot-strategy';
import { generateEmptyBoard, isGameEnd, placeStone } from './helpers';

describe('getOptimalPlacingPosition', () => {
  it('should not place a stone that immediately completes a line if a safe move exists', () => {
    const board = [
      true, true, false,
      false, false, false,
      false, false, false
    ];
    expect(getOptimalPlacingPosition(board, 0)).not.toBe(2);
  });

  it('should pick the only remaining move that does not complete a line, regardless of role', () => {
    const board = [
      true, true, false,
      false, true, true,
      true, false, false
    ];
    // empty cells are 2, 3, 7, 8; placing at 2, 3 or 7 each completes a line, only 8 is safe
    expect(getOptimalPlacingPosition(board, 0)).toBe(8);
    expect(getOptimalPlacingPosition(board, 1)).toBe(8);
  });

  it('should fall back to one of the remaining cells when every move completes a line', () => {
    const board = [
      false, true, true,
      true, false, true,
      true, true, false
    ];
    expect([0, 4, 8]).toContain(getOptimalPlacingPosition(board, 0));
  });

  it('should let the second player always force a win with optimal play from an empty board', () => {
    for (let firstMove = 0; firstMove < 9; firstMove++) {
      let board = placeStone(generateEmptyBoard(), firstMove);
      let mover = 1;
      while (!isGameEnd(board)) {
        const id = getOptimalPlacingPosition(board, mover) as number;
        board = placeStone(board, id);
        mover = 1 - mover;
      }
      // the player who just moved lost, so the winner is the current `mover`
      expect(mover).toBe(1);
    }
  });
});
