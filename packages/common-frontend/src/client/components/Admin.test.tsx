// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { parseTeamsTsv } from 'schemas';
import { ClientRepoProvider, MockClientRepository } from '../api-repository-interface';
import { DeletedTeamDto, ImportResultDto, TeamModelDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { Admin } from './Admin';

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

// The grid measures its container and jsdom lays nothing out, so the real one
// reports a zero width to the console — which the setup file counts as a
// failure. What this file is about is what the page does around the grid, so
// the grid is a list of the rows it was handed: each column's value, and the
// buttons the page puts in the columns that render their own.
vi.mock('@mui/x-data-grid', () => {
  type Row = Record<string, unknown>;
  interface Column { field: string, renderCell?: (params: { row: Row }) => React.ReactNode }
  // A row's cells are whatever the page put in them, the match objects
  // included; only the ones a grid would show as text are worth rendering.
  const text = (value: unknown): string =>
    typeof value === 'string' ? value : typeof value === 'number' ? `${value}` : '';
  return {
    DataGrid: (props: { rows: Row[], columns: Column[] }) => (
      <ul>
        {props.rows.map((row, index) => (
          <li key={text(row.id) || `${index}`}>
            {props.columns.map(column => (
              <span key={column.field}>
                {column.renderCell ? column.renderCell({ row }) : text(row[column.field])}
              </span>
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

const archived = (source: TeamModelDto, deletionId: number, deletedAt: string): DeletedTeamDto => ({
  ...source,
  teamId: source.teamId ?? '',
  joinCode: '000-0000-000',
  email: 'team@example.com',
  other: '',
  deletionId,
  deletedAt,
});

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

const confirm = () => fireEvent.click(screen.getByText('Megerősítés'));

// The list used to stay as it was after a delete, so the next click asked the
// server to delete a team it no longer had, and got a 404 for it.
test('deleting a team from its dialog closes the dialog and drops the row', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([alpha, bravo]).mockResolvedValue([bravo]);
  vi.spyOn(repo, 'removeTeam').mockResolvedValue();
  renderAdmin();
  fireEvent.click((await screen.findAllByText('Szerkesztés'))[0]);
  fireEvent.click(await screen.findByText('Csapat törlése'));

  confirm();

  expect(await screen.findByText('Csapat törölve')).toBeInTheDocument();
  expect(repo.removeTeam).toHaveBeenCalledWith(alpha.teamId);
  await waitFor(() => expect(screen.queryByText('Csapat törlése')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
  expect(screen.getByText('Bravo')).toBeInTheDocument();
});

// `/admin/<teamId>` opens one team directly; once it is gone the page has the
// list to fall back to.
test('deleting the team a page was opened on takes the page back to the list', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([alpha, bravo]).mockResolvedValue([bravo]);
  vi.spyOn(repo, 'removeTeam').mockResolvedValue();
  renderAdmin(alpha.teamId);
  fireEvent.click(await screen.findByText('Csapat törlése'));

  confirm();

  expect(await screen.findByText('Csapat törölve')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Csapat törlése')).not.toBeInTheDocument());
  expect(screen.getByText('Bravo')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

// One request for all of them, so the archive gets them as one batch.
test('deleting every team is one request, and empties the list', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValueOnce([alpha, bravo]).mockResolvedValue([]);
  vi.spyOn(repo, 'removeAllTeams').mockResolvedValue({ deleted: 2, deletedAt: LATER });
  renderAdmin();
  fireEvent.click(await screen.findByText('Összes csapat törlése'));

  confirm();

  expect(await screen.findByText('2 csapat törölve')).toBeInTheDocument();
  expect(repo.removeAllTeams).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
  expect(screen.queryByText('Bravo')).not.toBeInTheDocument();
});

// The repository turns the server's answers into messages; the page shows them
// as they are.
test('a failed bulk delete is reported, and the list kept', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha, bravo]);
  vi.spyOn(repo, 'removeAllTeams').mockRejectedValue(new Error('Váratlan hiba történt'));
  renderAdmin();
  fireEvent.click(await screen.findByText('Összes csapat törlése'));

  confirm();

  expect(await screen.findByText('Váratlan hiba történt')).toBeInTheDocument();
  expect(screen.getByText('Alpha')).toBeInTheDocument();
  expect(screen.getByText('Bravo')).toBeInTheDocument();
});

const openDeletedTab = async () => {
  fireEvent.click(await screen.findByText('Törölt csapatok'));
};

// The rows one "delete all" archived share a timestamp; the tab shows them as
// one group, with the single deletion as a group of its own.
test('the archive tab shows the deleted teams in their batches', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'getDeleted').mockResolvedValue([
    archived(alpha, 3, LATER),
    archived(alpha, 1, EARLIER),
    archived(bravo, 2, EARLIER),
  ]);
  renderAdmin();

  await openDeletedTab();

  const headers = await screen.findAllByText(/^Törölve: /);
  expect(headers.map(header => header.textContent)).toStrictEqual([
    `Törölve: ${new Date(LATER).toLocaleString('hu-HU')} — 1 csapat`,
    `Törölve: ${new Date(EARLIER).toLocaleString('hu-HU')} — 2 csapat`,
  ]);
  expect(screen.getAllByText('Alpha')).toHaveLength(2);
  expect(screen.getByText('Bravo')).toBeInTheDocument();
});

test('restoring one team reloads the archive and the live list', async () => {
  const getAll = vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'getDeleted')
    .mockResolvedValueOnce([archived(alpha, 1, EARLIER), archived(bravo, 2, EARLIER)])
    .mockResolvedValue([archived(bravo, 2, EARLIER)]);
  vi.spyOn(repo, 'restoreTeam').mockResolvedValue();
  renderAdmin();
  await openDeletedTab();
  fireEvent.click((await screen.findAllByText('Visszaállítás'))[0]);

  confirm();

  expect(await screen.findByText('Alpha visszaállítva')).toBeInTheDocument();
  expect(repo.restoreTeam).toHaveBeenCalledWith(1);
  await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
  expect(screen.getByText('Bravo')).toBeInTheDocument();
  // Once on mount, once more for the team that is live again.
  await waitFor(() => expect(getAll).toHaveBeenCalledTimes(2));
});

// A team a live one blocks stays archived; the answer names it, so the
// organiser knows which to sort out.
test('restoring a batch names the teams a live team blocked', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'getDeleted')
    .mockResolvedValueOnce([archived(alpha, 1, EARLIER), archived(bravo, 2, EARLIER)])
    .mockResolvedValue([archived(bravo, 2, EARLIER)]);
  vi.spyOn(repo, 'restoreBatch').mockResolvedValue({ restored: ['Alpha'], conflicts: ['Bravo'] });
  renderAdmin();
  await openDeletedTab();
  fireEvent.click(await screen.findByText('A csoport visszaállítása'));

  confirm();

  expect(await screen.findByText('1 csapat visszaállítva, 1 ütközik élő csapattal: Bravo')).toBeInTheDocument();
  expect(repo.restoreBatch).toHaveBeenCalledWith(EARLIER);
  await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
});

// Teams deleted one by one, before batches existed, are a batch each — a
// thousand of them for a past year — and a grid per batch all at once is what
// made the tab crawl. A page of them, and a button for the next.
test('the archive tab shows ten batches at a time', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const singles = Array.from({ length: 12 }, (_, i) =>
    archived(team(`0000000${i}-0000-4000-8000-000000000000`, `Team ${i}`), i, `2026-09-07T10:${String(i).padStart(2, '0')}:00.000Z`));
  vi.spyOn(repo, 'getDeleted').mockResolvedValue(singles);
  renderAdmin();
  await openDeletedTab();

  expect(await screen.findAllByText(/^Törölve: /)).toHaveLength(10);
  expect(screen.getByText('A(z) 12 törlésből 10 látszik.')).toBeInTheDocument();
  expect(screen.queryByText('Team 11')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('További 2 betöltése'));

  expect(await screen.findAllByText(/^Törölve: /)).toHaveLength(12);
  expect(screen.getByText('Team 11')).toBeInTheDocument();
  expect(screen.queryByText(/betöltése$/)).not.toBeInTheDocument();
});

test('the archive tab says so when it is empty', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  renderAdmin();

  await openDeletedTab();

  expect(await screen.findByText('Nincs törölt csapat.')).toBeInTheDocument();
});

const openImportTab = async () => {
  fireEvent.click(await screen.findByText('Importálás'));
};

const HEADER = 'Teamname\tCategory\tEmail\tOther\tID\tLogin Code\tCredentials';
const importRow = (name: string, category = 'C') => `${name}\t${category}\ta@b.com\tx\t\t\t`;

const paste = (tsv: string) =>
  fireEvent.change(screen.getByTestId('importTeamsTsv'), { target: { value: tsv } });

const importResult = (overrides: Partial<ImportResultDto> = {}): ImportResultDto => ({
  imported: 0, accepted: 0, refused: false, rows: 0, problems: [], problemsTruncated: 0, badRows: 0,
  warningCounts: {}, exportTable: [], ...overrides,
});

// Real values, since a test that reads a download back has to parse it.
const ALPHA_CREDENTIALS = 'c0ffee00-1111-2222-3333-444444444444';
const BRAVO_CREDENTIALS = 'decafbad-5555-6666-7777-888888888888';

/** The text of every file the page hands the browser, in order. */
const savedDownloads = (): string[] => {
  const saved: string[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
    void (blob as Blob).text().then(text => saved.push(text));
    return 'blob:codes';
  });
  return saved;
};

// The browser knows the file's own rules, so a mistake in it is named before a
// request is made — and the button that would write 500 teams stays disabled.
test('the import tab refuses a bad row without asking the server', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams');
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha'), importRow('Bravo', 'X')].join('\n'));

  expect(await screen.findByText(/3\. sor/)).toBeInTheDocument();
  expect(screen.getByText('A kategória nem C, D vagy E.')).toBeInTheDocument();
  expect(screen.getByText('2 sor, ebből 1 hibás. Az importálás így nem futna le.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(importTeams).not.toHaveBeenCalled();
});

// Rows copied out of a spreadsheet without the line above them. The first line
// is the header, so the page used to import every team but one and report a
// clean file — the only warning it showed said the header was usually no
// problem.
test('the import tab refuses a paste with no header line', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams');
  renderAdmin();
  await openImportTab();

  paste([importRow('Alpha'), importRow('Bravo'), importRow('Charlie')].join('\n'));

  expect(await screen.findByText(/hiányzik a fejlécsor/)).toBeInTheDocument();
  // All three counted, and no row blamed for what is wrong with the file.
  expect(screen.getByText('3 sor. Magával a fájllal van baj, az importálás így nem futna le.'))
    .toBeInTheDocument();
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(importTeams).not.toHaveBeenCalled();
});

// One row can break several rules at once. Counting problems made the summary
// say "1 sor, ebből 2 hibás", which is more broken rows than there are rows.
test('the import tab counts the rows at fault, not the rules they break', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  renderAdmin();
  await openImportTab();

  // No team name and a category that is not one: two problems, one row.
  paste([HEADER, importRow('Alpha'), '\tX\ta@b.com\tx\t\t\t'].join('\n'));

  expect(await screen.findByText('Hiányzik a csapatnév.')).toBeInTheDocument();
  expect(screen.getByText('A kategória nem C, D vagy E.')).toBeInTheDocument();
  expect(screen.getByText('2 sor, ebből 1 hibás. Az importálás így nem futna le.')).toBeInTheDocument();
});

// A row with a tab inside a cell is never parsed, so counting the parsed rows
// blamed the file as a whole — "Magával a fájllal van baj" — for one named line,
// and a file of nothing but such rows was reported as holding no teams at all.
test('the import tab blames the line, not the file, for a row it could not read', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha'), `${importRow('Bravo')}\textra`].join('\n'));

  expect(await screen.findByText(/tabulátor került valamelyik mezőbe/)).toBeInTheDocument();
  expect(screen.getByText(/3\. sor/)).toBeInTheDocument();
  expect(screen.getByText('2 sor, ebből 1 hibás. Az importálás így nem futna le.')).toBeInTheDocument();
  expect(screen.queryByText(/egyetlen csapatsort sem tartalmaz/)).not.toBeInTheDocument();
});

test('the import tab sends the pasted text as it stands, and hands back the codes', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    imported: 1, rows: 1, exportTable: [['Alpha', 'C', 'a@b.com', 'x', 'id', '111-2222-333', 'creds']],
  }));
  // jsdom will not follow the download, and the click is how we see it happen.
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  renderAdmin();
  await openImportTab();
  const tsv = [HEADER, importRow('Alpha')].join('\n');

  paste(tsv);
  fireEvent.click(screen.getByText('Importálás indítása'));

  expect(await screen.findByText('1 csapat importálva')).toBeInTheDocument();
  expect(importTeams).toHaveBeenCalledWith(tsv, undefined);
  expect(screen.getByText('1 sorból 1 csapat importálva.')).toBeInTheDocument();
  // Unasked for: it is the only copy of the join codes the import generated.
  expect(download).toHaveBeenCalledOnce();
});

/** An import that works, so a test can go on to what happens after one. */
const importAlpha = () => vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
  imported: 1, rows: 1, exportTable: [['Alpha', 'C', 'a@b.com', 'x', 'id', '111-2222-333', 'creds']],
}));

// The table those codes are in is the page's, not the tab's: no screen here
// shows a join code, and the first thing an organiser does after an import is
// go and look at the teams that just landed — which unmounts the tab.
test('the join codes stay downloadable after a look at the teams tab', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([alpha]);
  importAlpha();
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  renderAdmin();
  await openImportTab();
  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(await screen.findByText('Belépőkódok letöltése újra')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Csapatok'));
  await openImportTab();
  fireEvent.click(await screen.findByText('Belépőkódok letöltése újra'));

  // The import's own download, then this one: the same table both times.
  expect(download).toHaveBeenCalledTimes(2);
});

// The teams are written by the time the download is attempted, so a download
// that fails must not take the codes with it: this button is the only other
// copy, and handing the table over after the download meant a throw lost it.
test('the join codes survive a download the browser refuses', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  importAlpha();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    throw new Error('download blocked');
  });
  renderAdmin();
  await openImportTab();
  paste([HEADER, importRow('Alpha')].join('\n'));

  fireEvent.click(screen.getByText('Importálás indítása'));

  expect(await screen.findByText('Belépőkódok letöltése újra')).toBeInTheDocument();
  // The import worked, and is reported as having worked: told otherwise, the
  // organiser would run it again, and the second run cannot succeed.
  expect(screen.getByText('1 csapat importálva')).toBeInTheDocument();
  expect(screen.getByText(/nem sikerült letölteni/)).toBeInTheDocument();
  expect(screen.queryByText('Váratlan hiba történt')).not.toBeInTheDocument();
});

// A blocked first download leaves the re-download button as the only way to
// those codes. Replacing the table on the next import made importing the late
// teams before pressing it the thing that lost the first batch.
test('a second import keeps the codes of the first', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    imported: 1, rows: 1, exportTable: [['Alpha', 'C', 'a@b.com', 'x', 'id-a', '111-2222-333', 'creds']],
  }));
  const saved = savedDownloads();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(await screen.findByText('Belépőkódok letöltése újra')).toBeInTheDocument();

  importTeams.mockResolvedValue(importResult({
    imported: 1, accepted: 1, rows: 2,
    exportTable: [['Bravo', 'C', 'a@b.com', 'x', 'id-b', '444-5555-666', 'creds']],
  }));
  paste([HEADER, importRow('Alpha'), importRow('Bravo')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(await screen.findByText('1 új csapat importálva, 1 már létezett')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Belépőkódok letöltése újra'));
  await waitFor(() => { expect(saved).toHaveLength(3); });
  // Both batches, not just the one that came last.
  expect(saved[2]).toContain('111-2222-333');
  expect(saved[2]).toContain('444-5555-666');
});

// The other half of that: an import's answer carries the rows it accepted as
// already there too, wherever the file itself supplied their codes — so
// re-running a registration list that has grown by one team hands back the
// whole list. Appended to what was already held, every team of the first run
// stood in the table twice, and the re-download was a file that cannot be
// imported again: `duplicate-teamname` refuses it.
test('a re-import of a grown list keeps one row per team', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const alphaRow = ['Alpha', 'C', 'a@b.com', 'x', alpha.teamId ?? '', '111-2222-333', ALPHA_CREDENTIALS];
  const importTeams = vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    imported: 1, rows: 1, exportTable: [alphaRow],
  }));
  const saved = savedDownloads();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(await screen.findByText('Belépőkódok letöltése újra')).toBeInTheDocument();

  // That download with a late team appended to it, which is how a registration
  // list grows: Alpha comes back accepted, carrying the code the file supplied.
  importTeams.mockResolvedValue(importResult({
    imported: 1, accepted: 1, rows: 2,
    exportTable: [alphaRow, ['Bravo', 'C', 'a@b.com', 'x', bravo.teamId ?? '', '444-5555-666', BRAVO_CREDENTIALS]],
  }));
  paste([HEADER, importRow('Alpha'), importRow('Bravo')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(await screen.findByText('1 új csapat importálva, 1 már létezett')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Belépőkódok letöltése újra'));
  await waitFor(() => { expect(saved).toHaveLength(3); });
  const again = parseTeamsTsv(saved[2]);
  expect(again.rows.map(row => row.teamname)).toEqual(['Alpha', 'Bravo']);
  // Which is what makes the download a backup: it goes straight back in.
  expect(again.problems.filter(problem => problem.severity === 'error')).toEqual([]);
});

// Re-uploading a registration list is how late teams are added, so a file whose
// teams are all there already is the ordinary answer, not a failure. Reported as
// one, an organiser goes looking for a fault that is not there.
test('the import tab calls a file of teams that already exist no failure', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    imported: 0, accepted: 2, rows: 2,
    problems: [
      { row: 2, column: 'Teamname', severity: 'warning', code: 'already-exists', found: 'Alpha' },
      { row: 3, column: 'Teamname', severity: 'warning', code: 'already-exists', found: 'Bravo' },
    ],
    warningCounts: { 'already-exists': 2 },
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha'), importRow('Bravo')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));

  expect(await screen.findByText('Nem került be új csapat: mind a(z) 2 már létezett.')).toBeInTheDocument();
  expect(screen.queryByText('Az importálás nem futott le, egy csapat sem került be.')).not.toBeInTheDocument();
  // Nothing new was written, so there are no codes to hand over and no file to
  // push at the organiser.
  expect(download).not.toHaveBeenCalled();
  expect(screen.queryByText('Belépőkódok letöltése újra')).not.toBeInTheDocument();
});

// The server caps the warnings it lists, so counting the rows in that list said
// "20 sor" for a re-upload of 500 — directly above the line saying the list is
// not all of them.
test('the import tab collapses repeated warnings with the count the file has', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    rows: 500,
    accepted: 500,
    problems: Array.from({ length: 20 }, (_, index) => ({
      row: index + 2, column: 'Teamname' as const, severity: 'warning' as const,
      code: 'already-exists' as const, found: `Team ${index}`,
    })),
    problemsTruncated: 480,
    warningCounts: { 'already-exists': 500 },
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, ...Array.from({ length: 500 }, (_, index) => importRow(`Team ${index}`))].join('\n'));
  fireEvent.click(screen.getByText('Ellenőrzés'));

  expect(await screen.findByText('500 sor')).toBeInTheDocument();
  expect(screen.getByText(
    '500 sor, és mind a(z) 500 csapat már létezik — nincs mit importálni.',
  )).toBeInTheDocument();
});

// The check's answer replaces the import's, and the import's is where the codes
// were. It would report every row as a team that already exists, too — which is
// the import having worked.
test('the import tab stops a check on text it has just imported', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = importAlpha();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  renderAdmin();
  await openImportTab();
  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));
  await screen.findByText('Belépőkódok letöltése újra');
  importTeams.mockClear();

  fireEvent.click(screen.getByText('Ellenőrzés'));

  expect(importTeams).not.toHaveBeenCalled();
  expect(screen.getByText('Belépőkódok letöltése újra')).toBeInTheDocument();
});

// The read failing leaves the box as it was, so without a word the pick looks
// like it simply did nothing.
test('the import tab says so when the picked file cannot be read', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams');
  renderAdmin();
  await openImportTab();
  const file = new File(['ignored'], 'teams.tsv', { type: 'text/tab-separated-values' });
  vi.spyOn(file, 'text').mockRejectedValue(new Error('A fájl nem olvasható.'));

  fireEvent.change(screen.getByTestId('importTeamsFile'), { target: { files: [file] } });

  expect(await screen.findByText('A fájl nem olvasható.')).toBeInTheDocument();
  expect(importTeams).not.toHaveBeenCalled();
});

// Only the server knows what the live teams hold, so "Ellenőrzés" is the one
// way to find out before writing anything.
test('the import tab reports what a live team blocks, without importing', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    rows: 1,
    problems: [{ row: 2, column: 'Teamname', severity: 'error', code: 'teamname-taken', found: 'Alpha' }],
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Ellenőrzés'));

  expect(await screen.findByText('Már van ilyen nevű csapat.')).toBeInTheDocument();
  expect(importTeams).toHaveBeenCalledWith(expect.any(String), { dryRun: true });
});

// The file itself is fine, so the browser has no objection to it; only the
// dry run knows the name is taken. Leaving the button live meant the check's
// own answer did not reach the one control it was run for.
test('the import tab stops the import a check has already refused', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  const importTeams = vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    rows: 1,
    problems: [{ row: 2, column: 'Teamname', severity: 'error', code: 'teamname-taken', found: 'Alpha' }],
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Ellenőrzés'));
  await screen.findByText('Már van ilyen nevű csapat.');

  importTeams.mockClear();
  fireEvent.click(screen.getByText('Importálás indítása'));
  expect(importTeams).not.toHaveBeenCalled();
});

test('the import tab reports a refused file as a failure, not a success', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    rows: 2,
    refused: true,
    problems: [{ row: 3, severity: 'error', code: 'database-refused', found: 'Teamname already exists.' }],
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha'), importRow('Bravo')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));

  expect(await screen.findByText('Az importálás nem futott le, egy csapat sem került be.')).toBeInTheDocument();
  expect(screen.getByText('Az adatbázis visszautasította ezt a sort.')).toBeInTheDocument();
});

// The answer is about the text that was sent. An edit while it is out would have
// it land on text it never saw: the old answer's problems replace the new text's
// own, and *Importálás indítása* goes live for a file the browser had just
// refused. Read-only rather than disabled, so the organiser keeps their
// selection and scroll position across a sub-second round trip.
test('the import tab takes no edit while a check is out', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  let answer: (result: ImportResultDto) => void = () => undefined;
  vi.spyOn(repo, 'importTeams')
    .mockReturnValue(new Promise<ImportResultDto>(resolve => { answer = resolve; }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Ellenőrzés'));

  await waitFor(() => { expect(screen.getByTestId('importTeamsTsv')).toHaveAttribute('readonly'); });

  answer(importResult({ rows: 1 }));

  // And hands it back the moment the answer is in.
  await waitFor(() => { expect(screen.getByTestId('importTeamsTsv')).not.toHaveAttribute('readonly'); });
});

// The server lists at most 200 problems. Counting the rows in that list would
// tell the organiser 200 of their 500 rows are bad, directly above the line
// saying the list is not all of them.
test('the import tab reports the bad rows the server counted, not the ones it listed', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockResolvedValue(importResult({
    rows: 500,
    badRows: 500,
    problemsTruncated: 300,
    problems: [{ row: 2, column: 'Category', severity: 'error', code: 'invalid-category', found: 'X' }],
  }));
  renderAdmin();
  await openImportTab();

  paste([HEADER, ...Array.from({ length: 500 }, (_, index) => importRow(`Team ${index}`, 'X'))].join('\n'));
  fireEvent.click(screen.getByText('Ellenőrzés'));

  // Waited for first: until the answer lands the summary is the browser's own,
  // which counts all 500 anyway — so asserting on it straight away would pass
  // whatever the answer then did to it.
  await screen.findByText('És további 300 probléma, amit a szerver már nem sorolt fel.');

  expect(screen.getByText('500 sor, ebből 500 hibás. Az importálás így nem futna le.')).toBeInTheDocument();
});

test('the import tab shows the request failing rather than looking like it worked', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  vi.spyOn(repo, 'importTeams').mockRejectedValue(new Error('A fájl túl nagy.'));
  renderAdmin();
  await openImportTab();

  paste([HEADER, importRow('Alpha')].join('\n'));
  fireEvent.click(screen.getByText('Importálás indítása'));

  expect(await screen.findByText('A fájl túl nagy.')).toBeInTheDocument();
  expect(screen.queryByText(/csapat importálva\.$/)).not.toBeInTheDocument();
});
