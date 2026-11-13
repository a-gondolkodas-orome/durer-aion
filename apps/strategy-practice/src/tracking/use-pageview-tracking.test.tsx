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
    vi.unstubAllEnvs();
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
      return <button onClick={() => void navigate('/game/TicTacToe')}>go</button>;
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

  it('prefixes the url with the base path the site is deployed under', () => {
    vi.stubEnv('BASE_URL', '/jatekok/');
    render(
      <MemoryRouter initialEntries={['/game/ChessRook']}>
        <TrackingProbe />
      </MemoryRouter>
    );
    expect(urlOf(track)).toBe('/jatekok/game/ChessRook');
  });

  it('reports the game list under the base path itself', () => {
    vi.stubEnv('BASE_URL', '/jatekok/');
    render(
      <MemoryRouter initialEntries={['/']}>
        <TrackingProbe />
      </MemoryRouter>
    );
    expect(urlOf(track)).toBe('/jatekok/');
  });

  describe('before the async umami script has loaded', () => {
    let script: HTMLScriptElement;

    beforeEach(() => {
      delete window.umami;
      script = document.createElement('script');
      script.setAttribute('src', 'https://umami.durerinfo.hu/script.js');
      document.head.append(script);
    });

    afterEach(() => {
      script.remove();
    });

    const load = () => {
      window.umami = { track: track as NonNullable<Window['umami']>['track'] };
      act(() => { script.dispatchEvent(new Event('load')); });
    };

    // However long it takes: a slow tracker must not lose the first pageview.
    it('sends the pageview once the script loads', () => {
      render(
        <MemoryRouter initialEntries={['/game/Bacteria']}>
          <TrackingProbe />
        </MemoryRouter>
      );
      expect(track).not.toHaveBeenCalled();
      load();
      expect(track).toHaveBeenCalledTimes(1);
      expect(urlOf(track)).toBe('/game/Bacteria');
    });

    it('sends only the page the visitor is on by then', () => {
      const Nav = () => {
        const navigate = useNavigate();
        return <button onClick={() => void navigate('/game/TicTacToe')}>go</button>;
      };
      const { getByText } = render(
        <MemoryRouter initialEntries={['/']}>
          <TrackingProbe />
          <Nav />
        </MemoryRouter>
      );
      act(() => { getByText('go').click(); });
      load();
      expect(track).toHaveBeenCalledTimes(1);
      expect(urlOf(track)).toBe('/game/TicTacToe');
    });
  });
});
