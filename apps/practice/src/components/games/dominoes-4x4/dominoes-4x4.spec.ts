import { isDominoAllowed, moves, getPossibleMoves, type Board, type Domino } from './dominoes-4x4';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const emptyBoard: Board = [];
// Player 0 (Árgyélus) places vertical dominoes, player 1 (Félix) horizontal ones.
const VERTICAL = 0;
const HORIZONTAL = 1;

describe('isDominoAllowed', () => {
  it('allows a domino along the current player’s own axis', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, HORIZONTAL, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(true);
  });

  it('rejects a domino along the other player’s axis', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, HORIZONTAL, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(false);
  });

  it('allows the two fields in either order', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 1, col: 0 }, { row: 0, col: 0 }])).toBe(true);
  });

  it('rejects a domino overlapping one already placed', () => {
    const board: Board = [[{ row: 0, col: 0 }, { row: 1, col: 0 }]];
    expect(isDominoAllowed(board, VERTICAL, [{ row: 1, col: 0 }, { row: 2, col: 0 }])).toBe(false);
    expect(isDominoAllowed(board, VERTICAL, [{ row: 2, col: 0 }, { row: 3, col: 0 }])).toBe(true);
  });

  it('rejects fields off the board', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, [{ row: 3, col: 0 }, { row: 4, col: 0 }])).toBe(false);
  });

  it('rejects anything that is not a pair of fields', () => {
    expect(isDominoAllowed(emptyBoard, VERTICAL, undefined as unknown as Domino)).toBe(false);
  });
});

// The two players place along *different* axes — Árgyélus vertical, Félix
// horizontal — so the game ends when the player about to move has no placement
// left, which is a different question for each of them.
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
