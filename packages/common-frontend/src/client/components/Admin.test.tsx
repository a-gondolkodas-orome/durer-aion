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

const importAnswer = (overrides: Partial<TeamImportResultDto> = {}): TeamImportResultDto => ({
  successful: 0, failed: 0, export_table: [], logs: { sev: [], value: [] }, ...overrides,
});

const alphaCodes = ['Alpha', 'C', 'a@b.com', 'x', 'id-a', '111-2222-333', 'creds-a'];

/** Picks a file on the import tab and starts the import. */
const importFile = async (name = 'teams.tsv') => {
  fireEvent.click(await screen.findByRole('tab', { name: 'Importálás' }));
  const file = new File(['Teamname\tCategory\n'], name);
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

test('the import tab uploads the picked file, saves the join codes, and reloads the list', async () => {
  const getAll = vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams')
    .mockResolvedValue(importAnswer({ successful: 1, export_table: [alphaCodes] }));
  const saved = savedDownloads();
  renderAdmin();

  const file = await importFile();

  expect(await screen.findByText('1 csapat importálva, 0 sor hibás.')).toBeInTheDocument();
  expect(importTeams).toHaveBeenCalledWith(file);
  // Unasked for: it is the only copy of the codes the import generated.
  await waitFor(() => { expect(saved).toHaveLength(1); });
  expect(saved[0]).toBe(`Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials\n${alphaCodes.join('\t')}\n`);
  await waitFor(() => { expect(getAll).toHaveBeenCalledTimes(2); });
});

test('the import tab lists the server\'s errors and warnings, not its narration', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importAnswer({
    failed: 1,
    logs: {
      sev: ['info', 'warn', 'error', 'error'],
      value: ['Generating login code', '"Other" field not set', 'Invalid category', '-'.repeat(52)],
    },
  }));
  const saved = savedDownloads();
  renderAdmin();

  await importFile();

  expect(await screen.findByText('Invalid category')).toBeInTheDocument();
  expect(screen.getByText('"Other" field not set')).toBeInTheDocument();
  expect(screen.queryByText('Generating login code')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem').filter(item => item.textContent === '-'.repeat(52))).toEqual([]);
  // Nothing went in, so there is nothing to save.
  expect(screen.getByText('0 csapat importálva, 1 sor hibás.')).toBeInTheDocument();
  expect(saved).toEqual([]);
});

test('a second import keeps the codes of the first', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const bravoCodes = ['Bravo', 'D', 'b@b.com', 'y', 'id-b', '444-5555-666', 'creds-b'];
  vi.spyOn(repo, 'importTeams')
    .mockResolvedValueOnce(importAnswer({ successful: 1, export_table: [alphaCodes] }))
    .mockResolvedValueOnce(importAnswer({ successful: 1, export_table: [bravoCodes] }));
  const saved = savedDownloads();
  renderAdmin();

  await importFile();
  expect(await screen.findByText('Belépőkódok letöltése')).toBeInTheDocument();
  await importFile();
  await waitFor(() => { expect(saved).toHaveLength(2); });

  expect(saved[1]).toContain('111-2222-333');
  expect(saved[1]).toContain('444-5555-666');
});

test('the import tab says why the server refused the file', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockRejectedValue(new Error('Csak .tsv kiterjesztésű fájlt lehet importálni.'));
  renderAdmin();

  await importFile('teams.csv');

  expect(await screen.findByText('Csak .tsv kiterjesztésű fájlt lehet importálni.')).toBeInTheDocument();
});
