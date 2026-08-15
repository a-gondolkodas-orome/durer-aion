// @vitest-environment jsdom
import { render, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import { usePageviewTracking } from './use-pageview-tracking';

const TrackingProbe = () => {
  usePageviewTracking();
  return null;
};

// trackPageview calls umami.track with a callback that receives the default
// payload and returns it with `url` overridden; invoke it to read the url.
const urlOf = (track: ReturnType<typeof vi.fn>) => {
  const callback = track.mock.calls.at(-1)![0] as (p: object) => { url: string };
  return callback({}).url;
};

describe('usePageviewTracking', () => {
  let track: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    track = vi.fn();
    window.umami = { track: track as NonNullable<Window['umami']>['track'] };
  });

  afterEach(() => {
    delete window.umami;
    vi.useRealTimers();
  });

  it('tracks the current page on initial mount, incl. a direct game visit', () => {
    render(
      <MemoryRouter initialEntries={['/game/ChessRook']}>
        <TrackingProbe />
      </MemoryRouter>
    );
    expect(track).toHaveBeenCalledTimes(1);
    expect(urlOf(track)).toBe('/game/ChessRook');
  });

  it('tracks again on route change', () => {
    const Nav = () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/game/TicTacToe')}>go</button>;
    };
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <TrackingProbe />
        <Nav />
      </MemoryRouter>
    );
    expect(urlOf(track)).toBe('/');
    act(() => { getByText('go').click(); });
    expect(track).toHaveBeenCalledTimes(2);
    expect(urlOf(track)).toBe('/game/TicTacToe');
  });

  it('retries while the deferred umami script is not ready yet', () => {
    vi.useFakeTimers();
    delete window.umami;
    render(
      <MemoryRouter initialEntries={['/game/Bacteria']}>
        <TrackingProbe />
      </MemoryRouter>
    );
    expect(track).not.toHaveBeenCalled();
    window.umami = { track: track as NonNullable<Window['umami']>['track'] };
    act(() => { vi.advanceTimersByTime(100); });
    expect(track).toHaveBeenCalledTimes(1);
    expect(urlOf(track)).toBe('/game/Bacteria');
  });
});
