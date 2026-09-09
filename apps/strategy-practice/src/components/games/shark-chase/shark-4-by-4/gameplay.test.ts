import { isGameEnd, moves } from './gameplay';
import { RESEARCHERS, SHARK, type Board } from '../gameplay';
import { makeCtx } from 'test-utils';

// The researchers win by moving a submarine onto the shark (or steering the
// shark into one); the shark wins by surviving the turn limit.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const CELL_COUNT = 16;
const LAST_TURN = 11;

const board = (overrides: Partial<Board> = {}): Board => ({
  submarines: Array(CELL_COUNT).fill(0),
  shark: 2,
  turn: 1,
  sharkMovesInTurn: 0,
  ...overrides
});

describe('shark-chase 4x4 end of game', () => {
  it('gives the game to the researchers when a submarine reaches the shark', () => {
    const submarines = Array(CELL_COUNT).fill(0);
    submarines[1] = 1;
    const outcome = moves.moveSubmarine.apply(
      board({ submarines, shark: 2 }), asPlayer(RESEARCHERS), { from: 1, to: 2 }
    );
    expect(isGameEnd(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: RESEARCHERS });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the shark when the turn limit runs out', () => {
    const submarines = Array(CELL_COUNT).fill(0);
    submarines[0] = 1; // far from the shark, so nothing catches it
    const outcome = moves.moveShark.apply(
      board({ submarines, shark: 2, turn: LAST_TURN, sharkMovesInTurn: 1 }), asPlayer(SHARK), 3
    );
    expect(outcome.nextBoard.turn).toBe(LAST_TURN + 1);
    expect(isGameEnd(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: SHARK });
  });

  it('gives the game to the researchers when the shark swims into a submarine', () => {
    const submarines = Array(CELL_COUNT).fill(0);
    submarines[3] = 1;
    const outcome = moves.moveShark.apply(
      board({ submarines, shark: 2, sharkMovesInTurn: 1 }), asPlayer(SHARK), 3
    );
    expect(outcome.gameEnd).toEqual({ winnerIndex: RESEARCHERS });
  });

  it('leaves the shark turn open after a free first step', () => {
    const outcome = moves.moveShark.apply(board({ shark: 2 }), asPlayer(SHARK), 3);
    expect(outcome.nextBoard.sharkMovesInTurn).toBe(1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn on an ordinary submarine move', () => {
    const submarines = Array(CELL_COUNT).fill(0);
    submarines[0] = 1;
    const outcome = moves.moveSubmarine.apply(
      board({ submarines, shark: 2 }), asPlayer(RESEARCHERS), { from: 0, to: 1 }
    );
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
