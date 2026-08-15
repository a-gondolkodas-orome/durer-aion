import { createGameStore, createInitialCoreState } from './store';

describe('createGameStore', () => {
  const initial = () => createInitialCoreState<number[]>([1, 2, 3]);

  it('returns the initial state and keeps the same reference between writes', () => {
    const store = createGameStore(initial());
    expect(store.getState().board).toEqual([1, 2, 3]);
    expect(store.getState()).toBe(store.getState());
  });

  it('setState merges a partial patch and notifies subscribers synchronously', () => {
    const store = createGameStore(initial());
    const listener = vi.fn(() => {
      // synchronous: the new state is already visible inside the notification
      expect(store.getState().moveCount).toBe(5);
    });
    store.subscribe(listener);
    store.setState({ moveCount: 5 });
    expect(listener).toHaveBeenCalledOnce();
    expect(store.getState().moveCount).toBe(5);
    expect(store.getState().board).toEqual([1, 2, 3]); // untouched fields kept
  });

  it('unsubscribe stops notifications', () => {
    const store = createGameStore(initial());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setState({ moveCount: 1 });
    unsubscribe();
    store.setState({ moveCount: 2 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('createInitialCoreState starts at role selection with a clean turn', () => {
    expect(initial()).toMatchObject({
      phase: 'roleSelection',
      mode: 'vsComputer',
      currentPlayer: null,
      turnState: null,
      moveCount: 0,
      winnerIndex: null,
      undoSnapshot: null,
      currentTurnHasMoves: false
    });
  });
});
