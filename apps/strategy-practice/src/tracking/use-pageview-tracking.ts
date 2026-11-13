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

The url is prefixed with the site's base path (`/jatekok` when deployed), since
the home page and `/valto/` report to the same umami website and the app's own
`/` would otherwise be indistinguishable from theirs.

The umami script is loaded with `async`, so the app does not wait for it, and
window.umami may not exist yet; the pageview then waits for the script's load
event. It stays undefined (or track() no-ops) with Do-Not-Track or off the
production domain, which is left untracked.
*/
export const usePageviewTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const url = import.meta.env.BASE_URL.replace(/\/$/, '') + location.pathname + location.search;
    if (window.umami) {
      trackPageview(url);
      return;
    }
    // With no tracker tag, or one that never loads (blocked), nothing is sent.
    const script = document.querySelector('script[src*="umami"]');
    const onLoad = () => trackPageview(url);
    script?.addEventListener('load', onLoad, { once: true });
    return () => script?.removeEventListener('load', onLoad);
  }, [location.pathname, location.search]);
};
