// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useGameStats } from './use-game-stats';

const KEY = 'stats_tictactoe_0';

const render = (gameId = 'tictactoe', variantIndex = 0) =>
  renderHook(({ id, index }) => useGameStats(id, index), {
    initialProps: { id: gameId, index: variantIndex }
  });

beforeEach(() => localStorage.clear());

describe('useGameStats', () => {
  it('starts at zero when nothing has been stored yet', () => {
    const { result } = render();
    expect(result.current.stats).toEqual({ win: 0, loss: 0 });
  });

  it('reads back what an earlier session stored under the same key', () => {
    localStorage.setItem(KEY, JSON.stringify({ win: 3, loss: 2 }));
    expect(render().result.current.stats).toEqual({ win: 3, loss: 2 });
  });

  it('counts a win and a loss, persisting each', () => {
    const { result } = render();

    act(() => result.current.recordResult('win'));
    act(() => result.current.recordResult('win'));
    act(() => result.current.recordResult('loss'));

    expect(result.current.stats).toEqual({ win: 2, loss: 1 });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ win: 2, loss: 1 });
  });

  it('clears both the counters and the stored value on reset', () => {
    localStorage.setItem(KEY, JSON.stringify({ win: 4, loss: 1 }));
    const { result } = render();

    act(() => result.current.resetStats());

    expect(result.current.stats).toEqual({ win: 0, loss: 0 });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  // The counters are per game *and* per variant, so switching difficulty has
  // to swap to that variant's tally rather than carry the old one over.
  it('swaps to the other tally when the variant changes, and keeps them apart', () => {
    localStorage.setItem('stats_tictactoe_0', JSON.stringify({ win: 5, loss: 0 }));
    localStorage.setItem('stats_tictactoe_1', JSON.stringify({ win: 1, loss: 9 }));

    const { result, rerender } = render();
    expect(result.current.stats).toEqual({ win: 5, loss: 0 });

    rerender({ id: 'tictactoe', index: 1 });
    expect(result.current.stats).toEqual({ win: 1, loss: 9 });

    act(() => result.current.recordResult('win'));
    expect(JSON.parse(localStorage.getItem('stats_tictactoe_1')!)).toEqual({ win: 2, loss: 9 });
    // the other variant's tally is untouched
    expect(JSON.parse(localStorage.getItem('stats_tictactoe_0')!)).toEqual({ win: 5, loss: 0 });
  });

  it('swaps tallies when the game changes too', () => {
    localStorage.setItem('stats_chess-ducks_0', JSON.stringify({ win: 7, loss: 7 }));

    const { result, rerender } = render();
    rerender({ id: 'chess-ducks', index: 0 });

    expect(result.current.stats).toEqual({ win: 7, loss: 7 });
  });

  // localStorage is shared with everything else on the origin and survives
  // deploys, so a value that is not the shape this hook expects has to read as
  // "no stats yet" rather than take the counter display down with it.
  it.each([
    ['unparseable JSON', 'not json at all'],
    ['the literal null', 'null']
  ])('falls back to zero on %s', (_name, stored) => {
    localStorage.setItem(KEY, stored);

    const { result } = render();

    expect(result.current.stats).toEqual({ win: 0, loss: 0 });
    // and recovers: the next result writes a clean value back
    act(() => result.current.recordResult('win'));
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ win: 1, loss: 0 });
  });
});
