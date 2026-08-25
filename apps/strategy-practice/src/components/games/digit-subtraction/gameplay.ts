import type { MoveDefs, MoveOutcome } from 'strategy-game-factory';

export type Board = number

export const moves = {
  subtractDigit: {
    // Only a non-zero digit that actually appears in the current number may be
    // subtracted. Both players draw from the same number, so whose turn it is
    // does not enter into legality.
    validate: (board, _, digit: number) =>
      Number.isInteger(digit) && digit >= 1 && digit <= 9
        && String(board).includes(String(digit)),
    apply: (board, { ctx }, digit: number): MoveOutcome<Board> => {
      const nextBoard = board - digit;
      if (nextBoard === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
} satisfies MoveDefs<Board>;

export type Moves = typeof moves;

export const generateStartBoard = (): Board => {
  if (Math.random() < 0.3) {
    // multiple of 10 → P2 wins (losing position for P1)
    return (Math.floor(Math.random() * 10) + 2) * 10;
  } else {
    // non-multiple of 10 → P1 wins
    let n: number;
    do { n = Math.floor(Math.random() * 180) + 21; } while (n % 10 === 0);
    return n;
  }
};
