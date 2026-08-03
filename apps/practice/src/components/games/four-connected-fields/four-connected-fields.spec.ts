import { moves } from './four-connected-fields';
import { hasAnyMove, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// The player who places the last coin wins: the game ends once no field is
// empty and no line joins two equal counts.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when the last move is played', p => {
    // 0=A and 1=B hold 2 each, so B is playable; filling it leaves [1,2,3,4],
    // where every line joins different counts
    const outcome = moves.placeCoin.apply([1, 2, 2, 4] as Board, asPlayer(p), 2);
    expect(outcome.nextBoard).toEqual([1, 2, 3, 4]);
    expect(hasAnyMove(outcome.nextBoard)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while a move remains', () => {
    const outcome = moves.placeCoin.apply([0, 0, 0, 0] as Board, asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
