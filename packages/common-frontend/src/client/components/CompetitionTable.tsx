import { IconButton } from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Edit from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import { Box, Stack } from '@mui/system';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { competitionName, editionSchoolYear } from 'schemas';
import type { CompetitionMetadata, StartWindow } from 'schemas';
import { CompetitionSummaryDto } from '../dto/TeamStateDto';
import { windowText } from '../utils/window-time';

export const ROUND_NAMES: Record<Extract<CompetitionMetadata, { kind: 'competition' }>['round'], string> = {
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

/// Where a competition's own page is (CompetitionPage.tsx): what `adminPath`
/// in Main.tsx reads back.
export function competitionPath(competitionId: string): string {
  return `/admin/verseny/${encodeURIComponent(competitionId)}`;
}

/// The query parameter the edit page leaves for the competition's page, to
/// say the change it was opened by is saved.
export const SAVED_PARAM = 'mentve';

/// Where a competition's edit page is (CompetitionEditPage.tsx).
export function competitionEditPath(competitionId: string): string {
  return `${competitionPath(competitionId)}/edit`;
}

/// An eye icon opening the competition's own page.
export function CompetitionPageLink(props: { id: string, title: string }) {
  return (
    <IconButton size="small" href={competitionPath(props.id)} aria-label={`Megtekintés: ${props.title}`} title="Megtekintés">
      <Visibility fontSize="inherit"/>
    </IconButton>
  );
}

/// What the admin page calls a competition: its name where it has one, else
/// its label, else its id.
export function competitionTitle({ id, metadata }: Pick<CompetitionSummaryDto, 'id' | 'metadata'>): string {
  return competitionName(metadata) ?? (metadata.kind === 'other' ? metadata.label.hu ?? metadata.label.en : undefined) ?? id;
}

/// Every registered competition, newest edition first, with what the import's
/// Competition column takes for it, to copy, and its start window, with a
/// link to change it on the competition's edit page.
export function CompetitionTable(props: {
  competitions: CompetitionSummaryDto[],
  /// How many teams each competition has, by its id.
  teamCounts: ReadonlyMap<string, number>,
}) {
  const { enqueueSnackbar } = useSnackbar();
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
            field: 'open',
            headerName: '',
            width: 56,
            sortable: false,
            renderCell: ({ row }: { row: CompetitionRow }) => <CompetitionPageLink id={row.id} title={row.importAs}/>,
          },
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
              + 'A verseny szerkesztőoldalán módosítható, a kódban tárolt versenyé is.',
            width: 480,
            sortable: false,
            renderCell: ({ row }: { row: CompetitionRow }) => (
              // The button first: a window with both ends is wider than the
              // column, and would push a button after it out of sight.
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                <IconButton size="small" aria-label={`Indítási ablak módosítása: ${row.importAs}`} title="Módosítás"
                  href={competitionEditPath(row.id)}>
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
        disableRowSelectionOnClick
      />
    </Stack>
  );
}

