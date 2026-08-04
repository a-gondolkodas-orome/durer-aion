import { isDominoAllowed, moves, getPossibleMoves, type Board, type Domino } from './gameplay';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const emptyBoard: Board = [];

describe('isDominoAllowed', () => {
  it('allows a domino covering two uncovered neighbours', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 1, col: 0 }])).toBe(true);
  });

  it('allows the two fields in either order', () => {
    // the smart bot mirrors the opponent's domino through the board's centre,
    // which reverses the pair relative to how the move generator lists it
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 1 }, { row: 0, col: 0 }])).toBe(true);
    expect(isDominoAllowed(emptyBoard, [{ row: 1, col: 0 }, { row: 0, col: 0 }])).toBe(true);
  });

  it('rejects fields that are not neighbours', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 0, col: 2 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }, { row: 1, col: 1 }])).toBe(false);
  });

  it('rejects a domino overlapping one already placed', () => {
    const board: Board = [[{ row: 0, col: 0 }, { row: 0, col: 1 }]];
    expect(isDominoAllowed(board, [{ row: 0, col: 1 }, { row: 0, col: 2 }])).toBe(false);
    expect(isDominoAllowed(board, [{ row: 0, col: 2 }, { row: 0, col: 3 }])).toBe(true);
  });

  it('rejects fields off the board', () => {
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 5 }, { row: 0, col: 6 }])).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: -1, col: 0 }, { row: 0, col: 0 }])).toBe(false);
  });

  it('rejects anything that is not a pair of fields', () => {
    expect(isDominoAllowed(emptyBoard, undefined as unknown as Domino)).toBe(false);
    expect(isDominoAllowed(emptyBoard, [{ row: 0, col: 0 }] as unknown as Domino)).toBe(false);
  });
});

// Both players place along either axis here, so the game simply ends when no
// two adjacent free squares are left; the player who covers the last pair wins.
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
