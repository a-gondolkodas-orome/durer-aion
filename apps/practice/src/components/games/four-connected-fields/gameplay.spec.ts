import { hasAnyMove, isNodePlayable, moves, type Board } from './gameplay';
import { makeCtx } from 'test-utils';

// 0=A and 1=B are the hubs, joined to each other and to both 2=C and 3=D;
// C and D are not joined.
describe('isNodePlayable', () => {
  it('allows any empty field', () => {
    expect([0, 1, 2, 3].every((node) => isNodePlayable([0, 0, 0, 0], node))).toBe(true);
  });

  it('allows a field whose neighbour holds the same number of coins', () => {
    const board: Board = [2, 2, 1, 3];
    expect(isNodePlayable(board, 0)).toBe(true); // A-B line, both 2
    expect(isNodePlayable(board, 1)).toBe(true);
  });

  it('rejects a non-empty field with no equal-valued neighbour', () => {
    expect(isNodePlayable([2, 3, 1, 4], 2)).toBe(false);
  });

  it('rejects a field equal only to the one it is not joined to', () => {
    // C and D both hold 1, but there is no C-D line
    expect(isNodePlayable([2, 3, 1, 1], 2)).toBe(false);
    expect(isNodePlayable([2, 3, 1, 1], 3)).toBe(false);
  });

  it('rejects anything that is not a field of the graph', () => {
    const board: Board = [0, 0, 0, 0];
    expect(isNodePlayable(board, 4)).toBe(false);
    expect(isNodePlayable(board, -1)).toBe(false);
    expect(isNodePlayable(board, 1.5)).toBe(false);
  });
});

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
