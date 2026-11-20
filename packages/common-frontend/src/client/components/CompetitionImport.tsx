import { ChangeEvent, useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useImportCompetitions } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';

/// Where competitions and their problems come in from a bundle file: the JSON
/// of a bank file's two maps. The server writes all of it or none of it, so
/// the messages below are all there is to fix before trying again.
export function CompetitionImport(props: { onImported: () => void }) {
  const theme = useTheme();
  const importCompetitions = useImportCompetitions();
  const { enqueueSnackbar } = useSnackbar();
  const errorMessage = useErrorMessage();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setErrors([]);
    // Picking the same file again, once fixed, should still fire a change.
    event.target.value = '';
  };

  const runImport = async (picked: File) => {
    setBusy(true);
    try {
      let bundle: unknown;
      try {
        bundle = JSON.parse(await picked.text());
      } catch {
        setErrors([`A fájl nem érvényes JSON: ${picked.name}`]);
        return;
      }
      const answer = await importCompetitions(bundle);
      setErrors(answer.errors);
      if (!answer.written) {
        enqueueSnackbar('Semmi sem került be.', { variant: 'error' });
        return;
      }
      setFile(null);
      props.onImported();
      enqueueSnackbar(`${answer.competitions.length} verseny és ${answer.problems.length} feladat került be.`,
        { variant: 'success' });
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack sx={{ gap: '16px' }}>
      <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Versenyek importálása</Stack>
      <Stack sx={{ fontSize: 14 }}>
        Versenycsomag: .json fájl a versenyekkel és a feladataikkal. Vagy minden bekerül belőle, vagy semmi: egy hibás
        verseny vagy feladat, vagy egy már létező azonosító esetén semmi. A kódban már ugyanígy meglévő feladat nem
        hiba: az exportált csomag a kódbeli feladatokat is hozza, ezek nem kerülnek be újra. A bekerült versenyek a
        Versenyek fülön „adatbázis” tárolásúak, és rögtön lehet csapatokat importálni beléjük.
      </Stack>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Button variant="outlined" color="primary" component="label" disabled={busy}>
          Fájl kiválasztása
          <input type="file" accept=".json" hidden data-testid="importCompetitionsFile" onChange={onPick}/>
        </Button>
        <Stack>{file?.name ?? 'Nincs kiválasztott fájl.'}</Stack>
        <Button
          variant="contained"
          color="primary"
          disabled={busy || file === null}
          onClick={() => { if (file !== null) void runImport(file); }}
        >
          {busy ? 'Importálás…' : 'Versenyek importálása'}
        </Button>
      </Stack>
      {errors.length > 0 && (
        <Stack sx={{ gap: '4px' }}>
          <Stack sx={{ fontSize: 14 }}>Hibák:</Stack>
          <Stack
            component="ul"
            data-testid="importCompetitionsErrors"
            sx={{ margin: 0, maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: 13 }}
          >
            {errors.map((error, index) => (
              <li key={index} style={{ color: theme.palette.error.main }}>{error}</li>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
