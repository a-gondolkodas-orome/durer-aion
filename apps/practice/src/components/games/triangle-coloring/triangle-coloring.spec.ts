import { range } from 'lodash';
import { moves, isColoringAllowed } from './triangle-coloring';
import { makeCtx } from '../../../test-utils';

// Colouring a triangle forbids its side-neighbours, so the grid runs out; the
// player who colours the last available triangle wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const ALLOWED = 1 as const;
type Board = Parameters<typeof moves.colorTriangle.apply>[0];
const allowedTriangles = (board: Board) => range(16).filter(i => isColoringAllowed(board, i));

describe('end of game', () => {
  it('ends exactly on the colouring that uses up the grid', () => {
    let board: Board = Array(16).fill(ALLOWED);
    let player = 0;
    let outcome = moves.colorTriangle.apply(board, asPlayer(player), allowedTriangles(board)[0]);

    while (allowedTriangles(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.colorTriangle.apply(board, asPlayer(player), allowedTriangles(board)[0]);
    }

    expect(allowedTriangles(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
