import { moves } from './five-connected-fields';
import { hasAnyMove, legalNodes, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

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
