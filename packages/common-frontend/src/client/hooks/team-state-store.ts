import { useSyncExternalStore } from 'react';
import { TeamModelDto } from '../dto/TeamStateDto';

// The whole of what Recoil was used for: one piece of state, the logged-in
// team, read and written from a handful of hooks. Recoil reached into React's
// `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`, which React 19 removed,
// and it has been unmaintained since 2023 — so an atom's worth of dependency
// blocked the whole monorepo's React upgrade. `useSyncExternalStore` is the
// API React provides for exactly this and needs no library.
//
// One deliberate difference: Recoil scoped state to a `RecoilRoot`, and this is
// module-level. Both apps mounted a single root at the top of the tree, so the
// observable behaviour is the same — but a test that wants a clean slate has to
// call `setTeamState(null)`, or `forgetTeamState()` for a page still loading,
// rather than re-mount a provider.

// `undefined` until the first answer: "not known yet" and "logged out" must not
// look the same, or every reload shows a logged-in team the login form until
// `team/me` answers (#777).
let teamState: TeamModelDto | null | undefined = undefined;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Returned by reference, not rebuilt: `useSyncExternalStore` re-renders whenever
// the snapshot is not `Object.is`-equal to the last one, so a fresh object here
// would loop forever.
const getSnapshot = () => teamState;

/// The current value outside React, for a handler comparing it with a fresh one.
export const currentTeamState = getSnapshot;

const write = (next: TeamModelDto | null | undefined) => {
  if (Object.is(next, teamState)) return;
  teamState = next;
  for (const listener of listeners) listener();
};

// Takes no `undefined`: once the team is known, a later answer may change it,
// but never makes it unknown again.
export const setTeamState = (next: TeamModelDto | null) => write(next);

/// Back to "not known yet", as on a fresh page load. For tests.
export const forgetTeamState = () => write(undefined);

export const useTeamStateValue = (): TeamModelDto | null | undefined =>
  // Third argument is the server snapshot; the store is plain module state, so
  // it is the same function.
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
