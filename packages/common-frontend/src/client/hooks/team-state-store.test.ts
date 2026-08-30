// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { setTeamState, useTeamStateValue } from './team-state-store';
import { TeamModelDto } from '../dto/TeamStateDto';

// Module state rather than per-provider state — see the note atop
// team-state-store.ts. Every test starts from the logged-out snapshot. This
// hook runs before Testing Library's own cleanup, so the components the test
// rendered are still mounted and the reset re-renders them: `act` for the same
// reason the writes below need it.
afterEach(() => {
  act(() => setTeamState(null));
});

const team = (id: string) => ({ id } as unknown as TeamModelDto);

// The store is written from plain callbacks, not from an event handler React
// knows about, so every write goes through `act` for the re-render it schedules
// to be flushed before the assertion.
const set = (next: TeamModelDto | null) => act(() => setTeamState(next));

test('a subscribed component sees the new team', () => {
  const { result } = renderHook(() => useTeamStateValue());
  expect(result.current).toBeNull();

  set(team('a'));

  expect(result.current).toEqual(team('a'));
});

// The guard that matters for useSyncExternalStore: an unchanged snapshot must
// not re-render, or a store that rebuilt its value would loop forever.
test('setting the same value again does not re-render', () => {
  const renders = vi.fn();
  const same = team('a');
  renderHook(() => {
    renders();
    return useTeamStateValue();
  });

  set(same);
  const rendersAfterChange = renders.mock.calls.length;
  // The change above must have caused one, or the comparison below is vacuous.
  expect(rendersAfterChange).toBeGreaterThan(1);

  set(same);

  expect(renders.mock.calls.length).toBe(rendersAfterChange);
});

test('an unmounted component stops being notified', () => {
  const renders = vi.fn();
  const { unmount } = renderHook(() => {
    renders();
    return useTeamStateValue();
  });

  unmount();
  const rendersAtUnmount = renders.mock.calls.length;
  set(team('b'));

  expect(renders.mock.calls.length).toBe(rendersAtUnmount);
});

test('logging out clears the team', () => {
  const { result } = renderHook(() => useTeamStateValue());
  set(team('a'));

  set(null);

  expect(result.current).toBeNull();
});
