import { hasAnyMove, isNodePlayable, legalNodes, moves, type Board } from './gameplay';
import { makeCtx } from '../../../test-utils';

// K(2,3): 0=A and 1=B are the hubs, each joined to 2=C, 3=D and 4=E. Neither
// hub is joined to the other, and C, D, E are not joined to each other.
describe('isNodePlayable', () => {
  it('allows every field of the empty board', () => {
    expect([0, 1, 2, 3, 4].every((node) => isNodePlayable([0, 0, 0, 0, 0], node))).toBe(true);
  });

  it('allows a field whose neighbour holds the same number of coins', () => {
    const board: Board = [1, 3, 1, 2, 4];
    expect(isNodePlayable(board, 0)).toBe(true); // A-C line, both 1
    expect(isNodePlayable(board, 2)).toBe(true);
  });

  it('rejects a field with no equal-valued neighbour', () => {
    expect(isNodePlayable([1, 3, 2, 4, 5], 0)).toBe(false);
  });

  it('rejects a field equal only to one on its own side', () => {
    // the two hubs both hold 1, but they are not joined
    expect(isNodePlayable([1, 1, 2, 3, 4], 0)).toBe(false);
    // C and D both hold 2, but they are not joined either
    expect(isNodePlayable([1, 3, 2, 2, 4], 2)).toBe(false);
  });

  it('rejects anything that is not a field of the graph', () => {
    const board: Board = [0, 0, 0, 0, 0];
    expect(isNodePlayable(board, 5)).toBe(false);
    expect(isNodePlayable(board, -1)).toBe(false);
    expect(isNodePlayable(board, 1.5)).toBe(false);
  });
});

// A coin may go on a field joined by a line to an equal-valued one, so the
// position eventually admits nothing; whoever places the last coin wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the coin that makes every further move impossible', () => {
    let board: Board = [0, 0, 0, 0, 0];
    let player = 0;
    let outcome = moves.placeCoin.apply(board, asPlayer(player), legalNodes(board)[0]);

    while (hasAnyMove(outcome.nextBoard)) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeCoin.apply(board, asPlayer(player), legalNodes(board)[0]);
    }

    expect(hasAnyMove(outcome.nextBoard)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
