import { moves, getPossibleMoves, type Board } from './dominoes-on-chessboard';
import { makeCtx } from '../../../test-utils';

// Both players place along either axis here, so the game simply ends when no
// two adjacent free squares are left; the player who covers the last pair wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the domino that leaves no adjacent free pair', () => {
    let board: Board = [];
    let player = 0;
    let outcome = moves.placeDomino.apply(board, asPlayer(player), getPossibleMoves(board)[0]);

    while (getPossibleMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeDomino.apply(board, asPlayer(player), getPossibleMoves(board)[0]);
    }

    expect(getPossibleMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
