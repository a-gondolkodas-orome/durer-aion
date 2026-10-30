// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig, SWRConfiguration } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { MatchStateDto, TeamModelDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { Admin } from './Admin';
import { formatTime } from '../utils/DateFormatter';

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

// A finished relay's dialog shows the result tables, which are translated; without
// an i18next instance react-i18next warns on the console, which the setup
// file fails the test for.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The grid measures its container and jsdom lays nothing out, so the real one
// reports a zero width to the console — which the setup file counts as a
// failure. What this file is about is what the page does around the grid, so
// the grid is a list of the rows it was handed, with the buttons the page puts
// in each row.
vi.mock('@mui/x-data-grid', () => {
  interface Row { id: string, teamName: string }
  interface Column { field: string, renderCell?: (params: { row: Row }) => React.ReactNode }
  return {
    DataGrid: (props: { rows: Row[], columns: Column[] }) => (
      <ul>
        {props.rows.map(row => (
          <li key={row.id}>
            {row.teamName}
            {props.columns.filter(column => column.renderCell).map(column => (
              <span key={column.field}>{column.renderCell?.({ row })}</span>
            ))}
          </li>
        ))}
      </ul>
    ),
    ExportCsv: () => null,
    Toolbar: () => null,
  };
});

const team = (teamId: string, teamName: string): TeamModelDto => ({
  teamId,
  teamName,
  category: 'C',
  credentials: 'credentials',
  pageState: 'HOME',
  relayMatch: { state: 'NOT STARTED' },
  strategyMatch: { state: 'NOT STARTED' },
});

const alpha = team('8eae8669-125c-42e5-8b49-89afbac31679', 'Alpha');
const bravo = team('1f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b', 'Bravo');

const LATER = '2026-09-07T10:00:00.123Z';
const EARLIER = '2026-09-07T09:00:00.456Z';

let repo: MockClientRepository;

beforeEach(() => {
  repo = new MockClientRepository();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// `Layout` merges its own theme into the surrounding one, and carries the
// snackbar provider the page reports through — same as in the apps.
const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

// What SWR reloads on when the window regains focus. Tests call it rather
// than dispatch a focus event: SWR's own listener hands the event to
// `setTimeout` as its delay, which Node warns about.
let refocus: () => void = () => undefined;
const focusWindow = () => act(() => {
  refocus();
});

// A fresh SWR cache per render: the list's key is the same in every test, and
// a cached list would stand in for the one the test's repository serves.
const renderAdmin = (teamId?: string, swr: SWRConfiguration = {}) =>
  render(
    <ThemeProvider theme={outerTheme}>
      <ClientRepoProvider value={repo}>
        <SWRConfig value={{
          ...swr,
          provider: () => new Map(),
          initFocus: (callback) => {
            refocus = callback;
            return () => undefined;
          },
        }}>
          <Layout>
            <Admin teamId={teamId}/>
          </Layout>
        </SWRConfig>
      </ClientRepoProvider>
    </ThemeProvider>
  );

const confirm = () => fireEvent.click(screen.getByText('Megerősítés'));

const openTeamWithRelay = (relayMatch: TeamModelDto['relayMatch']) => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([{ ...alpha, relayMatch }]);
  renderAdmin(alpha.teamId);
};

const gameState = (points: number, end: string | Date): MatchStateDto => ({
  G: { points, end: new Date(end).toISOString() } as MatchStateDto['G'],
  ctx: {} as MatchStateDto['ctx'],
  deltalog: [],
});

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000);

const alphaInRelayUntil = (endAt: Date): TeamModelDto =>
  ({ ...alpha, relayMatch: { state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt } });

// The list's score is `G.points` as of the list; an answer judged just past
// the end can raise it while the dialog is open.
test('the team dialog totals the game\'s points as it fetches them, not the list\'s score', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(7, LATER));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5 });

  expect(await screen.findByText('Összesen: 7 pont')).toBeInTheDocument();
  expect(repo.getMatchState).toHaveBeenCalledOnce();
});

test('the team dialog shows no total while a match is in progress', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, inAnHour()));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  expect(await screen.findByText('pontszám: 4')).toBeInTheDocument();
  expect(screen.getByText('Összesen: ? pont')).toBeInTheDocument();
});

// Adding minutes moves the team's `endAt` too. The reload after it never
// answers, so only the row the server answered with can show it.
test('adding minutes shows the team\'s new end time', async () => {
  const later = inAnHour();
  vi.spyOn(repo, 'getAll')
    .mockResolvedValueOnce([alphaInRelayUntil(new Date(LATER))])
    .mockReturnValue(new Promise(() => undefined));
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, LATER));
  vi.spyOn(repo, 'addMinutes').mockResolvedValue(alphaInRelayUntil(later));
  renderAdmin(alpha.teamId);
  expect(await screen.findByText(new RegExp(`team-state-end: ${formatTime(new Date(LATER))}`))).toBeInTheDocument();

  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('perc'), { target: { value: '60' } });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('idő hozzáadása'));
  });
  confirm();

  expect(await screen.findByText(new RegExp(`team-state-end: ${formatTime(later)}`))).toBeInTheDocument();
});

// Adding time to everyone moves each team's `endAt`, which a dialog opened
// afterwards reads off the list.
test('adding time to every team reloads the list', async () => {
  const later = inAnHour();
  vi.spyOn(repo, 'getAll')
    .mockResolvedValueOnce([alphaInRelayUntil(new Date(LATER))])
    .mockResolvedValue([alphaInRelayUntil(later)]);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, later));
  vi.spyOn(repo, 'addMinutes').mockResolvedValue(alphaInRelayUntil(later));
  renderAdmin();
  await screen.findByText('Alpha');

  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('perc'), { target: { value: '60' } });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('hozzáadás'));
  });
  confirm();
  expect(await screen.findByText('Sikeres művelet')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Szerkesztés'));

  expect(await screen.findByText(new RegExp(`team-state-end: ${formatTime(later)}`))).toBeInTheDocument();
});

test('the team dialog totals the list\'s score when the match state cannot be fetched', async () => {
  vi.spyOn(repo, 'getMatchState').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5 });

  expect(await screen.findByText('Összesen: 5 pont')).toBeInTheDocument();
});

// A failed request used to render exactly like one still loading: nothing.
test('the team dialog says when the match state cannot be fetched', async () => {
  vi.spyOn(repo, 'getMatchState').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  expect(await screen.findByText('A játék állását nem sikerült betölteni.')).toBeInTheDocument();
});

// The button did nothing at all when the request was refused.
test('a refused logs request is reported', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, inAnHour()));
  vi.spyOn(repo, 'getMatchLogs').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  fireEvent.click(await screen.findByText('logok Lekérése'));

  expect(await screen.findByText('Váratlan hiba történt')).toBeInTheDocument();
});

const finishedAlpha = { ...alpha, relayMatch: { state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5 } } as const;

// The dialog kept a copy of the row it was opened with.
test('the team dialog follows the list when it reloads', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([finishedAlpha]).mockResolvedValue([alpha]);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(5, LATER));
  // Neither deduped into the first load nor throttled for being so soon after it.
  renderAdmin(alpha.teamId, { dedupingInterval: 0, focusThrottleInterval: 0 });
  expect(await screen.findByText(/Végzett/)).toBeInTheDocument();

  await focusWindow();

  await waitFor(() => expect(screen.getAllByText('Nem kezdte el')).toHaveLength(2));
});

// The reload after the reset never answers, so only the row the reset returned
// can show.
test('a reset shows the team\'s new row', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([finishedAlpha, bravo]).mockReturnValue(new Promise(() => undefined));
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(5, LATER));
  vi.spyOn(repo, 'resetRelay').mockResolvedValue(alpha);
  renderAdmin();
  fireEvent.click((await screen.findAllByText('Szerkesztés'))[0]);
  expect(await screen.findByText(/Végzett/)).toBeInTheDocument();

  fireEvent.click(screen.getByText('reset'));
  confirm();

  expect(await screen.findByText('Sikeres művelet')).toBeInTheDocument();
  expect(screen.getAllByText('Nem kezdte el')).toHaveLength(2);
  expect(screen.queryByText('reset')).not.toBeInTheDocument();
});

test('the logs fetched for one match are not shown under the next', async () => {
  const inProgress = (matchID: string) => ({ ...alpha, relayMatch: { state: 'IN PROGRESS', matchID, startAt: new Date(EARLIER), endAt: inAnHour() } } as const);
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([inProgress('first-match')]).mockResolvedValue([inProgress('second-match')]);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, inAnHour()));
  vi.spyOn(repo, 'getMatchLogs').mockResolvedValue({ G: { points: 123456 } } as unknown as MatchStateDto);
  renderAdmin(alpha.teamId, { dedupingInterval: 0, focusThrottleInterval: 0 });
  fireEvent.click(await screen.findByText('logok Lekérése'));
  expect(await screen.findByText('123456')).toBeInTheDocument();

  await focusWindow();

  await waitFor(() => expect(screen.queryByText('123456')).not.toBeInTheDocument());
});

// The countdown waited on a server refresh in its last second, which the
// dialog never gave it, so it froze there, and stayed frozen after minutes
// were added.
test('the team dialog\'s clock stops at zero, and follows minutes added after it', async () => {
  const getMatchState = vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, LATER));
  vi.spyOn(repo, 'addMinutes').mockResolvedValue(alphaInRelayUntil(inAnHour()));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER) });
  expect(await screen.findByText('00:00:00')).toBeInTheDocument();

  getMatchState.mockResolvedValue(gameState(4, inAnHour()));
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('perc'), { target: { value: '60' } });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('idő hozzáadása'));
  });
  confirm();

  expect(await screen.findByText(/^(00:59:5\d|01:00:00)$/)).toBeInTheDocument();
});

test('the team dialog shows the email and the join code only on request, each on its own', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([{ ...alpha, email: 'alpha@example.com', joinCode: '123-4567-890' }]);
  renderAdmin(alpha.teamId);

  const [showEmail] = await screen.findAllByText('Mutasd');
  expect(screen.queryByText(/alpha@example\.com/)).not.toBeInTheDocument();

  fireEvent.click(showEmail);

  expect(screen.getByText(/alpha@example\.com/)).toBeInTheDocument();
  expect(screen.queryByText(/123-4567-890/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Elrejtés'));

  expect(screen.queryByText(/alpha@example\.com/)).not.toBeInTheDocument();
});
