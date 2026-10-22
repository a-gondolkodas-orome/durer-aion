// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { LATE_ANSWER_GRACE_MS } from 'game';
import { END_POLL_RETRY_MS, useEndOnTime } from './end-on-time';

// #613: a relay left to run out was never ended, so its end report, and with
// it the offline apps' score, never came. The game ends it on the first move
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

test('polls once the time and its grace are up, not before', () => {
  const poll = vi.fn();
  renderHook(() => { useEndOnTime(END, undefined, poll); });

  vi.advanceTimersByTime(PAST_GRACE - 1);
  expect(poll).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(poll).toHaveBeenCalledOnce();
});

test('polls again until the game reports its end, then stops', () => {
  const poll = vi.fn();
  const { rerender } = renderHook(({ gameover }) => { useEndOnTime(END, gameover, poll); }, {
    initialProps: { gameover: undefined as unknown },
  });

  vi.advanceTimersByTime(PAST_GRACE + END_POLL_RETRY_MS);
  expect(poll).toHaveBeenCalledTimes(2);

  rerender({ gameover: true });
  vi.advanceTimersByTime(10 * END_POLL_RETRY_MS);
  expect(poll).toHaveBeenCalledTimes(2);
});

// The board is reloaded after the buzzer as often as before it.
test('polls at once for a match whose grace was already over when it loaded', () => {
  const poll = vi.fn();
  vi.setSystemTime(NOW + PAST_GRACE + 60 * 1000);
  renderHook(() => { useEndOnTime(END, undefined, poll); });

  vi.advanceTimersByTime(0);
  expect(poll).toHaveBeenCalledOnce();
});

// An organiser's extension moves the end.
test('waits for the new end once the match is extended', () => {
  const poll = vi.fn();
  const extended = new Date(NOW + 10 * 60 * 1000).toISOString();
  const { rerender } = renderHook(({ end }) => { useEndOnTime(end, undefined, poll); }, {
    initialProps: { end: END },
  });

  rerender({ end: extended });
  vi.advanceTimersByTime(PAST_GRACE);
  expect(poll).not.toHaveBeenCalled();
});

test('sends nothing for a match that has already ended', () => {
  const poll = vi.fn();
  renderHook(() => { useEndOnTime(END, true, poll); });

  vi.advanceTimersByTime(PAST_GRACE + 10 * END_POLL_RETRY_MS);
  expect(poll).not.toHaveBeenCalled();
});
