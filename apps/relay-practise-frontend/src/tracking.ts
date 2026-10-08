/*
Custom events for the umami tracker loaded (deferred) in index.html; pageviews it
sends by itself. A no-op when `window.umami` is absent — off gyakorlo.durerinfo.hu
or before the script has loaded — and the tracker drops the call itself under Do
Not Track.
*/

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void };
  }
}

// `round` is the test's code, e.g. `12_D_C+` (relayTestCode), which this app stores
// as the team name.
export const trackRelayStarted = (round: string) => {
  window.umami?.track('relay-started', { round });
};

// Only a round that reached its end — the last problem answered or the time up.
// Giving up mid-round sends nothing, so started minus finished is the runs abandoned.
export const trackRelayFinished = (round: string, points: number) => {
  window.umami?.track('relay-finished', { round, points });
};
