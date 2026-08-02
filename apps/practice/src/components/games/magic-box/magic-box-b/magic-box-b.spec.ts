import { moves } from './magic-box-b';
import { LINES, isLineFull } from './helpers';
import { makeCtx } from '../../../../test-utils';

// Designating an already-full line wins, because the opponent cannot answer it.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('magic-box-b end of game', () => {
  const stonesFilling = (lineIndex: number) => {
    const stones = Array(9).fill(false);
    LINES[lineIndex].forEach(i => { stones[i] = true; });
    return stones;
  };

  it.each([0, 1])('ends FOR the mover (player %i) on designating a full line', player => {
    const board = { stones: stonesFilling(0), pendingLine: null };
    expect(isLineFull(board.stones, 0)).toBe(true);
    const outcome = moves.designateLine.apply(board, asPlayer(player), 0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn when the designated line still has room', () => {
    const board = { stones: Array(9).fill(false), pendingLine: null };
    const outcome = moves.designateLine.apply(board, asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('leaves the turn open after placing, before the line is designated', () => {
    const board = { stones: Array(9).fill(false), pendingLine: 0 };
    const outcome = moves.placeStone.apply(board, asPlayer(0), 4);
    expect(outcome.nextBoard.pendingLine).toBeNull();
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
