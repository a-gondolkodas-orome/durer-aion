// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { LATE_ANSWER_GRACE_MS } from 'game';
import { useEndOnTime } from './end-on-time';

// #613: a relay left to run out was never ended, so its end report, and with
// it the local apps' score, never came. The game ends it on the first move
// past the grace for late answers; this hook is what sends that move.

const NOW = new Date('2026-03-21T11:00:00Z').getTime();
const END = new Date(NOW + 60 * 1000).toISOString();
const PAST_GRACE = 60 * 1000 + LATE_ANSWER_GRACE_MS + 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

test('polls once the time and its grace are up, not before, and only once', () => {
  const poll = vi.fn();
  renderHook(() => { useEndOnTime(END, true, poll); });

  vi.advanceTimersByTime(PAST_GRACE - 1);
  expect(poll).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(poll).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(60 * 1000);
  expect(poll).toHaveBeenCalledOnce();
});

test('polls through the latest callback, not the one it started with', () => {
  const first = vi.fn();
  const latest = vi.fn();
  const { rerender } = renderHook(({ poll }) => { useEndOnTime(END, true, poll); }, {
    initialProps: { poll: first },
  });

  rerender({ poll: latest });
  vi.advanceTimersByTime(PAST_GRACE);
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledOnce();
});

// The board is reloaded after the buzzer as often as before it.
test('polls at once for a match whose grace was already over when it loaded', () => {
  const poll = vi.fn();
  vi.setSystemTime(NOW + PAST_GRACE + 60 * 1000);
  renderHook(() => { useEndOnTime(END, true, poll); });

  vi.advanceTimersByTime(0);
  expect(poll).toHaveBeenCalledOnce();
});

// An organiser's extension moves the end.
test('waits for the new end once the match is extended', () => {
  const poll = vi.fn();
  const extended = new Date(NOW + 10 * 60 * 1000).toISOString();
  const { rerender } = renderHook(({ end }) => { useEndOnTime(end, true, poll); }, {
    initialProps: { end: END },
  });

  rerender({ end: extended });
  vi.advanceTimersByTime(PAST_GRACE);
  expect(poll).not.toHaveBeenCalled();
});

test('sends nothing while inactive: online, or once the game has ended', () => {
  const poll = vi.fn();
  renderHook(() => { useEndOnTime(END, false, poll); });

  vi.advanceTimersByTime(PAST_GRACE + 60 * 1000);
  expect(poll).not.toHaveBeenCalled();
});
