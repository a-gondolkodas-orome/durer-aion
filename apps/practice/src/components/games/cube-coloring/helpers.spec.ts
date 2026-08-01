import { isAllowedStep, generateStartBoard, neighbours, colors, type Board } from './helpers';
import { nodeColors } from './cube-coloring';

describe('cube-coloring palette', () => {
  it('logic-side colors stay in sync with the styling palette nodeColors', () => {
    expect(Object.keys(nodeColors)).toEqual(colors);
  });
});

describe('cube-coloring isAllowedStep', () => {
  const empty = (): Board => generateStartBoard();

  it('allows colouring an uncoloured vertex on an empty board', () => {
    expect(isAllowedStep(empty(), 0, 'red')).toBe(true);
  });

  it('rejects a colour outside the palette', () => {
    expect(isAllowedStep(empty(), 0, 'purple')).toBe(false);
    expect(isAllowedStep(empty(), 0, null)).toBe(false);
  });

  it('rejects colouring a vertex that is already coloured', () => {
    const board = empty();
    board[0] = 'red';
    expect(isAllowedStep(board, 0, 'blue')).toBe(false);
  });

  it('rejects a colour equal to an already-coloured neighbour', () => {
    const board = empty();
    const neighbour = neighbours[0][0];
    board[neighbour] = 'red';
    expect(isAllowedStep(board, 0, 'red')).toBe(false);
  });

  it('allows a colour that differs from every coloured neighbour', () => {
    const board = empty();
    const neighbour = neighbours[0][0];
    board[neighbour] = 'red';
    expect(isAllowedStep(board, 0, 'blue')).toBe(true);
  });
});
