import { range } from 'lodash';
import { chooseSmartMove, chooseTestMove, winnerOptimal } from './bot-strategy';
import {
  currentPlayerFromOwner,
  freeNumbers,
  generateStartBoard,
  hasSum15,
  numbersOwnedBy,
  type Owner
} from './gameplay';

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

describe('chooseTestMove', () => {
  it('takes a number that completes a triple summing to 15', () => {
    // Player 0 holds 4 and 5, so 6 wins on the spot.
    const owner: Owner = [null, null, 1, 0, 0, null, 1, null, null];
    expect(chooseTestMove(owner, 0)).toBe(6);
  });

  it('otherwise picks some number nobody has claimed', () => {
    const owner: Owner = [0, 1, null, null, null, null, null, null, null];
    for (let i = 0; i < 20; i++) {
      expect(freeNumbers(owner)).toContain(chooseTestMove(owner, 0));
    }
  });
});
