import { isDigitChoiceAllowed, moves } from './gameplay';
import { makeCtx } from '../../../test-utils';

const meta = { ctx: makeCtx() };

const board = (digits: number[]) => ({
  digits,
  sumMod9: digits.reduce((acc, d) => acc + d, 0) % 9
});

describe('isDigitChoiceAllowed', () => {
  const afterDigits = (count: number) => board(Array(count).fill(1));

  it('accepts each of the six offered digits', () => {
    for (const d of [1, 2, 3, 4, 5, 6]) expect(isDigitChoiceAllowed(afterDigits(0), d)).toBe(true);
  });

  it('refuses a digit outside the offered six', () => {
    expect(isDigitChoiceAllowed(afterDigits(0), 0)).toBe(false);
    expect(isDigitChoiceAllowed(afterDigits(0), 7)).toBe(false);
    expect(isDigitChoiceAllowed(afterDigits(0), 9)).toBe(false);
    expect(isDigitChoiceAllowed(afterDigits(0), -1)).toBe(false);
  });

  it('accepts a digit up to the last free slot', () => {
    expect(isDigitChoiceAllowed(afterDigits(9), 3)).toBe(true);
  });

  it('refuses any digit once all ten are written', () => {
    expect(isDigitChoiceAllowed(afterDigits(10), 3)).toBe(false);
  });
});

// The two players build one ten-digit number together; Bob (player 1) wins iff
// it is divisible by 9. Neither the mover nor the turn order enters into it.
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
