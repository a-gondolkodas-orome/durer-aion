// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { AdminRepoProvider, ClientRepoProvider } from '../client-repo-context';
import { MockClientRepository } from '../mock-client-repository';
import { MatchStateDto, TeamImportResultDto, TeamModelDto } from '../dto/TeamStateDto';
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
// The columns each grid was last given, so a test can read what its CSV
// export would hold.
const grids = vi.hoisted(() => ({ columns: [] as { field: string, disableExport?: boolean }[][] }));
vi.mock('@mui/x-data-grid', () => {
  interface Row { id: string, teamName: string }
  interface Column { field: string, disableExport?: boolean, renderCell?: (params: { row: Row }) => React.ReactNode }
  return {
    DataGrid: (props: {
      rows: Row[], columns: Column[],
      slots?: { toolbar?: React.ComponentType<object> }, slotProps?: { toolbar?: object },
    }) => { grids.columns.push(props.columns); return (<>
      {props.slots?.toolbar && <props.slots.toolbar {...props.slotProps?.toolbar}/>}
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
    </>); },
    ExportCsv: () => null,
    QuickFilter: () => null,
    QuickFilterControl: () => null,
    Toolbar: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  };
});

const team = (teamId: string, teamName: string): TeamModelDto => ({
  teamId,
  teamName,
  competitionId: 'mkhi1nnoim--20-online-c',
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

const COMPETITION_C = 'mkhi1nnoim--20-online-c';

beforeEach(() => {
  repo = new MockClientRepository();
  vi.spyOn(repo, 'getCompetitions').mockResolvedValue([
    { id: COMPETITION_C, metadata: { kind: 'competition', edition: 20, round: 'online', category: 'C' } },
    { id: 'u4lw7pcca1--20-online-d', metadata: { kind: 'competition', edition: 20, round: 'online', category: 'D' } },
  ]);
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
        <AdminRepoProvider value={repo}>
          <SWRConfig value={{ provider: () => new Map() }}>
            <Layout>
              <Admin teamId={teamId}/>
            </Layout>
          </SWRConfig>
        </AdminRepoProvider>
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
  const confirm = await screen.findByRole('dialog', { name: 'Idő hozzáadása' });
  fireEvent.click(within(confirm).getByRole('button', { name: 'Hozzáadás' }));

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

// Both are optional in the import, which stores an empty string; a database
// loaded before that holds null.
test.each([
  ['empty', ''],
  ['null', null],
])('a team whose email and notes are %s lists and opens like any other', async (_, missing) => {
  const bare = { ...alpha, email: missing, other: missing } as unknown as TeamModelDto;
  vi.spyOn(repo, 'getAll').mockResolvedValue([bare]);
  renderAdmin();

  fireEvent.click(await screen.findByText('Szerkesztés'));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getAllByText('Mutasd')[0]);

  expect(within(dialog).getByText('—')).toBeInTheDocument();
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

test('the stats say what the numbers in each triple count', async () => {
  window.history.replaceState(null, '', '/admin?tab=statisztika');
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();

  expect(await screen.findByText('még nem kezdte el')).toBeVisible();
  expect(screen.getByText('folyamatban')).toBeVisible();
  expect(screen.getByText('befejezte')).toBeVisible();
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

const importAnswer = (overrides: Partial<TeamImportResultDto> = {}): TeamImportResultDto => ({
  successful: 0, existing: 0, updated: 0, failed: 0, export_table: [], logs: { sev: [], value: [] }, ...overrides,
});

const alphaCodes = ['Alpha', COMPETITION_C, 'a@b.com', 'x', 'id-a', '111-2222-333', 'creds-a', '', ''];

/** Picks a file on the import tab and starts the import. */
const importFile = async (name = 'teams.tsv') => {
  fireEvent.click(await screen.findByRole('tab', { name: 'Import/export' }));
  const file = new File(['Teamname\tCompetition\n'], name);
  fireEvent.change(screen.getByTestId('importTeamsFile'), { target: { files: [file] } });
  fireEvent.click(screen.getByText('Importálás indítása'));
  return file;
};

/** The text of every file the page hands the browser, in order. */
const savedDownloads = (): string[] => {
  const saved: string[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
    void (blob as Blob).text().then(text => saved.push(text));
    return 'blob:codes';
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  return saved;
};

test('the import tab uploads the picked file, and saves the join codes when asked', async () => {
  const getAll = vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams')
    .mockResolvedValue(importAnswer({ successful: 1, export_table: [alphaCodes] }));
  const saved = savedDownloads();
  renderAdmin();

  const file = await importFile();

  expect(await screen.findByText('1 csapat importálva, 0 sor hibás.')).toBeInTheDocument();
  expect(importTeams).toHaveBeenCalledWith(file);
  await waitFor(() => { expect(getAll).toHaveBeenCalledTimes(2); });
  // A file of every team's secrets is not saved unasked.
  expect(saved).toEqual([]);

  fireEvent.click(screen.getByText('Az importáltak belépőkódjainak letöltése'));

  await waitFor(() => { expect(saved).toHaveLength(1); });
  expect(saved[0]).toBe(`Teamname\tCompetition\tEmail\tOther\tID\tLogin Code\tCredentials\tOpens At\tCloses At\n${alphaCodes.join('\t')}\n`);
});

// The Competition column takes a name or an id, so the page lists what to
// write for each competition, to copy.
test('the import tab lists the competitions newest first, with what to import them as', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderAdmin();

  fireEvent.click(await screen.findByRole('tab', { name: 'Import/export' }));
  const table = await screen.findByTestId('competitionTable');
  const row = (await within(table).findByText('20 online C')).closest('li');
  expect(within(table).getByText('20 online D')).toBeInTheDocument();
  expect(grids.columns.at(-1)?.map(column => column.field))
    .toEqual(['importAs', 'id', 'edition', 'round', 'category', 'label', 'startWindow']);
  if (row === null) throw new Error('no table row');
  fireEvent.click(within(row).getByRole('button', { name: 'Másolás: 20 online C' }));
  await waitFor(() => { expect(writeText).toHaveBeenCalledWith('20 online C'); });
  expect(await screen.findByText('Vágólapra másolva: 20 online C')).toBeInTheDocument();

  fireEvent.click(within(row).getByRole('button', { name: `Másolás: ${COMPETITION_C}` }));
  await waitFor(() => { expect(writeText).toHaveBeenCalledWith(COMPETITION_C); });
});

// A competition's window is set on the page, not only in its config in code.
test('the import tab sets a competition\'s start window, and lists it as set', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const setWindow = vi.spyOn(repo, 'setCompetitionWindow').mockResolvedValue();
  renderAdmin();

  fireEvent.click(await screen.findByRole('tab', { name: 'Import/export' }));
  const table = await screen.findByTestId('competitionTable');
  expect(within(table).getAllByText('bármikor')).toHaveLength(2);
  vi.spyOn(repo, 'getCompetitions').mockResolvedValue([
    { id: COMPETITION_C, metadata: { kind: 'competition', edition: 20, round: 'online', category: 'C' },
      startWindow: { opensAt: '2026-11-20T15:00+01:00' }, configStartWindow: null },
  ]);
  fireEvent.click(within(table).getByRole('button', { name: 'Indítási ablak módosítása: 20 online C' }));
  fireEvent.change(await screen.findByLabelText('Kezdete'), { target: { value: '2026-11-20T15:00+01:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));

  await waitFor(() => {
    expect(setWindow).toHaveBeenCalledWith(COMPETITION_C, { opensAt: '2026-11-20T15:00+01:00', closesAt: null });
  });
  expect(await within(table).findByText('2026-11-20T15:00+01:00 után (itt megadva)')).toBeInTheDocument();
});

test('the import tab refuses a start window with no offset before sending it', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const setWindow = vi.spyOn(repo, 'setCompetitionWindow').mockResolvedValue();
  renderAdmin();

  fireEvent.click(await screen.findByRole('tab', { name: 'Import/export' }));
  const table = await screen.findByTestId('competitionTable');
  fireEvent.click(within(table).getByRole('button', { name: 'Indítási ablak módosítása: 20 online C' }));
  fireEvent.change(await screen.findByLabelText('Kezdete'), { target: { value: '2026-11-20T15:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Mentés' }));

  expect(await screen.findByText(/időzónás időpont/)).toBeInTheDocument();
  expect(setWindow).not.toHaveBeenCalled();
});

test('the import tab lists the server\'s errors and warnings', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importAnswer({
    failed: 1,
    logs: {
      sev: ['warn', 'error'],
      value: ['Ezeket az oszlopokat nem ismerjük, kimaradnak: School', '2. sor (Bravo): hiányzik a csapatnév.'],
    },
  }));
  const saved = savedDownloads();
  renderAdmin();

  await importFile();

  expect(await screen.findByText('2. sor (Bravo): hiányzik a csapatnév.')).toBeInTheDocument();
  expect(screen.getByText('Ezeket az oszlopokat nem ismerjük, kimaradnak: School')).toBeInTheDocument();
  // Nothing went in, so there is nothing to save.
  expect(screen.getByText('0 csapat importálva, 1 sor hibás.')).toBeInTheDocument();
  expect(saved).toEqual([]);
});

// Re-running a grown registration list is how late teams are added, so a file
// whose every team is already there is the ordinary answer, not a failure.
test('the import tab calls a file of teams already there no failure', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importAnswer({
    existing: 2,
    logs: { sev: ['warn'], value: ['2 csapat már szerepelt, változatlanul hagytuk: Alpha, Bravo.'] },
  }));
  renderAdmin();

  await importFile();

  expect(await screen.findByText('Nem került be új csapat: mind a(z) 2 már szerepelt.')).toBeInTheDocument();
  expect(screen.getByText('0 csapat importálva, 2 már szerepelt, 0 sor hibás.')).toBeInTheDocument();
  expect(screen.queryByText('Egy csapat sem került be.')).not.toBeInTheDocument();
});

test('a second import keeps the codes of the first', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const bravoCodes = ['Bravo', 'u4lw7pcca1--20-online-d', 'b@b.com', 'y', 'id-b', '444-5555-666', 'creds-b'];
  vi.spyOn(repo, 'importTeams')
    .mockResolvedValueOnce(importAnswer({ successful: 1, export_table: [alphaCodes] }))
    .mockResolvedValueOnce(importAnswer({ successful: 1, export_table: [bravoCodes] }));
  const saved = savedDownloads();
  renderAdmin();

  await importFile();
  expect(await screen.findByText('Az importáltak belépőkódjainak letöltése')).toBeInTheDocument();
  await importFile();
  expect(await screen.findByText('1 csapat importálva, 0 sor hibás.')).toBeInTheDocument();
  await waitFor(() => { expect(screen.getByText('Importálás indítása')).toBeDisabled(); });
  fireEvent.click(screen.getByText('Az importáltak belépőkódjainak letöltése'));
  await waitFor(() => { expect(saved).toHaveLength(1); });

  expect(saved[0]).toContain('111-2222-333');
  expect(saved[0]).toContain('444-5555-666');
});

test('the import tab says why the server refused the file', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockRejectedValue(new Error('Csak .tsv kiterjesztésű fájlt lehet importálni.'));
  renderAdmin();

  await importFile('teams.csv');

  expect(await screen.findByText('Csak .tsv kiterjesztésű fájlt lehet importálni.')).toBeInTheDocument();
});

test('a reset asks first, names the team, and does nothing when cancelled', async () => {
  vi.spyOn(repo, 'getMatchState').mockResolvedValue(gameState(7, LATER));
  const reset = vi.spyOn(repo, 'resetRelay').mockResolvedValue(alpha);
  openTeamWithRelay({ state: 'FINISHED', matchID: 'relay-match', startAt: new Date(EARLIER), endAt: new Date(LATER), score: 7 });

  fireEvent.click(await screen.findByRole('button', { name: 'Váltó reset' }));
  let confirm = await screen.findByRole('dialog', { name: 'Váltó alaphelyzetbe állítása' });
  expect(within(confirm).getByText('Alpha')).toBeInTheDocument();
  expect(within(confirm).getByText('Végzett')).toBeInTheDocument();
  fireEvent.click(within(confirm).getByRole('button', { name: 'Mégse' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Váltó alaphelyzetbe állítása' })).not.toBeInTheDocument());
  expect(reset).not.toHaveBeenCalled();

  fireEvent.click(await screen.findByRole('button', { name: 'Váltó reset' }));
  confirm = await screen.findByRole('dialog', { name: 'Váltó alaphelyzetbe állítása' });
  expect(confirm).toHaveAccessibleDescription(/^A váltó NOT STARTED állapotba kerül/);
  const button = within(confirm).getByRole('button', { name: 'Váltó reset' });
  // The other match's word does not unlock it; the right one, without accents, does.
  fireEvent.change(within(confirm).getByLabelText('Írd be: váltó'), { target: { value: 'stratégia' } });
  expect(button).toBeDisabled();
  fireEvent.change(within(confirm).getByLabelText('Írd be: váltó'), { target: { value: ' Valto ' } });
  fireEvent.click(button);
  await waitFor(() => expect(reset).toHaveBeenCalledWith(alpha.teamId));
});

// The codes can be mailed out at any time, not only from the import that made
// them. Email and notes are optional, and null on an older database.
test('the list points to the export, which downloads every team with its join code', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([
    { ...alpha, email: 'a@b.com', joinCode: '111-2222-333', other: 'Radnóti\tBudapest' } as TeamModelDto,
    { ...team('2f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b', 'Bare'), email: null, joinCode: '444-5555-666', other: null } as unknown as TeamModelDto,
  ]);
  const saved = savedDownloads();
  renderAdmin();

  fireEvent.click(await screen.findByText('Belépőkódokkal: Import/export fül'));

  expect(screen.getByRole('tab', { name: 'Import/export' })).toHaveAttribute('aria-selected', 'true');
  expect(window.location.search).toBe('?tab=import-export');
  fireEvent.click(screen.getByText('Mind a(z) 2 csapat letöltése belépőkódokkal'));

  await waitFor(() => { expect(saved).toHaveLength(1); });
  expect(saved[0]).toBe([
    'Teamname\tCompetition\tEmail\tOther\tID\tLogin Code\tCredentials\tOpens At\tCloses At',
    // A tab in a cell would shift every column after it.
    `Alpha\t${COMPETITION_C}\ta@b.com\tRadnóti Budapest\t${alpha.teamId}\t111-2222-333\tcredentials\t\t`,
    `Bare\t${COMPETITION_C}\t\t\t2f9e1c9a-4e5b-4d0f-9a2b-3c4d5e6f7a8b\t444-5555-666\tcredentials\t\t`,
  ].join('\n') + '\n');
});

// The ID is the team's GUID, and the GUID is its session cookie's value: a
// file holding it can log a team in. The CSV is meant to be shareable.
test('the team list\'s CSV holds no login secret', async () => {
  grids.columns = [];
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  renderAdmin();
  await screen.findByText('Alpha');

  // The team list's grid, not the import tab's table of competitions.
  const teamGrid = [...grids.columns].reverse().find(columns => columns.some(column => column.field === 'teamName'));
  const exported = (teamGrid ?? []).filter(column => column.disableExport !== true).map(column => column.field);

  expect(exported).not.toHaveLength(0);
  for (const secret of ['id', 'teamId', 'joinCode', 'credentials', 'email']) {
    expect(exported).not.toContain(secret);
  }
});
