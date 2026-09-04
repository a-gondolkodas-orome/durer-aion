// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ClientRepoProvider, MockClientRepository } from '../api-repository-interface';
import { setTeamState, useTeamStateValue } from './team-state-store';
import { useLogin } from './user-hooks';

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
