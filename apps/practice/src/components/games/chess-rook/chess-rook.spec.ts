import { moves } from './chess-rook';
import { generateStartBoard, getAllowedMoves } from './helpers';
import { makeCtx } from '../../../test-utils';

// The rook marks every square it crosses, so its runway shrinks each move; the
// player who leaves it stuck wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the move that strands the rook', () => {
    let board = generateStartBoard();
    let player = 0;
    let outcome = moves.moveRook.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.moveRook.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
