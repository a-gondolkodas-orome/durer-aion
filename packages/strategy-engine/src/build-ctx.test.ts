import { buildCtx } from './build-ctx';
import { createInitialCoreState, type CoreState } from './store';

const NAMES: [string, string] = ['Anna', 'Bea'];

const stateWith = (patch: Partial<CoreState<number[]>> = {}): CoreState<number[]> =>
  ({ ...createInitialCoreState<number[]>([1, 2, 3]), ...patch });

describe('buildCtx', () => {
  it('derives isHumanVsHumanGame from the mode rather than exposing the mode', () => {
    expect(buildCtx(stateWith({ mode: 'vsHuman' }), NAMES).isHumanVsHumanGame).toBe(true);
    expect(buildCtx(stateWith({ mode: 'vsComputer' }), NAMES).isHumanVsHumanGame).toBe(false);
    expect(buildCtx(stateWith(), NAMES)).not.toHaveProperty('mode');
  });

  // The field list is an allow-list, not a spread: board would be a second
  // source of truth beside the one threaded through moves, and the rest is
  // engine bookkeeping an authoritative server must never ship to a client.
  it('keeps board and the engine bookkeeping out of the ctx games see', () => {
    const ctx = buildCtx(stateWith({
      undoSnapshot: { board: [1], currentPlayer: 0, moveCount: 1 },
      currentTurnHasMoves: true
    }), NAMES);

    expect(ctx).not.toHaveProperty('board');
    expect(ctx).not.toHaveProperty('undoSnapshot');
    expect(ctx).not.toHaveProperty('currentTurnHasMoves');
    expect(Object.keys(ctx).sort()).toEqual([
      'chosenRoleIndex', 'currentPlayer', 'isClientMoveAllowed', 'isHumanVsHumanGame',
      'moveCount', 'phase', 'resolvedPlayerNames', 'turnState', 'winnerIndex'
    ]);
  });

  it('passes the remaining state fields through untouched', () => {
    const turnState = { firstSelectedPile: 2 };
    const ctx = buildCtx(stateWith({
      phase: 'play', currentPlayer: 1, chosenRoleIndex: 0, turnState, moveCount: 7, winnerIndex: null
    }), NAMES);

    expect(ctx.phase).toBe('play');
    expect(ctx.currentPlayer).toBe(1);
    expect(ctx.chosenRoleIndex).toBe(0);
    expect(ctx.turnState).toBe(turnState);
    expect(ctx.moveCount).toBe(7);
    expect(ctx.winnerIndex).toBeNull();
    expect(ctx.resolvedPlayerNames).toEqual(NAMES);
  });
});

// isClientMoveAllowed is what every game guards its interactions with, so each
// way of arriving at false is worth stating separately.
describe('buildCtx: isClientMoveAllowed', () => {
  const allowed = (patch: Partial<CoreState<number[]>>) =>
    buildCtx(stateWith(patch), NAMES).isClientMoveAllowed;

  it('is false outside the play phase, whatever the seats say', () => {
    expect(allowed({ phase: 'roleSelection', mode: 'vsHuman' })).toBe(false);
    expect(allowed({ phase: 'gameEnd', mode: 'vsHuman', currentPlayer: 0, chosenRoleIndex: 0 }))
      .toBe(false);
  });

  it('is true for either player while a human-vs-human game is in play', () => {
    expect(allowed({ phase: 'play', mode: 'vsHuman', currentPlayer: 0 })).toBe(true);
    expect(allowed({ phase: 'play', mode: 'vsHuman', currentPlayer: 1 })).toBe(true);
  });

  it('is true against the computer only on the human’s own turn', () => {
    expect(allowed({ phase: 'play', mode: 'vsComputer', currentPlayer: 0, chosenRoleIndex: 0 }))
      .toBe(true);
    expect(allowed({ phase: 'play', mode: 'vsComputer', currentPlayer: 1, chosenRoleIndex: 0 }))
      .toBe(false);
  });

  // Two unset seats would compare equal, so without its own null check the
  // vsComputer arm would call an unstarted game interactive. Nothing reaches
  // that state today — startGame is the only way into the play phase and
  // always sets currentPlayer — so this guards a future path in that forgets.
  it('is false while no player is to move, in either mode', () => {
    expect(allowed({ phase: 'play', mode: 'vsComputer', currentPlayer: null, chosenRoleIndex: null }))
      .toBe(false);
    expect(allowed({ phase: 'play', mode: 'vsHuman', currentPlayer: null })).toBe(false);
  });
});
