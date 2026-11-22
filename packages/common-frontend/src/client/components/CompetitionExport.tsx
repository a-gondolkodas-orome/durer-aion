import { useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useExportCompetitions } from '../hooks/user-hooks';
import { download } from '../utils/download';
import { useErrorMessage } from '../utils/error-message';

/// The name a bundle is saved under, as scripts/admin.py names one: the UTC
/// time to the second.
function bundleFileName(): string {
  return `durer-competitions-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
}

/// The bundle of every competition and problem the database holds, saved as
/// the file `CompetitionImport` takes.
export function CompetitionExport() {
  const exportCompetitions = useExportCompetitions();
  const { enqueueSnackbar } = useSnackbar();
  const errorMessage = useErrorMessage();
  const [busy, setBusy] = useState(false);

  const runExport = async () => {
    setBusy(true);
    try {
      download(bundleFileName(), JSON.stringify(await exportCompetitions(), null, 2), 'application/json');
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack sx={{ gap: '16px' }}>
      <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Versenyek exportálása</Stack>
      <Stack sx={{ fontSize: 14 }}>
        Az adatbázisban tárolt összes verseny és feladat egy versenycsomagba kerül, amelyet egy másik szerver
        Versenyek importálása része betölt. A kódban lévő feladatokra a csomag csak hivatkozik.
      </Stack>
      <Stack sx={{ flexDirection: 'row' }}>
        <Button variant="outlined" color="primary" disabled={busy} onClick={() => { void runExport(); }}>
          Az adatbázis exportálása
        </Button>
      </Stack>
    </Stack>
  );
}
