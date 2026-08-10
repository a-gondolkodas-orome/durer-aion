import { startBoardOfCategoryA, moves, type Board, type TurnState } from './gameplay';
import { smartBotStrategy } from './bot-strategy';
import { forcedWinnerIndex, makeCtx } from 'test-utils';

describe('coins-in-3-piles move validators', () => {
  const isRemovalAllowed = (board: Board, turnState: TurnState | null, value: number) =>
    moves.removeCoin.validate(board, { ctx: makeCtx({ turnState }) }, value);
  const isAddAllowed = (board: Board, turnState: TurnState | null, value: number) =>
    moves.addCoin.validate(board, { ctx: makeCtx({ turnState }) }, value);
  const isPassAllowed = (board: Board, turnState: TurnState | null) =>
    moves.passAddition.validate(board, { ctx: makeCtx({ turnState }) });

  describe('removeCoin', () => {
    it('allows removing from a non-empty pile at the start of a turn', () => {
      expect(isRemovalAllowed([3, 5, 7], null, 1)).toBe(true);
      expect(isRemovalAllowed([3, 5, 7], null, 3)).toBe(true);
    });

    it('rejects removing from an empty pile', () => {
      expect(isRemovalAllowed([0, 5, 7], null, 1)).toBe(false);
    });

    it('rejects a coin value out of the 1..3 range', () => {
      expect(isRemovalAllowed([3, 5, 7], null, 0)).toBe(false);
      expect(isRemovalAllowed([3, 5, 7], null, 4)).toBe(false);
    });

    it('rejects a second removal in the same turn', () => {
      expect(isRemovalAllowed([3, 5, 7], { removedCoinValue: 3 }, 1)).toBe(false);
    });
  });

  describe('addCoin', () => {
    it('rejects placing back before any coin was removed', () => {
      expect(isAddAllowed([3, 5, 7], null, 1)).toBe(false);
    });

    it('allows placing back a strictly smaller coin', () => {
      expect(isAddAllowed([3, 5, 6], { removedCoinValue: 3 }, 1)).toBe(true);
      expect(isAddAllowed([3, 5, 6], { removedCoinValue: 3 }, 2)).toBe(true);
    });

    it('rejects placing back a coin greater than or equal to the removed value', () => {
      expect(isAddAllowed([3, 5, 6], { removedCoinValue: 2 }, 2)).toBe(false);
      expect(isAddAllowed([3, 5, 6], { removedCoinValue: 2 }, 3)).toBe(false);
    });

  });

  describe('passAddition', () => {
    it('allows passing once a coin was removed', () => {
      expect(isPassAllowed([3, 5, 6], { removedCoinValue: 2 })).toBe(true);
    });

    it('rejects passing before any coin was removed', () => {
      expect(isPassAllowed([3, 5, 7], null)).toBe(false);
    });
  });
});

describe('coins-in-3-piles move outcomes', () => {
  const ctx = makeCtx<TurnState>({ currentPlayer: 0 });

  it('removing a 1-coin ends the turn without a place-back phase', () => {
    expect(moves.removeCoin.apply([2, 5, 7], { ctx }, 1))
      .toEqual({ nextBoard: [1, 5, 7], isTurnEnd: true });
  });

  it('removing the last coin as a 1-coin ends the game, the mover winning', () => {
    expect(moves.removeCoin.apply([1, 0, 0], { ctx }, 1))
      .toEqual({ nextBoard: [0, 0, 0], gameEnd: { winnerIndex: 0 } });
  });

  it('removing a 2- or 3-coin starts the place-back phase instead of ending the turn', () => {
    expect(moves.removeCoin.apply([3, 5, 7], { ctx }, 3))
      .toEqual({ nextBoard: [3, 5, 6], nextTurnState: { removedCoinValue: 3 } });
  });

  it('placing back a coin ends the turn and clears the place-back state', () => {
    expect(moves.addCoin.apply([3, 5, 6], { ctx }, 2))
      .toEqual({ nextBoard: [3, 6, 6], nextTurnState: null, isTurnEnd: true });
  });

  it('passing on the empty board ends the game, the mover winning', () => {
    expect(moves.passAddition.apply([0, 0, 0], { ctx }))
      .toEqual({ nextBoard: [0, 0, 0], nextTurnState: null, gameEnd: { winnerIndex: 0 } });
  });

  it('passing on a non-empty board just ends the turn', () => {
    expect(moves.passAddition.apply([3, 5, 6], { ctx }))
      .toEqual({ nextBoard: [3, 5, 6], nextTurnState: null, isTurnEnd: true });
  });
});

// A competition hands out a board like this one and lets the team pick a role,
// so what has to hold is not just that the game ends but that a *named* role
// forces the win — here the replier, since 3-5-7 is all-odd and so lost for the
// mover.
describe('startBoardOfCategoryA', () => {
  it('is won by the replier against optimal play', () => {
    expect(forcedWinnerIndex({
      gameplay: { moves }, botStrategy: smartBotStrategy, startBoard: startBoardOfCategoryA
    })).toBe(1);
  });
});
