// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Countdown, useMsRemaining } from './Countdown';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const HOUR = 3600 * 1000;
const START = new Date('2026-11-14T15:00:00Z');

// A board as boardWrapper and InProgressRelay hold it: the server's figure
// feeds useMsRemaining, and Countdown counts it down in between.
function Board(props: { end: number, serverMs: number, getServerTimer?: () => void }) {
  const [msRemaining, setMsRemaining] = useMsRemaining(props.serverMs);
  return <Countdown
    msRemaining={msRemaining}
    setMsRemaining={setMsRemaining}
    getServerTimer={props.getServerTimer ?? (() => undefined)}
    endTime={new Date(props.end)}
    serverRemainingMs={props.serverMs}
  />;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

// One act per second: act holds renders back until it ends, and each tick reads
// the count the previous one rendered, as it does in a browser.
function advanceSeconds(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
}

test('shows the remaining time from the first render', () => {
  render(<Board end={START.getTime() + 2 * HOUR} serverMs={2 * HOUR} />);
  expect(screen.getByText('02:00:00')).toBeInTheDocument();
});

test('counts down once a second', () => {
  render(<Board end={START.getTime() + 2 * HOUR} serverMs={2 * HOUR} />);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(screen.getByText('01:59:59')).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(60 * 1000); });
  expect(screen.getByText('01:58:59')).toBeInTheDocument();
});

test('a new reading from the server replaces the local count', () => {
  const { rerender } = render(<Board end={START.getTime() + 2 * HOUR} serverMs={2 * HOUR} />);
  act(() => { vi.advanceTimersByTime(5000); });
  expect(screen.getByText('01:59:55')).toBeInTheDocument();
  // Ten minutes added by an admin, as the server reports it.
  rerender(<Board end={START.getTime() + 2 * HOUR + 10 * 60 * 1000} serverMs={2 * HOUR + 10 * 60 * 1000 - 5000} />);
  expect(screen.getByText('02:09:55')).toBeInTheDocument();
});

test('near zero, holds the count and asks the server', () => {
  const getServerTimer = vi.fn();
  render(<Board end={START.getTime() + 3000} serverMs={3000} getServerTimer={getServerTimer} />);
  advanceSeconds(2);
  expect(getServerTimer).not.toHaveBeenCalled();
  advanceSeconds(2);
  expect(getServerTimer).toHaveBeenCalled();
  expect(screen.getByText('00:00:01')).toBeInTheDocument();
});

// InProgressRelay passes a fresh getServerTimer each render, and only the
// latest knows whether the judge has the turn (#628).
test('near zero, asks the server through the latest callback', () => {
  const first = vi.fn();
  const latest = vi.fn();
  const { rerender } = render(<Board end={START.getTime() + 3000} serverMs={3000} getServerTimer={first} />);
  rerender(<Board end={START.getTime() + 3000} serverMs={3000} getServerTimer={latest} />);
  advanceSeconds(4);
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalled();
});

// StrictMode runs a state updater twice, so a sync request made from inside one
// went out twice per tick.
test('near zero, asks the server once per tick under StrictMode', () => {
  const getServerTimer = vi.fn();
  render(<StrictMode>
    <Board end={START.getTime() + 3000} serverMs={3000} getServerTimer={getServerTimer} />
  </StrictMode>);
  advanceSeconds(3);
  expect(getServerTimer).toHaveBeenCalledOnce();
  advanceSeconds(1);
  expect(getServerTimer).toHaveBeenCalledTimes(2);
});

// Regression: from 5 to 10 s past the end the time was formatted as a negative
// number, "-1:-1:-7".
test.each([0, -1000, -7000, -9999])('shows zero at %i ms, inside the grace for late answers', (serverMs) => {
  render(<Board end={START.getTime() + serverMs} serverMs={serverMs} />);
  expect(screen.getByText('00:00:00')).toBeInTheDocument();
});

test('shows that the time is over once the grace is', () => {
  render(<Board end={START.getTime() - 10000} serverMs={-10000} />);
  expect(screen.getByText('XX:XX:XX')).toBeInTheDocument();
});
