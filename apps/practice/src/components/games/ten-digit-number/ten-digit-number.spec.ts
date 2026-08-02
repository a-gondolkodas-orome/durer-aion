import { moves } from './ten-digit-number';
import { makeCtx } from '../../../test-utils';

// The two players build one ten-digit number together; Bob (player 1) wins iff
// it is divisible by 9. Neither the mover nor the turn order enters into it.
const meta = { ctx: makeCtx() };

const board = (digits: number[]) => ({
  digits,
  sumMod9: digits.reduce((acc, d) => acc + d, 0) % 9
});

describe('end of game', () => {
  it('gives the tenth digit to Bob when the sum lands on a multiple of 9', () => {
    // nine 1s sum to 9; adding a 9 keeps the total ≡ 0 (mod 9)
    const outcome = moves.chooseDigit.apply(board(Array(9).fill(1)), meta, 9);
    expect(outcome.nextBoard.digits).toHaveLength(10);
    expect(outcome.nextBoard.sumMod9).toBe(0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives it to Alice otherwise', () => {
    const outcome = moves.chooseDigit.apply(board(Array(9).fill(1)), meta, 1);
    expect(outcome.nextBoard.sumMod9).toBe(1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while digits are still missing', () => {
    const outcome = moves.chooseDigit.apply(board(Array(8).fill(1)), meta, 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
