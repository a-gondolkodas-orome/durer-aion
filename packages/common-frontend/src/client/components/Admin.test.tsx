// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// `toBeInTheDocument` and friends.
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@mui/material/styles';
import { ClientRepoProvider, MockClientRepository } from '../api-repository-interface';
import { DeletedTeamDto, TeamModelDto } from '../dto/TeamStateDto';
import { Layout } from './Layout';
import { Admin } from './Admin';

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
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

test('the archive tab says so when it is empty', async () => {
  vi.spyOn(repo, 'getAll').mockResolvedValue([]);
  renderAdmin();

  await openDeletedTab();

  expect(await screen.findByText('Nincs törölt csapat.')).toBeInTheDocument();
});
