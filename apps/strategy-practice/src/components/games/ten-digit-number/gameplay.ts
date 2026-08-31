import type { MoveDefs, MoveOutcome } from 'strategy-game-factory';

export type Board = { digits: number[], sumMod9: number }

export const totalDigits = 10;
export const availableDigits = [1, 2, 3, 4, 5, 6];

export const moves = {
  chooseDigit: {
    // Only one of the six offered digits may be appended, and only while the
    // number is still short of its ten digits. Both players draw from the same
    // six, so whose turn it is does not enter into legality.
    validate: (board, _, digit: number) =>
      board.digits.length < totalDigits && availableDigits.includes(digit),
    apply: (board, _, digit: number): MoveOutcome<Board> => {
      const newDigits = [...board.digits, digit];
      const newSumMod9 = (board.sumMod9 + digit) % 9;
      const nextBoard = { digits: newDigits, sumMod9: newSumMod9 };
      if (newDigits.length === totalDigits) {
        return { nextBoard, gameEnd: { winnerIndex: newSumMod9 === 0 ? 1 : 0 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
} satisfies MoveDefs<Board>;

export type Moves = typeof moves;
