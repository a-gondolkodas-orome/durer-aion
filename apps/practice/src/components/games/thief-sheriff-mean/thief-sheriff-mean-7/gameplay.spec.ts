import { moves } from './gameplay';
import { Sheriff, Thief, hasWinningTriple, type Board } from '../gameplay';
import { makeCtx } from '../../../../test-utils';

// The thief wins by holding three cards in arithmetic progression; the sheriff
// wins by preventing that until the cards run out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (sheriff: number[], thief: number[], numTurns: number): Board =>
  ({ cards: [sheriff, thief], numTurns });

describe('thief-sheriff-mean-7 end of game', () => {
  it('gives the game to the thief when the final sweep completes a triple', () => {
    // after this take the thief also sweeps up whatever is left of the 7 cards
    const outcome = moves.takeCard.apply(board([1, 6], [2, 4], 4), asPlayer(Thief), [3]);
    expect(outcome.nextBoard.numTurns).toBe(5);
    expect(hasWinningTriple(outcome.nextBoard.cards[Thief])).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: Thief });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the sheriff when the final hand has no triple', () => {
    const outcome = moves.takeCard.apply(board([2, 3, 4], [1, 7], 4), asPlayer(Sheriff), [5]);
    expect(outcome.nextBoard.numTurns).toBe(5);
    expect(hasWinningTriple(outcome.nextBoard.cards[Thief])).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: Sheriff });
  });

  it('passes the turn before the fifth take', () => {
    const outcome = moves.takeCard.apply(board([1], [2], 2), asPlayer(Sheriff), [3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
