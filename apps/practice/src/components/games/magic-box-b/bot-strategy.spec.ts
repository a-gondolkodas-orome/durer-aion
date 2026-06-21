import { getOptimalAction } from './bot-strategy';
import { generateEmptyBoard, isLineFull, placeStoneAt, LINES } from './helpers';

describe('getOptimalAction', () => {
  it('should designate the just-completed line for an instant win when only one cell remains', () => {
    const board = {
      stones: [true, true, false, false, false, false, false, false, false],
      pendingLine: 0
    };
    expect(getOptimalAction(board, 0)).toEqual({ cell: 2, line: 0 });
    expect(getOptimalAction(board, 1)).toEqual({ cell: 2, line: 0 });
  });

  it('should return a valid line in 0..5 with no cell on the very first turn of the game', () => {
    const board = generateEmptyBoard();
    const { cell, line } = getOptimalAction(board, 0);
    expect(cell).toBeUndefined();
    expect(line).toBeGreaterThanOrEqual(0);
    expect(line).toBeLessThan(LINES.length);
  });

  it('should let whoever places the first stone (role 1) always win, regardless of the first designation', () => {
    for (let firstLine = 0; firstLine < LINES.length; firstLine++) {
      let board = { stones: generateEmptyBoard().stones, pendingLine: firstLine };
      let mover = 1;
      let winner: number | undefined;

      while (winner === undefined) {
        const { cell, line } = getOptimalAction(board, mover);
        const newStones = placeStoneAt(board.stones, cell as number);
        if (isLineFull(newStones, line)) {
          winner = mover;
        } else {
          board = { stones: newStones, pendingLine: line };
          mover = 1 - mover;
        }
      }

      expect(winner).toBe(1);
    }
  });
});
