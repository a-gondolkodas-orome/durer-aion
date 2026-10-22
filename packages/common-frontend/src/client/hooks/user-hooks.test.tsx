// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { setTeamState, useTeamStateValue } from './team-state-store';
import { LoadTeamState, useLogin, useLogout } from './user-hooks';
import { loginMarkerStorageKey } from '../utils/storage-keys';

// The session lives in the repository, so each test starts a fresh one.
let repo: MockClientRepository;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClientRepoProvider value={repo}>{children}</ClientRepoProvider>
);

beforeEach(() => {
  localStorage.clear();
  repo = new MockClientRepository();
});

// The store is module state — see the note atop team-state-store.ts.
afterEach(() => {
  act(() => setTeamState(null));
});

// The console is where a browser shows anything a page cares to say, and the
// login carried the join code, the team's e-mail and its credentials into it on
// every log-in — printed for anyone looking over a team's shoulder. The setup
// file turns any console write during a test into a failure, so this test fails
// on the logs alone; the assertions are here for the behaviour they surrounded.
test('logging in loads the team without narrating it to the console', async () => {
  const { result } = renderHook(
    () => ({ login: useLogin(), team: useTeamStateValue() }),
    { wrapper },
  );

  // The mock repository answers join code "2" with a team mid-relay.
  await act(() => result.current.login('2'));

  expect(result.current.team).toMatchObject({ pageState: 'RELAY' });
});

// The server ending the session is what logs the team out. If that fails the
// cookie is still alive, and a login form shown over it would only log the
// team back in on the next reload — so the team stays, and the caller hears.
test('a logout the server refused leaves the team logged in', async () => {
  vi.spyOn(repo, 'logout').mockRejectedValue(new Error('offline'));
  const { result } = renderHook(
    () => ({ login: useLogin(), logout: useLogout(), team: useTeamStateValue() }),
    { wrapper },
  );
  await act(() => result.current.login('2'));

  await expect(act(() => result.current.logout())).rejects.toThrow('offline');

  expect(result.current.team).toMatchObject({ pageState: 'RELAY' });
});

// A login in another tab reaches this one as a storage event. The listener was
// once registered for the first repository only and never removed, so a
// provider handing over a new repository left the old one answering.
test('a new repository takes over the cross-tab login listener', async () => {
  const first = repo;
  const second = new MockClientRepository();
  const firstCalls = vi.spyOn(first, 'getTeamState');
  const secondCalls = vi.spyOn(second, 'getTeamState');
  const Tree = ({ value }: { value: MockClientRepository }) => (
    <ClientRepoProvider value={value}><LoadTeamState /></ClientRepoProvider>
  );
  const { rerender } = render(<Tree value={first} />);
  rerender(<Tree value={second} />);
  // Each mount loads the team once; only the event below is under test.
  await act(() => Promise.resolve());
  firstCalls.mockClear();
  secondCalls.mockClear();

  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key: loginMarkerStorageKey() }));
  });

  expect(firstCalls).not.toHaveBeenCalled();
  expect(secondCalls).toHaveBeenCalledOnce();
});
