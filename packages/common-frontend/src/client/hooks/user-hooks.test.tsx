// @vitest-environment jsdom
import React from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { setTeamState, useTeamStateValue } from './team-state-store';
import { LoadTeamState, useBackToHome, useLogin, useLogout, useStartRelay, useToHome } from './user-hooks';
import { loginMarkerStorageKey } from '../utils/storage-keys';
import type { TeamModelDto } from '../dto/TeamStateDto';
// The snackbar's text comes from the i18next instance the apps initialise here.
import '../../common/i18n';

// A snackbar is the one way these hooks speak to the team.
const enqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }));

// The session lives in the repository, so each test starts a fresh one.
let repo: MockClientRepository;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClientRepoProvider value={repo}>{children}</ClientRepoProvider>
);

beforeEach(() => {
  localStorage.clear();
  enqueueSnackbar.mockClear();
  repo = new MockClientRepository();
});

// The store is module state — see the note atop team-state-store.ts.
afterEach(() => {
  act(() => setTeamState(null));
  vi.unstubAllGlobals();
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

// Regression (#112): leaving a finished match reloaded the page, which flashed
// white and fetched the whole app again.
test('going back home from a match shows home without reloading the page', async () => {
  const { result } = renderHook(
    () => ({ login: useLogin(), backToHome: useBackToHome(), team: useTeamStateValue() }),
    { wrapper },
  );
  await act(() => result.current.login('2'));
  // jsdom's own `location` cannot be spied on, only replaced.
  const reload = vi.fn();
  vi.stubGlobal('location', { ...window.location, reload });
  const toHome = vi.spyOn(repo, 'toHome');
  // The mock's team stays mid-relay; the server would answer home by now.
  const home = { ...await repo.getTeamState(), pageState: 'HOME' } as TeamModelDto;
  vi.spyOn(repo, 'getTeamState').mockResolvedValue(home);

  await act(async () => {
    result.current.backToHome();
  });

  expect(toHome).toHaveBeenCalledOnce();
  expect(result.current.team).toMatchObject({ pageState: 'HOME' });
  expect(reload).not.toHaveBeenCalled();
});

// The end dialog's onClose and its card's button are two hook instances, and
// a team can trigger both before the first round trip answers.
test('a second way home while the first is under way is ignored', async () => {
  const { result } = renderHook(
    () => ({ login: useLogin(), dialog: useBackToHome(), button: useBackToHome() }),
    { wrapper },
  );
  await act(() => result.current.login('2'));
  const toHome = vi.spyOn(repo, 'toHome');

  await act(async () => {
    result.current.dialog();
    result.current.button();
  });
  expect(toHome).toHaveBeenCalledOnce();

  // Once it has finished, the next one goes through.
  await act(async () => {
    result.current.button();
  });
  expect(toHome).toHaveBeenCalledTimes(2);
});

// A refused start or go-home reloaded the page (#112): with the network down
// that left the browser's own error page in place of the round. Each test below
// replaces `location`, and fails on a reload.
describe('a refused start or go-home', () => {
  let reload: ReturnType<typeof vi.fn>;

  // Logged in as the mock's team "2", mid-relay, with `request` about to be
  // refused.
  async function refused(request: 'startRelay' | 'toHome', error = new Error('refused')) {
    const hooks = renderHook(
      () => ({ login: useLogin(), startRelay: useStartRelay(), toHome: useToHome(), team: useTeamStateValue() }),
      { wrapper },
    );
    await act(() => hooks.result.current.login('2'));
    reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    vi.spyOn(repo, request).mockRejectedValue(error);
    return hooks.result;
  }

  afterEach(() => {
    expect(reload).not.toHaveBeenCalled();
  });

  // Another device started the match first: the refusal is its own answer.
  test('shows the match another device started, and says nothing', async () => {
    const result = await refused('startRelay');
    const team = await repo.getTeamState() as TeamModelDto;
    act(() => setTeamState({ ...team, pageState: 'HOME', relayMatch: { state: 'NOT STARTED' } }));

    await act(() => result.current.startRelay());

    expect(result.current.team).toMatchObject({ pageState: 'RELAY', relayMatch: { state: 'IN PROGRESS' } });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  test('to an ended session shows the login form, and says nothing', async () => {
    const result = await refused('startRelay');
    vi.spyOn(repo, 'getTeamState').mockResolvedValue(null);

    await act(() => result.current.startRelay());

    expect(result.current.team).toBeNull();
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  test('that leaves the team where it was says so', async () => {
    const result = await refused('toHome');

    await act(() => result.current.toHome());

    expect(result.current.team).toMatchObject({ pageState: 'RELAY' });
    expect(enqueueSnackbar).toHaveBeenCalledExactlyOnceWith('Váratlan hiba történt', { variant: 'error' });
  });

  test('with the network down keeps the page, and says so', async () => {
    const result = await refused('startRelay', new Error('Network Error'));
    const before = result.current.team;
    vi.spyOn(repo, 'getTeamState').mockRejectedValue(new Error('Network Error'));

    await act(() => result.current.startRelay());

    expect(result.current.team).toBe(before);
    expect(enqueueSnackbar).toHaveBeenCalledExactlyOnceWith('Váratlan hiba történt', { variant: 'error' });
  });
});
