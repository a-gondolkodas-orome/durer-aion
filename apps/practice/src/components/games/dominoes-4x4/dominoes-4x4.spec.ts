import { moves, getPossibleMoves, type Board } from './dominoes-4x4';
import { makeCtx } from '../../../test-utils';

// The two players place along *different* axes — Árgyélus vertical, Félix
// horizontal — so the game ends when the player about to move has no placement
// left, which is a different question for each of them.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends exactly when the next player is the one who runs out', () => {
    let board: Board = [];
    let player = 0;
    let outcome = moves.placeDomino.apply(
      board, asPlayer(player), getPossibleMoves(board, player)[0]
    );

    while (getPossibleMoves(outcome.nextBoard, 1 - player).length > 0) {
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
      player = 1 - player;
      outcome = moves.placeDomino.apply(
        board, asPlayer(player), getPossibleMoves(board, player)[0]
      );
    }

    // the loser is the one with no placement, which is the *other* axis
    expect(getPossibleMoves(outcome.nextBoard, 1 - player)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('can end while the mover still has placements of their own left', () => {
    // three columns filled vertically: Árgyélus could still play column 3, but
    // Félix has no horizontal pair anywhere, so Árgyélus has already won
    const board: Board = [
      [{ row: 0, col: 0 }, { row: 1, col: 0 }], [{ row: 2, col: 0 }, { row: 3, col: 0 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }], [{ row: 2, col: 1 }, { row: 3, col: 1 }],
      [{ row: 0, col: 2 }, { row: 1, col: 2 }]
    ];
    const outcome = moves.placeDomino.apply(
      board, asPlayer(0), [{ row: 2, col: 2 }, { row: 3, col: 2 }]
    );
    expect(getPossibleMoves(outcome.nextBoard, 1)).toEqual([]);
    expect(getPossibleMoves(outcome.nextBoard, 0).length).toBeGreaterThan(0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });
});
