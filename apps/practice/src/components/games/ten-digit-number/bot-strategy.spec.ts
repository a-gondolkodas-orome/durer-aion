import { sum } from 'lodash';
import { runMatch, type MatchResult } from 'strategy-game-factory';
import { type Board, moves, availableDigits, totalDigits } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// Ten digits get appended, each of them 1-6, and the second player wins if the
// finished number is divisible by 9. The bot reads whose turn it is off the
// board's own length, so every start board here has an even number of digits —
// the ones where player 0 is genuinely to move.
type Bot = typeof smartBotStrategy

const board = (digits: number[]): Board => ({ digits, sumMod9: sum(digits) % 9 });

const play = (startBoard: Board, strategies: [Bot, Bot]): MatchResult<Board> =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

// Who wins from (sumMod9, turnsLeft) with optimal play, computed here from the
// rules rather than from the table the bot keeps.
const referenceWinner = (() => {
  const memo = new Map<string, number>();
  const value = (sumMod9: number, turnsLeft: number): number => {
    if (turnsLeft === 0) return sumMod9 === 0 ? 1 : 0;
    const key = `${sumMod9},${turnsLeft}`;
    if (memo.has(key)) return memo.get(key)!;
    const mover = (totalDigits - turnsLeft) % 2;
    const canWin = availableDigits.some(d => value((sumMod9 + d) % 9, turnsLeft - 1) === mover);
    const result = canWin ? mover : 1 - mover;
    memo.set(key, result);
    return result;
  };
  return value;
})();

const winnerFor = (b: Board) => referenceWinner(b.sumMod9, totalDigits - b.digits.length);

describe('the solved game', () => {
  // The whole game in one line: with an even number of digits down, the player
  // to move is lost exactly on one residue, and it walks backwards by two each
  // time a pair of digits is added.
  it('leaves the mover lost exactly when the sum is 1 - digitsPlaced (mod 9)', () => {
    for (const placed of [0, 2, 4, 6, 8]) {
      for (let sumMod9 = 0; sumMod9 < 9; sumMod9++) {
        const moverLoses = referenceWinner(sumMod9, totalDigits - placed) === 1;
        expect(moverLoses).toBe(sumMod9 === ((1 - placed) % 9 + 9) % 9);
      }
    }
  });

  it('is a first-player win from the empty number', () => {
    expect(referenceWinner(0, totalDigits)).toBe(0);
  });
});

// Reachable, even-length, and lost for whoever is to move.
const LOST_FOR_MOVER: Board[] = [
  board([3, 5]),                      // 2 digits, sum 8
  board([1, 1, 2, 2]),                // 4 digits, sum 6
  board([1, 1, 1, 1, 3, 6]),          // 6 digits, sum 13 ≡ 4
  board([1, 1, 1, 1, 1, 1, 1, 4])     // 8 digits, sum 11 ≡ 2
];

const WON_FOR_MOVER: Board[] = [
  board([]),                          // the real start board
  board([4, 5]),                      // 2 digits, sum 9 ≡ 0
  board([2, 2, 3, 3]),                // 4 digits, sum 10 ≡ 1
  board([1, 2, 3, 4, 5, 6])           // 6 digits, sum 21 ≡ 3
];

describe('smartBotStrategy', () => {
  it('starts from a board it can win, and does', () => {
    expect(winnerFor(board([]))).toBe(0);
    for (let trial = 0; trial < 30; trial++) {
      expect(play(board([]), [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
    }
  });

  it('wins as the mover from every won board, against a random opponent', () => {
    for (const start of WON_FOR_MOVER) {
      expect(winnerFor(start)).toBe(0);
      for (let trial = 0; trial < 10; trial++) {
        expect(play(start, [smartBotStrategy, randomBotStrategy]).winnerIndex).toBe(0);
      }
    }
  });

  it('wins as the replier from every board lost for the mover', () => {
    for (const start of LOST_FOR_MOVER) {
      expect(winnerFor(start)).toBe(1);
      for (let trial = 0; trial < 10; trial++) {
        expect(play(start, [randomBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
      }
    }
  });

  it('holds the win against optimal play from either seat', () => {
    for (const start of WON_FOR_MOVER) {
      expect(play(start, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(0);
    }
    for (const start of LOST_FOR_MOVER) {
      expect(play(start, [smartBotStrategy, smartBotStrategy]).winnerIndex).toBe(1);
    }
  });

  // The move itself, not just the result: from a won board the digit it picks
  // has to hand the opponent the one losing residue.
  it('moves onto the losing residue for the opponent', () => {
    for (const start of WON_FOR_MOVER) {
      for (let trial = 0; trial < 10; trial++) {
        const after = play(start, [smartBotStrategy, randomBotStrategy]).history[0]!.board;
        expect(winnerFor(after)).toBe(0);
      }
    }
  });
});

describe('randomBotStrategy', () => {
  it('fills the number to ten digits, all of them offered ones', () => {
    for (let trial = 0; trial < 20; trial++) {
      const { board: final, history } = play(board([]), [randomBotStrategy, randomBotStrategy]);
      expect(history).toHaveLength(totalDigits);
      expect(final.digits).toHaveLength(totalDigits);
      expect(final.digits.every(d => availableDigits.includes(d))).toBe(true);
      expect(final.sumMod9).toBe(sum(final.digits) % 9);
    }
  });

  // Its one piece of judgement: on the final digit it takes the win if there is
  // one. Player 1 places that digit, so this reads whole games rather than
  // seeding an odd-length board, which would put runMatch's seats out of step
  // with the parity the bot reads off the board. The opener is random on
  // purpose — against the smart bot the chance never arises (0 of 200 games),
  // which would make this assert nothing.
  it('never leaves a winning last digit on the table', () => {
    let chances = 0;
    for (let trial = 0; trial < 60; trial++) {
      const { board: final, winnerIndex } = play(board([]), [randomBotStrategy, randomBotStrategy]);
      const beforeLast = ((final.sumMod9 - final.digits[9]!) % 9 + 9) % 9;
      if (!availableDigits.some(d => (beforeLast + d) % 9 === 0)) continue;
      chances++;
      expect(winnerIndex).toBe(1);
    }
    expect(chances).toBeGreaterThan(0);
  });
});
