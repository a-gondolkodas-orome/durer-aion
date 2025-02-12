import { aiBotStrategy } from "./bot-strategy";

describe('aiBotStrategy', () => {
  it('moves symmetrically for even number of banks', () => {
    const board = {
      circle: [false, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    const moves = {
      rob: (board, bank) => {
        board.circle[bank] = false;
      }
    }
    aiBotStrategy({ board, moves });
    expect(board.circle[4]).toBe(false);
  });

  it('robs bank with 1 gap as second for 7 banks', () => {
    const board = {
      circle: [false, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    const moves = {
      rob: (board, bank) => {
        board.circle[bank] = false;
      }
    }
    aiBotStrategy({ board, moves });
    expect(board.circle[2] === false || board.circle[5] === false).toBe(true);
  });

  it('robs bank with 2 gap as second for 9 banks', () => {
    const board = {
      circle: [false, true, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    const moves = {
      rob: (board, bank) => {
        board.circle[bank] = false;
      }
    }
    aiBotStrategy({ board, moves });
    expect(board.circle[3] === false || board.circle[6] === false).toBe(true);
  });
});
