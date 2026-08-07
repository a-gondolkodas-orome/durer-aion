import { moves, type TurnState } from './gameplay';
import { makeCtx } from '../../../../test-utils';

// The game always ends on the tenth square; the second player wins only if the
// five counts are all distinct by then.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx<TurnState>({ currentPlayer }) });

describe('five-squares end of game', () => {
  it('gives the game to the second player when the five counts are all distinct', () => {
    // 0+1+2+3+3 -> the tenth square makes 0,1,2,3,4
    const outcome = moves.addPiece.apply([0, 1, 2, 3, 3], asPlayer(0), 4);
    expect(outcome.nextBoard).toEqual([0, 1, 2, 3, 4]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.nextTurnState).toBeNull();
  });

  it('gives the game to the first player when two counts coincide', () => {
    // 1+1+2+3+2 -> the tenth square makes 1,1,2,3,3
    const outcome = moves.addPiece.apply([1, 1, 2, 3, 2], asPlayer(0), 4);
    expect(outcome.nextBoard).toEqual([1, 1, 2, 3, 3]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('keeps the turn open for the second player\'s paired placement', () => {
    // player 1 placing the 3rd square starts a two-square turn
    const outcome = moves.addPiece.apply([1, 1, 0, 0, 0], asPlayer(1), 2);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
    expect(outcome.nextTurnState).toEqual({ firstPlacedSquareIndex: 2 });
  });
});
