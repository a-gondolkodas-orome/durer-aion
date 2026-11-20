import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField } from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Edit from '@mui/icons-material/Edit';
import { Box, Stack } from '@mui/system';
import { DataGrid, Toolbar } from '@mui/x-data-grid';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { competitionName, editionSchoolYear, validateStartWindow } from 'schemas';
import type { CompetitionMetadata, StartWindow } from 'schemas';
import { CompetitionSummaryDto } from '../dto/TeamStateDto';
import { useExportCompetitions, useSetCompetitionWindow } from '../hooks/user-hooks';
import { downloadJson } from '../utils/download';
import { windowText, windowTimeNow } from '../utils/window-time';
import { useErrorMessage } from '../utils/error-message';

const ROUND_NAMES: Record<Extract<CompetitionMetadata, { kind: 'competition' }>['round'], string> = {
  online: 'internetes',
  local: 'helyi',
  final: 'döntő',
};

interface CompetitionRow {
  id: string;
  /// What the import's Competition column takes: the name where the
  /// competition has one, the id otherwise.
  importAs: string;
  edition: number | null;
  round: string;
  category: string;
  label: string;
  startWindow: StartWindow | null;
  /// Whether the window is one set on the admin page, not the config's.
  windowSet: boolean;
  storedIn: string;
}

const STORED_IN: Record<CompetitionSummaryDto['storedIn'], string> = {
  code: 'kód',
  database: 'adatbázis',
};

function competitionRow({ id, metadata, startWindow = null, configStartWindow = null, storedIn }: CompetitionSummaryDto):
  CompetitionRow {
  const window = {
    startWindow, windowSet: JSON.stringify(startWindow) !== JSON.stringify(configStartWindow),
    storedIn: STORED_IN[storedIn],
  };
  if (metadata.kind === 'competition') {
    return {
      id, importAs: competitionName(metadata) ?? id, edition: metadata.edition,
      round: ROUND_NAMES[metadata.round], category: metadata.category, label: metadata.label?.hu ?? '', ...window,
    };
  }
  return {
    id, importAs: id, edition: null, round: '', category: '', label: metadata.label.hu ?? metadata.label.en ?? '',
    ...window,
  };
}

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    exportButton?: ReactNode;
  }
}

/// The ticked competitions export as a bundle, which the Import/export tab
/// takes on another server.
function CompetitionsToolbar(props: { exportButton?: ReactNode }) {
  return (
    <Toolbar>
      {props.exportButton}
      <Box component="span" sx={{ fontSize: 14 }}>
        A kijelölt versenyek a feladataikkal együtt egy versenycsomagba kerülnek, amelyet egy másik szerver
        Import/export füle betölt.
      </Box>
    </Toolbar>
  );
}

/// The name a bundle of `ids` is saved under: the competition's id for one.
function bundleFileName(ids: readonly string[]): string {
  return ids.length === 1 ? `${ids[0]}.json` : `durer-competitions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
}

/// Every registered competition, newest edition first, with what the import's
/// Competition column takes for it, to copy, and its start window, to change,
/// and the ones ticked to export.
export function CompetitionTable(props: {
  competitions: CompetitionSummaryDto[],
  /// How many teams each competition has, by its id.
  teamCounts: ReadonlyMap<string, number>,
  onWindowChanged?: () => void,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<CompetitionRow | null>(null);
  const exportCompetitions = useExportCompetitions();
  const errorMessage = useErrorMessage();
  const [selection, setSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [exporting, setExporting] = useState(false);
  // Ticking the header box selects by exclusion: every row but the ones named.
  const selected = props.competitions.map(({ id }) => id)
    .filter(id => selection.ids.has(id) === (selection.type === 'include'));
  const runExport = async (ids: string[]) => {
    setExporting(true);
    try {
      downloadJson(bundleFileName(ids), JSON.stringify(await exportCompetitions(ids), null, 2));
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(`Vágólapra másolva: ${text}`, { variant: 'info' });
    } catch {
      enqueueSnackbar('A másolás nem sikerült, jelöld ki kézzel.', { variant: 'error' });
    }
  };

  // The value with a button that copies it, named for screen readers.
  const withCopy = (text: string) => (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
      <span>{text}</span>
      <IconButton size="small" aria-label={`Másolás: ${text}`} title="Másolás" onClick={() => { void copy(text); }}>
        <ContentCopy fontSize="inherit"/>
      </IconButton>
    </Stack>
  );

  return (
    <Stack sx={{ height: '600px' }} data-testid="competitionTable">
      <DataGrid
        rows={props.competitions.map(competition => ({
          ...competitionRow(competition), teams: props.teamCounts.get(competition.id) ?? 0,
        }))}
        columns={[
          {
            field: 'importAs',
            headerName: 'Competition',
            description: 'Ezt kell a csapat sorában a Competition oszlopba írni. Az azonosító is jó.',
            width: 230,
            renderCell: ({ row }: { row: CompetitionRow }) => withCopy(row.importAs),
          },
          {
            field: 'id',
            headerName: 'Azonosító',
            width: 270,
            renderCell: ({ row }: { row: CompetitionRow }) => withCopy(row.id),
          },
          {
            field: 'edition',
            headerName: 'Kiadás',
            width: 110,
            type: 'number',
            valueFormatter: (value: number | null) => value === null ? '' : `${value}. (${editionSchoolYear(value)})`,
          },
          { field: 'round', headerName: 'Forduló', width: 100 },
          { field: 'category', headerName: 'Kategória', width: 90 },
          { field: 'label', headerName: 'Címke', width: 160 },
          { field: 'teams', headerName: 'Csapatok', width: 90, type: 'number' },
          {
            field: 'storedIn',
            headerName: 'Tárolás',
            description: 'A kódban tárolt verseny csak telepítéssel változik; az adatbázisbeli az Import/export fülön '
              + 'került be.',
            width: 100,
          },
          {
            field: 'startWindow',
            headerName: 'Indítási ablak',
            description: 'Mikor kezdhet játékot a verseny egy csapata, ha nincs saját ablaka. '
              + 'A kódbeli helyett itt is megadható.',
            width: 480,
            sortable: false,
            renderCell: ({ row }: { row: CompetitionRow }) => (
              // The button first: a window with both ends is wider than the
              // column, and would push a button after it out of sight.
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                <IconButton size="small" aria-label={`Indítási ablak módosítása: ${row.importAs}`} title="Módosítás"
                  onClick={() => { setEditing(row); }}>
                  <Edit fontSize="inherit"/>
                </IconButton>
                <Box component="span" title={windowText(row.startWindow)}
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {windowText(row.startWindow)}{row.windowSet ? ' (itt megadva)' : ''}
                </Box>
              </Stack>
            ),
          },
        ]}
        initialState={{
          sorting: { sortModel: [{ field: 'edition', sort: 'desc' }] },
          pagination: { paginationModel: { pageSize: 10 } },
          // Only a practice set needs a label, and none is imported into yet.
          columns: { columnVisibilityModel: { label: false } },
        }}
        pageSizeOptions={[10, 25, 50]}
        showToolbar
        slots={{ toolbar: CompetitionsToolbar }}
        slotProps={{ toolbar: { exportButton: (
          <Button size="small" disabled={exporting || selected.length === 0}
            onClick={() => { void runExport(selected); }}>
            {selected.length === 0 ? 'Exportálás' : `${selected.length} verseny exportálása`}
          </Button>
        ) } }}
        checkboxSelection
        rowSelectionModel={selection}
        onRowSelectionModelChange={setSelection}
        disableRowSelectionOnClick
      />
      {editing !== null && <CompetitionWindowDialog competition={editing}
        onClose={(changed) => { setEditing(null); if (changed) props.onWindowChanged?.(); }}/>}
    </Stack>
  );
}


/// Sets a competition's start window in place of its config's, or returns it
/// to its config's. A team with a window of its own keeps that one.
function CompetitionWindowDialog(props: { competition: CompetitionRow, onClose: (changed: boolean) => void }) {
  const errorMessage = useErrorMessage();
  const { competition } = props;
  const setCompetitionWindow = useSetCompetitionWindow();
  const { enqueueSnackbar } = useSnackbar();
  const [opensAt, setOpensAt] = useState(competition.startWindow?.opensAt ?? '');
  const [closesAt, setClosesAt] = useState(competition.startWindow?.closesAt ?? '');
  const [error, setError] = useState<string | null>(null);
  // The current time, in the format the fields take: a placeholder to read and
  // a value to start from, since the placeholder goes once typing starts.
  const example = windowTimeNow();
  const fillNow = (field: string, set: (value: string) => void) => (
    <InputAdornment position="end">
      <Button size="small" aria-label={`${field}: most`} onClick={() => { set(windowTimeNow()); }} sx={{ textTransform: 'none' }}>Most</Button>
    </InputAdornment>
  );

  const save = async (window: { opensAt: string | null, closesAt: string | null }) => {
    try {
      await setCompetitionWindow(competition.id, window);
      enqueueSnackbar('Sikeres művelet', { variant: 'success' });
      props.onClose(true);
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
    }
  };
  const submit = () => {
    const opens = opensAt.trim();
    const closes = closesAt.trim();
    if (opens === '' || validateStartWindow({ opensAt: opens, ...(closes !== '' && { closesAt: closes }) }).length > 0) {
      setError(`A kezdet kötelező, a vége elhagyható. Mindkettő időzónás időpont, például ${example}, `
        + 'és a vége a kezdete után van.');
      return;
    }
    setError(null);
    void save({ opensAt: opens, closesAt: closes === '' ? null : closes });
  };

  return (
    <Dialog open onClose={() => { props.onClose(false); }} aria-labelledby="competition-window-title">
      <DialogTitle id="competition-window-title">Indítási ablak: {competition.importAs}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="competition-window-form" sx={{ gap: '16px', paddingTop: '8px' }}
          onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <span>
            Ebben kezdhet játékot a verseny egy csapata, ha nincs saját ablaka. Csak azt korlátozza, mikor kezdhet
            játékot: az elkezdett játék végig fut.
          </span>
          <TextField label="Kezdete" value={opensAt} placeholder={example} error={error !== null}
            slotProps={{ input: { endAdornment: fillNow('Kezdete', setOpensAt) } }}
            onChange={(event) => { setOpensAt(event.target.value); }}/>
          <TextField label="Vége (elhagyható)" value={closesAt} placeholder={example} error={error !== null}
            slotProps={{ input: { endAdornment: fillNow('Vége', setClosesAt) } }}
            helperText={error} onChange={(event) => { setClosesAt(event.target.value); }}/>
        </Stack>
      </DialogContent>
      <DialogActions>
        {competition.windowSet && <Button onClick={() => { void save({ opensAt: null, closesAt: null }); }}>
          Vissza a kódbeli ablakhoz
        </Button>}
        <Button onClick={() => { props.onClose(false); }}>Mégse</Button>
        <Button variant="contained" type="submit" form="competition-window-form">Mentés</Button>
      </DialogActions>
    </Dialog>
  );
}
