import { generateStartBoard, getAllowedMoves, moves } from './gameplay';
import { makeCtx } from '../../../test-utils';

// The knight may never revisit a square, so the tour dies out on its own; the
// player who makes the last move wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly on the move that strands the knight', () => {
    let board = generateStartBoard();
    let player = 0;
    let outcome = moves.moveKnight.apply(board, asPlayer(player), getAllowedMoves(board)[0]);

    while (getAllowedMoves(outcome.nextBoard).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.moveKnight.apply(board, asPlayer(player), getAllowedMoves(board)[0]);
    }

    expect(getAllowedMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
