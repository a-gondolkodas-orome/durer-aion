import { moves } from './take-and-point';
import { type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (piles: number[], pointed: number[] | null = [0, 1]): Board => ({ piles, pointed });

describe('moves.takeStones end of game', () => {
  it.each([0, 1])('ends the game for the mover (player %i) on the last stone', player => {
    const outcome = moves.takeStones.apply(board([0, 3]), asPlayer(player), 1, 3);
    expect(outcome.nextBoard.piles).toEqual([0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
  });

  it('leaves the turn open while stones remain — the mover still has to point', () => {
    const outcome = moves.takeStones.apply(board([2, 3]), asPlayer(0), 1, 3);
    expect(outcome.nextBoard.piles).toEqual([2, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    // NOT isTurnEnd: the same player now points at piles for the opponent
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('clears the pointing when stones are taken', () => {
    const outcome = moves.takeStones.apply(board([2, 3], [0, 1]), asPlayer(0), 0, 1);
    expect(outcome.nextBoard.pointed).toBeNull();
  });
});

describe('moves.pointPiles', () => {
  it('hands the turn over and never ends the game', () => {
    const outcome = moves.pointPiles.apply(board([2, 3], null), asPlayer(0), [0, 1]);
    expect(outcome.nextBoard.pointed).toEqual([0, 1]);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });
});
