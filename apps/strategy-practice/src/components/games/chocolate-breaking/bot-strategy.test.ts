import { hasSafeBreak, applyBreak, type Board, type Move } from './gameplay';
import { getSmartBotMove, getRandomBotMove, totalGrundy } from './bot-strategy';

const single = (w: number, h: number): Board => ({ pieces: [{ id: 0, w, h }], nextId: 1 });

// Play a full game between two move pickers. The player who faces a position
// with no safe break (is forced to break off a 1×1) loses.
const playGame = (start: Board, pickers: [(b: Board) => Move, (b: Board) => Move]): number => {
  let board = start;
  let current = 0;
  while (hasSafeBreak(board.pieces)) {
    board = applyBreak(board, pickers[current](board));
    current = 1 - current;
  }
  return 1 - current;
};

describe('smart bot', () => {
  it('always converts a winning position against random play', () => {
    let tested = 0;
    for (let w = 3; w <= 5; w++) {
      for (let h = 4; h <= 7; h++) {
        if (totalGrundy([{ id: 0, w, h }]) === 0) continue; // first player loses here
        tested++;
        for (let trial = 0; trial < 40; trial++) {
          expect(playGame(single(w, h), [getSmartBotMove, getRandomBotMove])).toBe(0);
        }
      }
    }
    expect(tested).toBeGreaterThan(0);
  });

  it('wins as the second player when the position is second-player-winning', () => {
    let tested = 0;
    for (let w = 3; w <= 5; w++) {
      for (let h = 4; h <= 7; h++) {
        if (totalGrundy([{ id: 0, w, h }]) !== 0) continue; // first player wins here
        tested++;
        for (let trial = 0; trial < 40; trial++) {
          expect(playGame(single(w, h), [getRandomBotMove, getSmartBotMove])).toBe(1);
        }
      }
    }
    expect(tested).toBeGreaterThan(0);
  });
});
