/*
Custom events for the umami tracker loaded (deferred) in index.html; pageviews it
sends by itself. A no-op when `window.umami` is absent — off gyakorlo.durerinfo.hu
or before the script has loaded — and the tracker drops the call itself under Do
Not Track.
*/

import { findPracticeSet } from './practice-sets';

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void };
  }
}

// Both name a past round by its parts rather than by its competition id, so
// umami can break the events down by year, round type and category
// separately; another set goes by its id. The year goes as a string: it is a
// label to group by, never a quantity, and umami shows a number with four
// decimals (`12.0000`).
const relayRound = (id: string) => {
  const metadata = findPracticeSet(id)?.metadata;
  if (metadata?.kind !== 'competition') return { set: id };
  return { year: String(metadata.edition), round: metadata.round, category: metadata.category };
};

export const trackRelayStarted = (id: string) => {
  window.umami?.track('relay-started', relayRound(id));
};

// Only a round that reached its end — the last problem answered or the time up.
// Giving up mid-round sends nothing, so started minus finished is the runs abandoned.
export const trackRelayFinished = (id: string, points: number) => {
  window.umami?.track('relay-finished', { ...relayRound(id), points });
};
