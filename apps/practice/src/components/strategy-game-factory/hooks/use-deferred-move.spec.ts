// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useDeferredMove } from './use-deferred-move';

// stepDelay() spreads the beat over 750-1250ms so the bot does not answer like
// a metronome; pinning Math.random makes the timing here exact.
const BEAT = 750;

const render = (moveCount = 0) =>
  renderHook(({ count }) => useDeferredMove(count), { initialProps: { count: moveCount } });

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => vi.useRealTimers());

describe('useDeferredMove', () => {
  it('plays the second move a beat later, not straight away', () => {
    const playSecondMove = vi.fn();
    const { result, rerender } = render(0);

    act(() => result.current(playSecondMove));
    expect(playSecondMove).not.toHaveBeenCalled();

    // the first move of the turn has landed by now
    rerender({ count: 1 });
    act(() => vi.advanceTimersByTime(BEAT));
    expect(playSecondMove).toHaveBeenCalledOnce();
  });

  // The callback closes over the board the first move produced. A restart or a
  // variant switch rewinds the count, so that board is gone and the move with
  // it — this is the leak the hook exists to close.
  it('drops a pending move when the game restarts inside the beat', () => {
    const playSecondMove = vi.fn();
    const { result, rerender } = render(4);

    act(() => result.current(playSecondMove));
    rerender({ count: 0 });
    act(() => vi.advanceTimersByTime(BEAT * 2));

    expect(playSecondMove).not.toHaveBeenCalled();
  });

  it('drops a pending move on undo, which rewinds the count too', () => {
    const playSecondMove = vi.fn();
    const { result, rerender } = render(6);

    act(() => result.current(playSecondMove));
    rerender({ count: 5 });
    act(() => vi.advanceTimersByTime(BEAT * 2));

    expect(playSecondMove).not.toHaveBeenCalled();
  });

  // The opening turn schedules at count 0, so the restart it has to survive
  // returns to the count it was scheduled at. The first move lands in between,
  // which is what makes the return visible as a rewind.
  it('drops a pending move scheduled on the opening turn', () => {
    const playSecondMove = vi.fn();
    const { result, rerender } = render(0);

    act(() => result.current(playSecondMove));
    rerender({ count: 1 });
    rerender({ count: 0 });
    act(() => vi.advanceTimersByTime(BEAT * 2));

    expect(playSecondMove).not.toHaveBeenCalled();
  });

  it('drops a pending move when the player navigates away', () => {
    const playSecondMove = vi.fn();
    const { result, unmount } = render(2);

    act(() => result.current(playSecondMove));
    unmount();
    act(() => vi.advanceTimersByTime(BEAT * 2));

    expect(playSecondMove).not.toHaveBeenCalled();
  });

  it('keeps only the latest pending move if one is scheduled twice', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = render(0);

    act(() => result.current(first));
    act(() => result.current(second));
    rerender({ count: 1 });
    act(() => vi.advanceTimersByTime(BEAT));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('can schedule again once a move has played', () => {
    const playSecondMove = vi.fn();
    const { result, rerender } = render(0);

    act(() => result.current(playSecondMove));
    rerender({ count: 1 });
    act(() => vi.advanceTimersByTime(BEAT));

    act(() => result.current(playSecondMove));
    rerender({ count: 3 });
    act(() => vi.advanceTimersByTime(BEAT));

    expect(playSecondMove).toHaveBeenCalledTimes(2);
  });
});
