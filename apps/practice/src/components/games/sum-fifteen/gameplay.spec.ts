import { range } from 'lodash';
import {
  chooseSmartMove,
  currentPlayerFromOwner,
  findWinningTriple,
  freeNumbers,
  generateStartBoard,
  hasSum15,
  isChoiceAllowed,
  moves,
  numbersOwnedBy,
  winnerOptimal,
  type Board,
  type Owner
} from './gameplay';
import { makeCtx } from '../../../test-utils';

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

// A player wins by owning three numbers summing to 15; if all nine are claimed
// without that, the second player takes it.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// `owner[n - 1]` is who holds n.
const board = (assignments: Record<number, 0 | 1>): Board => ({
  owner: Array(9).fill(null).map((_, i) => assignments[i + 1] ?? null) as Board['owner']
});

describe('end of game', () => {
  it.each([0, 1] as const)('ends for the mover (player %i) on reaching a sum of 15', player => {
    const other = (1 - player) as 0 | 1;
    // the mover already holds 4 and 5; taking 6 makes 4 + 5 + 6 = 15
    const start = board({ 4: player, 5: player, 1: other, 2: other });
    const outcome = moves.chooseNumber.apply(start, asPlayer(player), 6);
    expect(hasSum15(numbersOwnedBy(outcome.nextBoard.owner, player))).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives a fully claimed board with no triple to the second player', () => {
    // {2,3,6,8,9} against {1,4,5,7}: the drawn tic-tac-toe position, since
    // sums of 15 are exactly the lines of the 3x3 magic square
    const start = board({ 2: 0, 3: 0, 6: 0, 8: 0, 1: 1, 4: 1, 5: 1, 7: 1 });
    const outcome = moves.chooseNumber.apply(start, asPlayer(0), 9);
    expect(outcome.nextBoard.owner.every(o => o !== null)).toBe(true);
    expect(hasSum15(numbersOwnedBy(outcome.nextBoard.owner, 0))).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while numbers are free and no triple is held', () => {
    const outcome = moves.chooseNumber.apply(board({}), asPlayer(0), 5);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
