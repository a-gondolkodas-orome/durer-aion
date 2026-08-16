import {
  type Board, boardAfterRemoval, fullStartBoards, testStartBoards, hasNoLegalMove,
  moves, openPiles
} from './gameplay';
import { isWinningForMover, smartBotStrategy } from './bot-strategy';
import { forcedWinnerIndex, makeCtx, moveValidator } from 'test-utils';

// Which pile is open depends on who is taking, so the mover goes into the ctx.
const isRemovalAllowed = (board: Board, player: number, pileId: number): boolean =>
  moveValidator(moves.removeStone, makeCtx({ currentPlayer: player }))(board, pileId);

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (
  piles: [number, number], leftRestriction: [boolean, boolean] = [false, false]
): Board => ({ piles, leftRestriction });

describe('isRemovalAllowed', () => {
  it('accepts either pile when nobody is restricted', () => {
    const b = board([3, 4]);
    expect(isRemovalAllowed(b, 0, 0)).toBe(true);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
  });

  it('refuses an empty pile', () => {
    expect(isRemovalAllowed(board([0, 4]), 0, 0)).toBe(false);
    expect(isRemovalAllowed(board([3, 0]), 0, 1)).toBe(false);
  });

  it('closes the left pile to a player who took from it last turn', () => {
    const b = board([3, 4], [true, false]);
    expect(isRemovalAllowed(b, 0, 0)).toBe(false);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
  });

  it('restricts only the player who took from the left, not the other one', () => {
    const b = board([3, 4], [true, false]);
    expect(isRemovalAllowed(b, 1, 0)).toBe(true);
  });

  it('never restricts the right pile', () => {
    const b = board([3, 4], [true, true]);
    expect(isRemovalAllowed(b, 0, 1)).toBe(true);
    expect(isRemovalAllowed(b, 1, 1)).toBe(true);
  });

  it('refuses a pile that does not exist', () => {
    const b = board([3, 4]);
    expect(isRemovalAllowed(b, 0, 2)).toBe(false);
    expect(isRemovalAllowed(b, 0, -1)).toBe(false);
  });
});

describe('openPiles', () => {
  it('lists both piles when nobody is restricted', () => {
    expect(openPiles(board([3, 4]), 0)).toEqual([0, 1]);
  });

  it('drops an empty pile and a pile closed off to the mover', () => {
    expect(openPiles(board([0, 4]), 0)).toEqual([1]);
    expect(openPiles(board([3, 4], [true, false]), 0)).toEqual([1]);
    expect(openPiles(board([3, 0]), 0)).toEqual([0]);
  });
});

describe('hasNoLegalMove', () => {
  it('is false while either pile is open', () => {
    expect(hasNoLegalMove(board([1, 0]), 0)).toBe(false);
    expect(hasNoLegalMove(board([0, 1]), 0)).toBe(false);
    expect(hasNoLegalMove(board([0, 1], [true, false]), 0)).toBe(false);
  });

  it('is true with nothing left to take', () => {
    expect(hasNoLegalMove(board([0, 0]), 0)).toBe(true);
  });

  it('is true when the right pile is empty and the left one is closed off', () => {
    const b = board([4, 0], [true, false]);
    expect(hasNoLegalMove(b, 0)).toBe(true);
    // the other player took from the right last turn, so the left pile is open to them
    expect(hasNoLegalMove(b, 1)).toBe(false);
  });
});

describe('boardAfterRemoval', () => {
  it("takes the stone and arms the mover's own left restriction", () => {
    expect(boardAfterRemoval(board([3, 4]), 1, 0))
      .toEqual(board([2, 4], [false, true]));
  });

  it("clears the mover's left restriction when they take from the right", () => {
    expect(boardAfterRemoval(board([3, 4], [false, true]), 1, 1))
      .toEqual(board([3, 3], [false, false]));
  });

  it("leaves the other player's restriction alone", () => {
    expect(boardAfterRemoval(board([3, 4], [true, false]), 1, 0))
      .toEqual(board([2, 4], [true, true]));
  });

  it('does not modify the board it is given', () => {
    const before = board([3, 4]);
    boardAfterRemoval(before, 0, 0);
    expect(before).toEqual(board([3, 4]));
  });
});

// The game ends when both piles are empty, or when the right pile is empty and
// the player about to move may not take from the left one (they took from it
// last time).
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on the last stone', p => {
    const outcome = moves.removeStone.apply(board([0, 1]), asPlayer(p), 1);
    expect(outcome.nextBoard.piles).toEqual([0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends when the right pile empties and the opponent is barred from the left', () => {
    // player 1 took from the left last time, so with the right pile gone they are stuck
    const outcome = moves.removeStone.apply(board([1, 1], [false, true]), asPlayer(0), 1);
    expect(outcome.nextBoard.piles).toEqual([1, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn when the opponent may still take from the left', () => {
    const outcome = moves.removeStone.apply(board([1, 1], [false, false]), asPlayer(0), 1);
    expect(outcome.nextBoard.piles).toEqual([1, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('records that the mover just took from the left pile', () => {
    const outcome = moves.removeStone.apply(board([2, 2]), asPlayer(1), 0);
    expect(outcome.nextBoard.leftRestriction).toEqual([false, true]);
    expect(outcome.isTurnEnd).toBe(true);
  });
});

describe.each([
  ['fullStartBoards', fullStartBoards],
  ['testStartBoards', testStartBoards]
] as const)('%s', (_name, boards) => {
  it('starts everyone unrestricted, with both piles stocked', () => {
    for (const startBoard of boards) {
      expect(startBoard.leftRestriction).toEqual([false, false]);
      expect(Math.min(...startBoard.piles)).toBeGreaterThan(0);
    }
  });

  it('gives either player a real chance of holding the winning side', () => {
    const winnable = boards.filter(startBoard => isWinningForMover(startBoard, 0)).length;
    expect(winnable / boards.length).toBeGreaterThan(0.3);
    expect(winnable / boards.length).toBeLessThan(0.7);
  });

  // The balance check above trusts `isWinningForMover`. Playing each board out
  // decides the same question the other way — through the real moves and the
  // real bot — so a wrong predicate and a bot that fails to exploit it cannot
  // agree their way past both.
  it('is decisive, and by the role the predicate names', () => {
    for (const startBoard of boards) {
      const winner = forcedWinnerIndex({
        gameplay: { moves }, botStrategy: smartBotStrategy, startBoard
      });
      expect(winner).toBe(isWinningForMover(startBoard, 0) ? 0 : 1);
    }
  });
});
