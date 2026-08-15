import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageview } from './umami';

/*
Send a pageview manually on every route change — including the initial mount, so
a direct visit to a game page (e.g. a shared #/game/ChessRook link) is tracked
too. react-router's useLocation reflects the path inside the hash. Umami's
automatic tracking is disabled (data-auto-track="false" in index.html) because
it only sees location.pathname (always "/") and ignores hash navigations, so
every visit would otherwise be recorded as the root page.

The umami script is loaded with `defer`, so window.umami may not exist on the
first render; retry briefly until it appears. It stays undefined (or track()
no-ops) with Do-Not-Track or off the production domain, which is left untracked.
*/
export const usePageviewTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const url = location.pathname + location.search;
    let cancelled = false;
    let attempts = 0;
    const send = () => {
      if (cancelled) return;
      if (window.umami) {
        trackPageview(url);
      } else if (attempts++ < 20) {
        setTimeout(send, 100);
      }
    };
    send();
    return () => { cancelled = true; };
  }, [location.pathname, location.search]);
};
