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
// call `setTeamState(null)` rather than re-mount a provider.

let teamState: TeamModelDto | null = null;
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

export const setTeamState = (next: TeamModelDto | null) => {
  if (Object.is(next, teamState)) return;
  teamState = next;
  for (const listener of listeners) listener();
};

export const useTeamStateValue = (): TeamModelDto | null =>
  // Third argument is the server snapshot; the store is plain module state, so
  // it is the same function.
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
