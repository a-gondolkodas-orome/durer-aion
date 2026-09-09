import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useDeleted, useRestoreBatch, useRestoreTeam } from '../hooks/user-hooks';
import { ConfirmDialogInterface } from './ConfirmDialog';
import { csvToolbar } from './CsvToolbar';
import { DeletedBatch, batchesOf, deletedTeamsToImportTsv } from '../utils/deleted-teams';

const DeletedTeamsToolbar = csvToolbar('durer-torolt-csapatok');

// Hands the browser a file to save. The viewer's own download, so no server
// round trip; the object URL is released once the click has taken it.
function downloadTsv(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Batches shown at once. Every team deleted before "delete all" was one
// request carries its own timestamp, so a past year's archive is a thousand
// one-team batches, and a grid for each of them at once is what made the tab
// crawl. The newest ten are what an organiser comes for; the rest are a click
// away, ten at a time.
const BATCHES_PER_PAGE = 10;

/// The archive, one section per batch — the rows one "delete all" archived
/// together, or one team deleted on its own. `onRestored` fires whenever a
/// team is live again, since the live list this page's other tab shows is
/// stale from that moment.
export function DeletedTeams(props: { setConfirmDialog: Dispatch<ConfirmDialogInterface | null>, onRestored: () => void }) {
  const getDeleted = useDeleted();
  const { data, mutate } = useSWR('users/deleted', getDeleted);
  const [shown, setShown] = useState(BATCHES_PER_PAGE);

  if (!data) {
    return null;
  }
  if (data.length === 0) {
    return <Stack sx={{ padding: '10px' }}>Nincs törölt csapat.</Stack>;
  }
  const restored = async () => {
    await mutate();
    props.onRestored();
  };
  const batches = batchesOf(data);
  const visible = batches.slice(0, shown);
  const hidden = batches.length - visible.length;
  return (
    <Stack sx={{ gap: '24px', padding: '10px 0' }} data-testid="deletedTeamsRoot">
      {visible.map(batch => (
        <Batch key={batch.deletedAt} batch={batch} setConfirmDialog={props.setConfirmDialog} onRestored={restored}/>
      ))}
      {hidden > 0 && (
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <Stack>A(z) {batches.length} törlésből {visible.length} látszik.</Stack>
          <Button variant="outlined" color="primary" onClick={() => setShown(count => count + BATCHES_PER_PAGE)}>
            További {Math.min(BATCHES_PER_PAGE, hidden)} betöltése
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

function Batch(props: { batch: DeletedBatch, setConfirmDialog: Dispatch<ConfirmDialogInterface | null>, onRestored: () => Promise<void> }) {
  const restoreTeam = useRestoreTeam();
  const restoreBatch = useRestoreBatch();
  const { enqueueSnackbar } = useSnackbar();
  const { batch } = props;
  const when = new Date(batch.deletedAt).toLocaleString('hu-HU');

  const restoreOne = (deletionId: number, teamName: string) => {
    props.setConfirmDialog({
      text: `Biztosan visszaállítod a(z) ${teamName} csapatot?`,
      confirm: async () => {
        try {
          await restoreTeam(deletionId);
          enqueueSnackbar(`${teamName} visszaállítva`, { variant: 'success' });
        } catch (e: unknown) {
          enqueueSnackbar(e instanceof Error ? e.message : 'Váratlan hiba történt', { variant: 'error' });
        } finally {
          await props.onRestored();
        }
      },
    });
  };

  const restoreAll = () => {
    props.setConfirmDialog({
      text: `Biztosan visszaállítod mind a(z) ${batch.teams.length} csapatot, amelyeket ekkor töröltek: ${when}?`,
      confirm: async () => {
        try {
          const result = await restoreBatch(batch.deletedAt);
          // A conflict is a team a live one blocks; the names say which, and
          // the rows stay in the archive until that is resolved.
          if (result.conflicts.length === 0) {
            enqueueSnackbar(`${result.restored.length} csapat visszaállítva`, { variant: 'success' });
          } else {
            enqueueSnackbar(
              `${result.restored.length} csapat visszaállítva, ${result.conflicts.length} ütközik élő csapattal: ${result.conflicts.join(', ')}`,
              { variant: 'warning' },
            );
          }
        } catch (e: unknown) {
          enqueueSnackbar(e instanceof Error ? e.message : 'Váratlan hiba történt', { variant: 'error' });
        } finally {
          await props.onRestored();
        }
      },
    });
  };

  return (
    <Stack sx={{ gap: '8px' }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Stack sx={{ fontSize: 18 }}>Törölve: {when} — {batch.teams.length} csapat</Stack>
        <Button variant="contained" color="primary" onClick={restoreAll}>
          A csoport visszaállítása
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => downloadTsv(`durer-torolt-csapatok-${batch.deletedAt}.tsv`, deletedTeamsToImportTsv(batch.teams))}
        >
          Letöltés import-TSV-ként
        </Button>
      </Stack>
      <DataGrid
        columns={[
          { field: 'teamName', headerName: 'Csapatnév', width: 200, editable: false },
          { field: 'category', headerName: 'Kategória', width: 100, editable: false },
          { field: 'pageState', headerName: 'Állapot', width: 150, editable: false },
          { field: 'relayMatchState', headerName: 'Relay', width: 120, editable: false },
          { field: 'strategyMatchState', headerName: 'Strategy', width: 120, editable: false },
          { field: 'other', headerName: 'Egyéb', width: 250, editable: false },
          {
            field: 'restore',
            width: 170,
            headerName: '',
            disableExport: true,
            renderCell: (renderData) => (
              <Button color="primary" variant="contained" onClick={() => restoreOne(renderData.row.deletionId, renderData.row.teamName)}>
                Visszaállítás
              </Button>
            ),
          },
        ]}
        rows={batch.teams.map(team => ({
          id: team.deletionId,
          relayMatchState: team.relayMatch.state,
          strategyMatchState: team.strategyMatch.state,
          ...team,
        }))}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          columns: { columnVisibilityModel: { other: false } },
        }}
        pageSizeOptions={[10, 25, 50]}
        showToolbar
        slots={{ toolbar: DeletedTeamsToolbar }}
        sx={{ height: 'auto' }}
      />
    </Stack>
  );
}
