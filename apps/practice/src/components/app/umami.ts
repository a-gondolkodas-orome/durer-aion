/*
Thin wrappers around the self-hosted umami tracker loaded (deferred) in
index.html. Every call is a no-op when `window.umami` is absent — which happens
when the script has not loaded yet, the visitor has Do-Not-Track enabled, or the
page is not served from the production domain (see data-domains in index.html).
*/

declare global {
  interface Window {
    umami?: { track: (...args: unknown[]) => void };
  }
}

/*
Send a pageview for an explicit url. Umami's automatic pageview tracking is
disabled in index.html because the app uses a hash router (see
use-pageview-tracking) — the hash never reaches umami's default url.
*/
export const trackPageview = (url: string) => {
  window.umami?.track(props => ({ ...(props as object), url }));
};

/*
Track a custom event, e.g. a finished game.
*/
export const trackEvent = (name: string, data?: Record<string, unknown>) => {
  window.umami?.track(name, data);
};
