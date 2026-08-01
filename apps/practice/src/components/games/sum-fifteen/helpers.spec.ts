import { range } from 'lodash';
import {
  hasSum15, findWinningTriple, winnerOptimal, chooseSmartMove,
  numbersOwnedBy, freeNumbers, currentPlayerFromOwner, generateStartBoard, isChoiceAllowed,
  type Owner
} from './helpers';

describe('hasSum15', () => {
  it('detects a triple summing to 15', () => {
    expect(hasSum15([2, 6, 7])).toBe(true); // 2 + 6 + 7 = 15
    expect(hasSum15([1, 5, 9, 3])).toBe(true); // 1 + 5 + 9 = 15
  });

  it('ignores pairs and needs exactly three numbers', () => {
    expect(hasSum15([6, 9])).toBe(false); // only a pair sums to 15
    expect(hasSum15([1, 2, 3])).toBe(false);
    expect(hasSum15([15])).toBe(false);
  });
});

describe('findWinningTriple', () => {
  it('returns a concrete triple summing to 15', () => {
    const triple = findWinningTriple([4, 5, 6, 8]);
    expect(triple).not.toBeNull();
    expect(triple!.reduce((a, b) => a + b, 0)).toBe(15);
  });

  it('returns null when no triple sums to 15', () => {
    expect(findWinningTriple([1, 2, 4])).toBeNull();
  });
});

describe('winnerOptimal', () => {
  it('declares the second player the winner from the empty board (optimal play is a draw)', () => {
    expect(winnerOptimal(generateStartBoard().owner)).toBe(1);
  });

  it('lets the current player win when a triple summing to 15 is one move away', () => {
    // First player owns 6 and 8; claiming 1 makes 6 + 8 + 1 = 15.
    const owner: Owner = [null, null, null, null, null, 0, 1, 0, 1];
    // numbers owned: player0 -> {6, 8}, player1 -> {7, 9}; player0 to move (4 claimed).
    expect(currentPlayerFromOwner(owner)).toBe(0);
    expect(winnerOptimal(owner)).toBe(0);
  });
});

// Play out full games; assert the smart bot never loses as the second player,
// which — since the game has no draws in the players' favour — means it wins.
const playSmartBotVsRandom = (botPlayer: 0 | 1, rng: () => number): 0 | 1 => {
  let owner: Owner = generateStartBoard().owner;
  while (true) {
    const cp = currentPlayerFromOwner(owner);
    const move = cp === botPlayer
      ? chooseSmartMove(owner, cp)
      : freeNumbers(owner)[Math.floor(rng() * freeNumbers(owner).length)];
    owner = owner.slice() as Owner;
    owner[move - 1] = cp;
    if (hasSum15(numbersOwnedBy(owner, cp))) return cp;
    if (owner.every(o => o !== null)) return 1;
  }
};

describe('chooseSmartMove', () => {
  it('never loses as the second player against random play', () => {
    let seed = 1;
    const rng = () => {
      // deterministic LCG so the test is reproducible
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (const i of range(300)) {
      expect(playSmartBotVsRandom(1, rng), `game ${i}`).toBe(1);
    }
  });

  it('takes an immediate winning number when available', () => {
    // Player 0 holds 4 and 5; 6 completes 4 + 5 + 6 = 15.
    const owner: Owner = [null, null, 1, 0, 0, null, 1, null, null];
    expect(currentPlayerFromOwner(owner)).toBe(0);
    expect(chooseSmartMove(owner, 0)).toBe(6);
  });

  it('blocks the opponent immediate threat', () => {
    // Player 0 holds {1, 3}, player 1 holds {2, 6} (threatening 2 + 6 + 7 = 15);
    // player 0 to move must take 7 or lose immediately.
    const owner: Owner = [0, 1, 0, null, null, 1, null, null, null];
    expect(currentPlayerFromOwner(owner)).toBe(0);
    expect(chooseSmartMove(owner, 0)).toBe(7);
  });
});

describe('isChoiceAllowed', () => {
  const owner: Owner = [0, null, 1, null, null, null, null, null, null];

  it('accepts a number nobody has claimed', () => {
    expect(isChoiceAllowed(owner, 2)).toBe(true);
    expect(isChoiceAllowed(owner, 9)).toBe(true);
  });

  it('refuses a number either player already owns', () => {
    expect(isChoiceAllowed(owner, 1)).toBe(false);
    expect(isChoiceAllowed(owner, 3)).toBe(false);
  });

  it('refuses anything outside 1..9', () => {
    expect(isChoiceAllowed(owner, 0)).toBe(false);
    expect(isChoiceAllowed(owner, 10)).toBe(false);
    expect(isChoiceAllowed(owner, 2.5)).toBe(false);
  });

  it('accepts exactly the free numbers', () => {
    const free = new Set(freeNumbers(owner));
    for (let n = 1; n <= 9; n++) expect(isChoiceAllowed(owner, n)).toBe(free.has(n));
  });
});
