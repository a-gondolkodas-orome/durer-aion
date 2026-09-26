// @vitest-environment jsdom
import React from 'react';
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
  act(() => { vi.advanceTimersByTime(2000); });
  expect(getServerTimer).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(2000); });
  expect(getServerTimer).toHaveBeenCalled();
  expect(screen.getByText('00:00:01')).toBeInTheDocument();
});
