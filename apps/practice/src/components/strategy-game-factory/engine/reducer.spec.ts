import { reduceMove } from './reducer';
import { createInitialCoreState, type CoreState } from './store';
import type { Events, NormalizedMove } from '../types';

type Board = string[];

const NAMES: [string, string] = ['P1', 'P2'];

const playState = (overrides: Partial<CoreState<Board>> = {}): CoreState<Board> => ({
  ...createInitialCoreState<Board>(['initial']),
  phase: 'play',
  currentPlayer: 0,
  chosenRoleIndex: 0,
  ...overrides
});

const reduce = (state: CoreState<Board>, def: NormalizedMove<Board>, ...args: unknown[]) =>
  reduceMove(state, def, 'testMove', args, NAMES);

describe('reduceMove — legacy (events-based) contract equivalence', () => {
  it('bare endGame() after endTurn() credits the mover, not the flipped player', () => {
    // The one real trap of moving from async React setState to a synchronous
    // reducer: ~40 legacy games call endTurn() first, then a bare endGame(),
    // which must still resolve to the player at move start.
    const def: NormalizedMove<Board> = {
      legacyApply: (board, { events }: { events: Events }) => {
        events.endTurn();
        events.endGame();
        return { nextBoard: board };
      }
    };
    const transition = reduce(playState(), def);
    expect(transition.state.winnerIndex).toBe(0);
    expect(transition.gameJustEnded).toEqual({ winnerIndex: 0 });
    expect(transition.state.phase).toBe('gameEnd');
  });

  it('endGame(winner) followed by endTurn() keeps the winner intact (thief-sheriff shape)', () => {
    const def: NormalizedMove<Board> = {
      legacyApply: (board, { events }: { events: Events }) => {
        events.endGame(1);
        events.endTurn();
        return { nextBoard: board };
      }
    };
    const transition = reduce(playState(), def);
    expect(transition.state.winnerIndex).toBe(1);
    expect(transition.state.phase).toBe('gameEnd');
    expect(transition.state.currentPlayer).toBe(1); // trailing flip kept, inert
  });

  it('endTurn() flips the player and closes the turn', () => {
    const def: NormalizedMove<Board> = {
      legacyApply: (board, { events }: { events: Events }) => {
        events.endTurn();
        return { nextBoard: [...board, 'x'] };
      }
    };
    const transition = reduce(playState(), def);
    expect(transition.state.currentPlayer).toBe(1);
    expect(transition.state.currentTurnHasMoves).toBe(false);
    expect(transition.state.board).toEqual(['initial', 'x']);
    expect(transition.state.moveCount).toBe(1);
  });

  it('setTurnState writes turnState', () => {
    const def: NormalizedMove<Board> = {
      legacyApply: (board, { events }: { events: Events }) => {
        events.setTurnState('stage2');
        return { nextBoard: board };
      }
    };
    expect(reduce(playState(), def).state.turnState).toBe('stage2');
  });

  it('legacy autoEndOfTurn passes through', () => {
    const def: NormalizedMove<Board> = {
      legacyApply: (board) => ({ nextBoard: board, autoEndOfTurn: true })
    };
    expect(reduce(playState(), def).autoEndOfTurn).toBe(true);
  });
});

describe('reduceMove — outcome-returning (apply) contract', () => {
  it('isTurnEnd flips the player and closes the turn', () => {
    const def: NormalizedMove<Board> = {
      apply: (board) => ({ nextBoard: board, isTurnEnd: true })
    };
    const transition = reduce(playState(), def);
    expect(transition.state.currentPlayer).toBe(1);
    expect(transition.state.currentTurnHasMoves).toBe(false);
  });

  it('gameEnd sets phase and winner without flipping the player', () => {
    const def: NormalizedMove<Board> = {
      apply: (board) => ({ nextBoard: board, gameEnd: { winnerIndex: 1 } })
    };
    const transition = reduce(playState(), def);
    expect(transition.state.phase).toBe('gameEnd');
    expect(transition.state.winnerIndex).toBe(1);
    expect(transition.state.currentPlayer).toBe(0); // not flipped
    expect(transition.gameJustEnded).toEqual({ winnerIndex: 1 });
  });

  it('nextTurnState sets, undefined keeps, null clears turnState', () => {
    const set: NormalizedMove<Board> = { apply: (b) => ({ nextBoard: b, nextTurnState: 's' }) };
    const keep: NormalizedMove<Board> = { apply: (b) => ({ nextBoard: b }) };
    const clear: NormalizedMove<Board> = { apply: (b) => ({ nextBoard: b, nextTurnState: null }) };
    const afterSet = reduce(playState(), set).state;
    expect(afterSet.turnState).toBe('s');
    const afterKeep = reduce(afterSet, keep).state;
    expect(afterKeep.turnState).toBe('s');
    expect(reduce(afterKeep, clear).state.turnState).toBe(null);
  });

  it('throws in dev when gameEnd is combined with isTurnEnd or autoEndOfTurn', () => {
    const def: NormalizedMove<Board> = {
      apply: (board) => ({ nextBoard: board, isTurnEnd: true, gameEnd: { winnerIndex: 0 } })
    };
    expect(() => reduce(playState(), def)).toThrow(/gameEnd together with/);
  });

  it('suppresses autoEndOfTurn when a v2 move ends the game (prod path)', () => {
    // in dev the combination throws (see above); in prod the game end wins and
    // no endOfTurnMove may be scheduled afterwards
    vi.stubEnv('DEV', false);
    try {
      const def: NormalizedMove<Board> = {
        apply: (board) => ({ nextBoard: board, autoEndOfTurn: true, gameEnd: { winnerIndex: 0 } })
      };
      const transition = reduce(playState(), def);
      expect(transition.autoEndOfTurn).toBe(false);
      expect(transition.gameJustEnded).toEqual({ winnerIndex: 0 });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('reduceMove — shared mechanics', () => {
  it('a failing validator returns the state unchanged (same reference) and flags illegal', () => {
    const def: NormalizedMove<Board> = {
      validate: () => false,
      apply: (board) => ({ nextBoard: [...board, 'x'] })
    };
    const state = playState();
    const transition = reduce(state, def);
    expect(transition.illegal).toBe(true);
    expect(transition.state).toBe(state);
    expect(transition.result.nextBoard).toBe(state.board);
  });

  it('takes the undo snapshot on the first move of a turn only', () => {
    const midMove: NormalizedMove<Board> = {
      apply: (board) => ({ nextBoard: [...board, 'x'] })
    };
    const first = reduce(playState(), midMove);
    expect(first.state.undoSnapshot).toEqual({
      board: ['initial'], currentPlayer: 0, moveCount: 0
    });
    const second = reduce(first.state, midMove);
    expect(second.state.undoSnapshot).toEqual(first.state.undoSnapshot);
    expect(second.state.moveCount).toBe(2);
  });

  it('the validator sees current turnState and moveCount through ctx', () => {
    const def: NormalizedMove<Board> = {
      validate: (_board, { ctx }) => ctx.turnState === 'armed' && ctx.moveCount === 3,
      apply: (board) => ({ nextBoard: board, isTurnEnd: true })
    };
    const rejected = reduce(playState(), def);
    expect(rejected.illegal).toBe(true);
    const accepted = reduce(playState({ turnState: 'armed', moveCount: 3 }), def);
    expect(accepted.illegal).toBeUndefined();
  });
});
