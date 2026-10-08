/*
Custom events for the umami tracker loaded (deferred) in index.html; pageviews it
sends by itself. A no-op when `window.umami` is absent — off gyakorlo.durerinfo.hu
or before the script has loaded — and the tracker drops the call itself under Do
Not Track.
*/

import { parseRelayTestCode } from './SelectRound';

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void };
  }
}

// Both name the round by its parts rather than by the test's code (`12_D_C+`), so
// umami can break the events down by year, round type and category separately.
export const trackRelayStarted = (code: string) => {
  window.umami?.track('relay-started', parseRelayTestCode(code));
};

// Only a round that reached its end — the last problem answered or the time up.
// Giving up mid-round sends nothing, so started minus finished is the runs abandoned.
export const trackRelayFinished = (code: string, points: number) => {
  window.umami?.track('relay-finished', { ...parseRelayTestCode(code), points });
};
