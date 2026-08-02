import { moves } from './magic-box-a';
import { generateEmptyBoard, hasFullLine } from './helpers';
import { makeCtx } from '../../../../test-utils';

// The player whose stone bursts the box loses, so the ending credits the
// mover's opponent.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('magic-box-a end of game', () => {
  it.each([0, 1])('ends AGAINST the mover (player %i) when the box bursts', player => {
    // stones on the first two cells of the top row; the third bursts it
    const board = generateEmptyBoard();
    board[0] = true;
    board[1] = true;
    const outcome = moves.placeStone.apply(board, asPlayer(player), 2);
    expect(hasFullLine(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while no line is complete', () => {
    const outcome = moves.placeStone.apply(generateEmptyBoard(), asPlayer(0), 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
