import { moves } from './gameplay';
import { Sheriff, Thief, hasWinningTriple, type Board } from '../gameplay';
import { makeCtx } from '../../../../test-utils';

// The thief wins by holding three cards in arithmetic progression; the sheriff
// wins by preventing that until the cards run out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (sheriff: number[], thief: number[], numTurns: number): Board =>
  ({ cards: [sheriff, thief], numTurns });

describe('thief-sheriff-mean-9 end of game', () => {
  it('ends the moment the thief holds a triple, before the cards run out', () => {
    const outcome = moves.takeCard.apply(board([9], [1, 3], 3), asPlayer(Thief), 5);
    expect(outcome.nextBoard.numTurns).toBe(4);
    expect(outcome.gameEnd).toEqual({ winnerIndex: Thief });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the sheriff when the eighth take leaves no triple', () => {
    const outcome = moves.takeCard.apply(board([2, 3, 5, 6], [1, 4, 9], 7), asPlayer(Sheriff), 7);
    expect(outcome.nextBoard.numTurns).toBe(8);
    expect(hasWinningTriple(outcome.nextBoard.cards[Thief])).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: Sheriff });
  });

  it('passes the turn while the thief has no triple and cards remain', () => {
    const outcome = moves.takeCard.apply(board([1], [2], 2), asPlayer(Sheriff), 5);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
