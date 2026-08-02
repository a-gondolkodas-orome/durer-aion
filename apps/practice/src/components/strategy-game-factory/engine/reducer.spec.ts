import { reduceMove } from './reducer';
import { createInitialCoreState, type CoreState } from './store';
import type { MoveDefinition } from '../types';

type Board = string[];

const NAMES: [string, string] = ['P1', 'P2'];

const playState = (overrides: Partial<CoreState<Board>> = {}): CoreState<Board> => ({
  ...createInitialCoreState<Board>(['initial']),
  phase: 'play',
  currentPlayer: 0,
  chosenRoleIndex: 0,
  ...overrides
});

const reduce = (state: CoreState<Board>, def: MoveDefinition<Board>, ...args: unknown[]) =>
  reduceMove(state, def, 'testMove', args, NAMES);

describe('reduceMove', () => {
  it('isTurnEnd flips the player and closes the turn', () => {
    const def: MoveDefinition<Board> = {
      apply: (board) => ({ nextBoard: [...board, 'x'], isTurnEnd: true })
    };
    const transition = reduce(playState(), def);
    expect(transition.state.currentPlayer).toBe(1);
    expect(transition.state.currentTurnHasMoves).toBe(false);
    expect(transition.state.board).toEqual(['initial', 'x']);
    expect(transition.state.moveCount).toBe(1);
  });

  it('a move that neither ends the turn nor the game leaves the turn open', () => {
    const def: MoveDefinition<Board> = { apply: (board) => ({ nextBoard: [...board, 'x'] }) };
    const transition = reduce(playState(), def);
    expect(transition.state.currentPlayer).toBe(0);
    expect(transition.state.currentTurnHasMoves).toBe(true);
  });

  it('autoEndOfTurn passes through to the shell', () => {
    const def: MoveDefinition<Board> = {
      apply: (board) => ({ nextBoard: board, autoEndOfTurn: true })
    };
    expect(reduce(playState(), def).autoEndOfTurn).toBe(true);
  });

  it('gameEnd sets phase and winner without flipping the player', () => {
    const def: MoveDefinition<Board> = {
      apply: (board) => ({ nextBoard: board, gameEnd: { winnerIndex: 1 } })
    };
    const transition = reduce(playState(), def);
    expect(transition.state.phase).toBe('gameEnd');
    expect(transition.state.winnerIndex).toBe(1);
    expect(transition.state.currentPlayer).toBe(0); // not flipped
    expect(transition.gameJustEnded).toEqual({ winnerIndex: 1 });
  });

  it('nextTurnState sets, undefined keeps, null clears turnState', () => {
    const set: MoveDefinition<Board> = { apply: (b) => ({ nextBoard: b, nextTurnState: 's' }) };
    const keep: MoveDefinition<Board> = { apply: (b) => ({ nextBoard: b }) };
    const clear: MoveDefinition<Board> = { apply: (b) => ({ nextBoard: b, nextTurnState: null }) };
    const afterSet = reduce(playState(), set).state;
    expect(afterSet.turnState).toBe('s');
    const afterKeep = reduce(afterSet, keep).state;
    expect(afterKeep.turnState).toBe('s');
    expect(reduce(afterKeep, clear).state.turnState).toBe(null);
  });

  it('throws in dev when gameEnd is combined with isTurnEnd or autoEndOfTurn', () => {
    const def: MoveDefinition<Board> = {
      apply: (board) => ({ nextBoard: board, isTurnEnd: true, gameEnd: { winnerIndex: 0 } })
    };
    expect(() => reduce(playState(), def)).toThrow(/gameEnd together with/);
  });

  it('suppresses autoEndOfTurn when a move ends the game (prod path)', () => {
    // in dev the combination throws (see above); in prod the game end wins and
    // no endOfTurnMove may be scheduled afterwards
    vi.stubEnv('DEV', false);
    try {
      const def: MoveDefinition<Board> = {
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
    const def: MoveDefinition<Board> = {
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
    const midMove: MoveDefinition<Board> = {
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
    const def: MoveDefinition<Board> = {
      validate: (_board, { ctx }) => ctx.turnState === 'armed' && ctx.moveCount === 3,
      apply: (board) => ({ nextBoard: board, isTurnEnd: true })
    };
    const rejected = reduce(playState(), def);
    expect(rejected.illegal).toBe(true);
    const accepted = reduce(playState({ turnState: 'armed', moveCount: 3 }), def);
    expect(accepted.illegal).toBeUndefined();
  });
});
