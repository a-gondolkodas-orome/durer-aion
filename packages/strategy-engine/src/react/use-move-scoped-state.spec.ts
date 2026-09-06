// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useMoveScopedState } from './use-move-scoped-state';

const render = <T,>(initial: T, moveCount = 0) =>
  renderHook(
    ({ count }) => useMoveScopedState<T>(count, initial),
    { initialProps: { count: moveCount } }
  );

describe('useMoveScopedState', () => {
  it('starts at the initial value', () => {
    const { result } = render<number | null>(null);
    expect(result.current[0]).toBeNull();
  });

  it('holds a value set during the same move', () => {
    const { result } = render<number | null>(null, 3);

    act(() => result.current[1](7));

    expect(result.current[0]).toBe(7);
  });

  // The whole point: no effect runs, so there is no render in which the old
  // value is visible against the new board.
  it('drops the value as soon as the move count advances', () => {
    const { result, rerender } = render<number | null>(null, 3);

    act(() => result.current[1](7));
    rerender({ count: 4 });

    expect(result.current[0]).toBeNull();
  });

  it('can be set again under the new move count', () => {
    const { result, rerender } = render<number | null>(null, 3);

    act(() => result.current[1](7));
    rerender({ count: 4 });
    act(() => result.current[1](9));

    expect(result.current[0]).toBe(9);
  });

  it('resets on demand, for a deselect that is not a move', () => {
    const { result } = render<number | null>(null, 2);

    act(() => result.current[1](5));
    act(() => result.current[2]());

    expect(result.current[0]).toBeNull();
  });

  describe('the updater form', () => {
    it('sees the current value, so a toggle works', () => {
      const { result } = render<number | null>(null, 1);

      act(() => result.current[1](5));
      act(() => result.current[1](prev => (prev === 5 ? null : 5)));

      expect(result.current[0]).toBeNull();
    });

    // Reading the raw state instead of reading it through the stamp would hand
    // the updater the value the move just invalidated — a toggle on the same
    // cell would then deselect instead of selecting.
    it('sees the initial value after a move, not the invalidated one', () => {
      const { result, rerender } = render<number | null>(null, 1);

      act(() => result.current[1](5));
      rerender({ count: 2 }); // the move that invalidates it
      act(() => result.current[1](prev => (prev === 5 ? null : 5)));

      expect(result.current[0]).toBe(5);
    });

    it('composes two updates dispatched in one handler', () => {
      const { result } = render(0, 1);

      act(() => {
        result.current[1](prev => prev + 1);
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });
  });

  // A stale render returns `initial` itself rather than a copy, so a caller
  // that hoists it to module scope keeps a stable reference across moves.
  it('returns the same initial reference on every stale render', () => {
    const initial = [0, 0, 0, 0];
    const { result, rerender } = renderHook(
      ({ count }) => useMoveScopedState(count, initial),
      { initialProps: { count: 1 } }
    );

    act(() => result.current[1]([1, 0, 0, 0]));
    rerender({ count: 2 });
    const afterOneMove = result.current[0];
    rerender({ count: 3 });

    expect(afterOneMove).toBe(initial);
    expect(result.current[0]).toBe(initial);
  });
});
