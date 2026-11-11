import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { competitionName, editionSchoolYear } from 'schemas';
import type { CompetitionMetadata } from 'schemas';
import { CompetitionSummaryDto } from '../dto/TeamStateDto';

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
}

function competitionRow({ id, metadata }: CompetitionSummaryDto): CompetitionRow {
  if (metadata.kind === 'competition') {
    return {
      id, importAs: competitionName(metadata) ?? id, edition: metadata.edition,
      round: ROUND_NAMES[metadata.round], category: metadata.category, label: metadata.label?.hu ?? '',
    };
  }
  return { id, importAs: id, edition: null, round: '', category: '', label: metadata.label.hu ?? metadata.label.en ?? '' };
}

/// Every registered competition, newest edition first, with what the import's
/// Competition column takes for it, to copy.
export function CompetitionTable(props: { competitions: CompetitionSummaryDto[] }) {
  const { enqueueSnackbar } = useSnackbar();
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(`Vágólapra másolva: ${text}`, { variant: 'info' });
    } catch {
      enqueueSnackbar('A másolás nem sikerült, jelöld ki kézzel.', { variant: 'error' });
    }
  };

  return (
    <Stack sx={{ height: '600px' }} data-testid="competitionTable">
      <DataGrid
        rows={props.competitions.map(competitionRow)}
        columns={[
          {
            field: 'importAs',
            headerName: 'Competition oszlopba',
            description: 'Ezt kell a csapat sorában a Competition oszlopba írni. Az azonosító is jó.',
            width: 230,
            renderCell: ({ row }: { row: CompetitionRow }) => (
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <span>{row.importAs}</span>
                <Button size="small" onClick={() => { void copy(row.importAs); }}>Másolás</Button>
              </Stack>
            ),
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
          { field: 'label', headerName: 'Név', width: 160 },
          { field: 'id', headerName: 'Azonosító', width: 230 },
        ]}
        initialState={{
          sorting: { sortModel: [{ field: 'edition', sort: 'desc' }] },
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
      />
    </Stack>
  );
}
