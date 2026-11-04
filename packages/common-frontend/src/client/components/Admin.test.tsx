// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { MatchStateDto, TeamModelDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { Admin } from './Admin';

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

const LATER = '2026-09-07T10:00:00.123Z';
const EARLIER = '2026-09-07T09:00:00.456Z';

let repo: MockClientRepository;

beforeEach(() => {
  repo = new MockClientRepository();
  // The open tab is read from the URL, which jsdom keeps between tests.
  window.history.replaceState(null, '', '/admin');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// `Layout` merges its own theme into the surrounding one, and carries the
// snackbar provider the page reports through — same as in the apps.
const outerTheme = { palette: { primary: { main: '#11009E', contrastText: '#fff' } } };

// A fresh SWR cache per render: the list's key is the same in every test, and
// a cached list would stand in for the one the test's repository serves.
const renderAdmin = (teamId?: string) =>
  render(
    <ThemeProvider theme={outerTheme}>
      <ClientRepoProvider value={repo}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <Layout>
            <Admin teamId={teamId}/>
          </Layout>
        </SWRConfig>
      </ClientRepoProvider>
    </ThemeProvider>
  );

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

const total = () => screen.getByTestId('teamTotal');

// The list's score is `G.points` as of the list; an answer judged just past
// the end can raise it while the dialog is open.
test('the team dialog totals the game\'s points as it fetches them, not the list\'s score', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(7, LATER));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5 });

  await waitFor(() => expect(total()).toHaveTextContent('7 pont'));
  expect(repo.getMatchState).toHaveBeenCalledOnce();
});

test('the team dialog shows the total so far as not final while a match is in progress', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, inAnHour()));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  await waitFor(() => expect(total()).toHaveTextContent('4 pont'));
  expect(screen.getByText('nem végleges')).toBeInTheDocument();
  expect(screen.getByText('váltó 4, még tart + stratégia 0 (nem kezdte el)')).toBeInTheDocument();
});

test('the team dialog calls the total final once both matches have finished', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(6, LATER));
  const finished = (matchID: string) => ({ state: 'FINISHED' as const, matchID, startAt: new Date(EARLIER), endAt: new Date(LATER), score: 6 });
  vi.spyOn(repo, 'getAll').mockResolvedValue([{ ...alpha, relayMatch: finished('relay-match'), strategyMatch: finished('strategy-match') }]);
  renderAdmin(alpha.teamId);

  await waitFor(() => expect(total()).toHaveTextContent('12 pont'));
  expect(screen.getByText('Összesen')).toBeInTheDocument();
  expect(screen.queryByText('nem végleges')).not.toBeInTheDocument();
});

test('the team dialog says when neither match has started', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin(alpha.teamId);

  expect(await screen.findByText('még egyik fordulót sem kezdték el')).toBeInTheDocument();
  expect(total()).toHaveTextContent('0 pont');
});

test('the team dialog totals the list\'s score when the match state cannot be fetched', async () => {
  vi.spyOn(repo, 'getMatchState').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5 });

  await waitFor(() => expect(total()).toHaveTextContent('5 pont'));
});

// A failed request used to render exactly like one still loading: nothing.
test('the team dialog says when the match state cannot be fetched', async () => {
  vi.spyOn(repo, 'getMatchState').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  expect(await screen.findByText('A játék állását nem sikerült betölteni.')).toBeInTheDocument();
});

// The countdown started from a placeholder 10 s, and once at zero it waited
// for a server reading the dialog never takes, ignoring the minutes an
// organiser added.
test('a running match\'s remaining time starts from its end', async () => {
  const end = new Date(Date.now() + 30 * 60 * 1000);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(0, end));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: end });

  expect(await screen.findByTestId('relayRemaining')).toHaveTextContent(/^00:(29:5\d|30:00)$/);
});

test('a countdown that has reached zero follows the minutes added to it', async () => {
  const end = new Date(Date.now() + 1500);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(0, end));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: end });

  const remaining = await screen.findByTestId('relayRemaining');
  // Past its last second Countdown stops counting by itself.
  await waitFor(() => expect(remaining).toHaveTextContent('00:00:00'), { timeout: 3000 });
  await new Promise(resolve => setTimeout(resolve, 1200));

  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(0, new Date(end.getTime() + 60 * 60 * 1000)));
  vi.spyOn(repo, 'addMinutes').mockResolvedValue('');
  fireEvent.change(screen.getByPlaceholderText('perc'), { target: { value: '60' } });
  fireEvent.click(screen.getByRole('button', { name: 'Hozzáadás' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Megerősítés' }));

  await waitFor(() => expect(screen.getByTestId('relayRemaining')).toHaveTextContent(/^(00:59:5\d|01:00:0\d)$/), { timeout: 3000 });
}, 10000);

test('a finished relay\'s max comes from its status, without the match state', async () => {
  vi.spyOn(repo, 'getMatchState').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({
    state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 5,
    relayResults: [{ maxPoints: 3, points: 3, trySeconds: [60] }, { maxPoints: 4, points: 2, trySeconds: [30, 40] }],
  });

  expect(await screen.findByText('/ 7')).toBeInTheDocument();
});

test('a finished match shows no remaining time', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(7, LATER));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 7 });

  expect(await screen.findByText('Kezdés')).toBeInTheDocument();
  expect(screen.queryByText('Hátralévő idő')).not.toBeInTheDocument();
});

// The button did nothing at all when the request was refused.
test('a refused logs request is reported', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(4, inAnHour()));
  vi.spyOn(repo, 'getMatchLogs').mockRejectedValue(new Error('Váratlan hiba történt'));
  openTeamWithRelay({ state: 'IN PROGRESS', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: inAnHour() });

  fireEvent.click(await screen.findByText('Logok lekérése'));

  expect(await screen.findByText('Váratlan hiba történt')).toBeInTheDocument();
});

test('the team dialog names the page the team is on', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([{ ...alpha, pageState: 'DISCLAIMER' }]);
  renderAdmin(alpha.teamId);

  // The raw value glosses the label, before what the page means for the team.
  const label = await screen.findByText('Tájékoztató oldalon');
  expect(label.parentElement).toHaveTextContent(/^Most: Tájékoztató oldalon \(DISCLAIMER\) · még nem indíthat játékot$/);
});

test('a match that has not started cannot be reset', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(7, LATER));
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 7 });

  expect(await screen.findByRole('button', { name: 'Váltó reset' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Stratégia reset' })).toBeDisabled();
});

// A live game counts as a try when it starts and is recorded when it ends.
test('the team dialog says which live strategy game is still being played', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue({
    ...gameState(0, inAnHour()),
    G: { points: 0, end: inAnHour().toISOString(), numberOfTries: 4, liveResults: ['lost', 'won', 'lost'] } as MatchStateDto['G'],
  });
  vi.spyOn(repo, 'getAll').mockResolvedValue([{
    ...alpha,
    strategyMatch: { state: 'IN PROGRESS', matchID: 'strategy-match', startAt: new Date(EARLIER), endAt: inAnHour() },
  }]);
  renderAdmin(alpha.teamId);

  expect(await screen.findByText('A 4. játszma most tart, a táblázatba a végén kerül be.')).toBeInTheDocument();
});

test('a team\'s own tab is titled with its name and links back to the list', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin(alpha.teamId);

  expect(await screen.findByRole('heading', { level: 1, name: 'Alpha' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Váltó' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Admin felület' })).toHaveAttribute('href', '/admin');
});

test('the team dialog opened from the list keeps the page\'s own title', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();

  fireEvent.click(await screen.findByText('Szerkesztés'));

  expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Alpha' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'Váltó' })).toBeInTheDocument();
  expect(screen.getByText('Admin felület')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Admin felület' })).not.toBeInTheDocument();
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

test('the team list, with the add-time form, and the stats are on two tabs, the list first', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();

  expect(await screen.findByText('Alpha')).toBeVisible();
  expect(screen.getByText('hozzáadás')).toBeVisible();
  expect(screen.getByText('Kategória')).not.toBeVisible();

  fireEvent.click(screen.getByRole('tab', { name: 'Statisztika' }));

  expect(screen.getByText('Kategória')).toBeVisible();
  expect(screen.getByText('Alpha')).not.toBeVisible();
  expect(screen.getByText('hozzáadás')).not.toBeVisible();
  expect(window.location.search).toBe('?tab=statisztika');

  fireEvent.click(screen.getByRole('tab', { name: 'Csapatok' }));

  expect(screen.getByText('Alpha')).toBeVisible();
  expect(window.location.search).toBe('');
});

test('the tab named in the URL is the one that opens', async () => {
  window.history.replaceState(null, '', '/admin?tab=statisztika');
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();

  expect(await screen.findByText('Kategória')).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Statisztika' })).toHaveAttribute('aria-selected', 'true');
});

test('each tab names the panel it controls, and the panel is labelled by its tab', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();

  const tab = await screen.findByRole('tab', { name: 'Csapatok' });
  const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
  expect(panel).toHaveAttribute('role', 'tabpanel');
  expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  expect(panel).toContainElement(screen.getByText('Alpha'));
});

test('a single team\'s page has no tabs, not even while the list loads', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(0, inAnHour()));
  renderAdmin(alpha.teamId);

  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(await screen.findAllByText('Mutasd')).not.toHaveLength(0);
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});
