import { isRemovalAllowed, type Board } from './rock-paper-scissor';

// Each player holds rock (0), paper (1) and scissors (2) until taken away.
const board: Board = [
  ['rock', null, 'scissor'],
  ['rock', 'paper', 'scissor']
];

describe('isRemovalAllowed', () => {
  it("allows taking a symbol the other player still holds", () => {
    expect([0, 1, 2].every(idx => isRemovalAllowed(board, 1, idx))).toBe(true);
  });

  it('rejects a symbol the other player has already lost', () => {
    expect(isRemovalAllowed(board, 0, 1)).toBe(false);
    expect(isRemovalAllowed(board, 0, 0)).toBe(true);
  });

  it('rejects a symbol that does not exist', () => {
    expect(isRemovalAllowed(board, 1, 3)).toBe(false);
    expect(isRemovalAllowed(board, 1, -1)).toBe(false);
  });
});
