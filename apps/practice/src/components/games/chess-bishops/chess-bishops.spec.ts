import { moves } from './chess-bishops';
import { generateStartBoard, getAllowedMoves } from './helpers';
import { makeCtx } from '../../../test-utils';

// Bishops fill the board until no unattacked square is left; the player who
// takes the last one wins. Hand-building a saturated 8x8 board would obscure
// more than it shows, so the test plays one out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the placement that saturates the board', () => {
    let board = generateStartBoard();
    let player = 0;
    let outcome = moves.placeBishop.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeBishop.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
