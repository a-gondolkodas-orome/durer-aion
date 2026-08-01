import { isNodePlayable, type Board } from "./helpers";

// 0=A and 1=B are the hubs, joined to each other and to both 2=C and 3=D;
// C and D are not joined.
describe("isNodePlayable", () => {
  it("allows any empty field", () => {
    expect([0, 1, 2, 3].every((node) => isNodePlayable([0, 0, 0, 0], node))).toBe(true);
  });

  it("allows a field whose neighbour holds the same number of coins", () => {
    const board: Board = [2, 2, 1, 3];
    expect(isNodePlayable(board, 0)).toBe(true); // A-B line, both 2
    expect(isNodePlayable(board, 1)).toBe(true);
  });

  it("rejects a non-empty field with no equal-valued neighbour", () => {
    expect(isNodePlayable([2, 3, 1, 4], 2)).toBe(false);
  });

  it("rejects a field equal only to the one it is not joined to", () => {
    // C and D both hold 1, but there is no C-D line
    expect(isNodePlayable([2, 3, 1, 1], 2)).toBe(false);
    expect(isNodePlayable([2, 3, 1, 1], 3)).toBe(false);
  });

  it("rejects anything that is not a field of the graph", () => {
    const board: Board = [0, 0, 0, 0];
    expect(isNodePlayable(board, 4)).toBe(false);
    expect(isNodePlayable(board, -1)).toBe(false);
    expect(isNodePlayable(board, 1.5)).toBe(false);
  });
});
