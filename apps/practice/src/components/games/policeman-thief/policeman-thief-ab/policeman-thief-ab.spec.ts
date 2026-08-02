import { moves, type Board } from './policeman-thief-ab';
import { POLICE, THIEF } from './helpers';
import { makeCtx } from '../../../../test-utils';

// The police win by landing on the thief within three thief moves; surviving
// the third move wins it for the thief.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (overrides: Partial<Board> = {}): Board => ({
  turnCount: 0,
  policemen: [0, 0],
  thief: 3,
  firstPolicemanMoved: false,
  ...overrides
});

describe('end of game', () => {
  it('gives the game to the police when the thief walks into one', () => {
    // vertices 3 and 1 are neighbours on the cube graph; a policeman waits on 1
    const outcome = moves.moveThief.apply(board({ policemen: [1, 5] }), asPlayer(THIEF), 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the thief once the third move leaves them free', () => {
    const outcome = moves.moveThief.apply(
      board({ turnCount: 2, policemen: [0, 5], thief: 3 }), asPlayer(THIEF), 1
    );
    expect(outcome.nextBoard.turnCount).toBe(3);
    expect(outcome.gameEnd).toEqual({ winnerIndex: THIEF });
  });

  it('gives the game to the police when the second policeman catches the thief', () => {
    const outcome = moves.moveSecondPoliceman.apply(
      board({ policemen: [0, 1], firstPolicemanMoved: true, thief: 3 }), asPlayer(POLICE), 3
    );
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
  });

  it('leaves the police turn open after only the first policeman has moved', () => {
    const outcome = moves.moveFirstPoliceman.apply(board(), asPlayer(POLICE), 1);
    expect(outcome.nextBoard.firstPolicemanMoved).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while the chase is still on', () => {
    const outcome = moves.moveThief.apply(board({ policemen: [0, 5] }), asPlayer(THIEF), 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
