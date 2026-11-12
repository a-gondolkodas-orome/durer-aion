// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { nextBoundary, useStartWindowState } from './start-window';

const startWindow = { opensAt: '2026-10-20T15:00:00+02:00', closesAt: '2026-10-20T21:30:00+02:00' };

afterEach(() => {
  vi.useRealTimers();
});

describe('nextBoundary', () => {
  it('is the opening, then the closing, then none', () => {
    expect(nextBoundary(startWindow, new Date('2026-10-20T12:00:00Z'))).toBe(Date.parse(startWindow.opensAt));
    expect(nextBoundary(startWindow, new Date('2026-10-20T14:00:00Z'))).toBe(Date.parse(startWindow.closesAt));
    expect(nextBoundary(startWindow, new Date('2026-10-20T20:00:00Z'))).toBeUndefined();
  });
});

describe('useStartWindowState', () => {
  it('is open without a window', () => {
    expect(renderHook(() => useStartWindowState(null)).result.current).toBe('open');
  });

  // A team waiting on the home screen sees the button come alive at the start.
  it('changes as the window opens and closes, without a reload', () => {
    vi.useFakeTimers({ now: new Date('2026-10-20T12:59:00Z') });
    const { result } = renderHook(() => useStartWindowState(startWindow));
    expect(result.current).toBe('not-open-yet');

    act(() => { vi.advanceTimersByTime(60_000); });
    expect(result.current).toBe('open');

    act(() => { vi.advanceTimersByTime(6.5 * 3600_000); });
    expect(result.current).toBe('closed');
  });
});
