import { ChangeEvent, useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { TeamImportResultDto } from '../dto/TeamStateDto';
import { useImportTeams } from '../hooks/user-hooks';
import { downloadTsv } from '../utils/download';

// The importer's columns, in its order (`expected_header` in the backend's
// team_import.ts), so the file saved here can be imported again as it is.
const IMPORT_HEADER = ['Teamname', 'Category', 'Email', 'Other', 'ID', 'Login Code', 'Credentials'];

function codesTsv(rows: string[][]): string {
  return [IMPORT_HEADER, ...rows].map(row => row.join('\t')).join('\n') + '\n';
}

function codesFileName(): string {
  return `durer-csapatok-${new Date().toISOString().replace(/[:.]/g, '-')}.tsv`;
}

/// The team import for an organiser with the admin password and a browser, on
/// the same route and the same importer as `npm run teams:import`. Rows are
/// imported one by one, so a file with bad rows still loads the good ones.
export function ImportTeams(props: { onImported: () => void }) {
  const theme = useTheme();
  const importTeams = useImportTeams();
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TeamImportResultDto | null>(null);
  // Every import's codes, not the last one's: a second file imported before
  // the first one's codes were saved must not be what loses them.
  const [codes, setCodes] = useState<string[][]>([]);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    // Picking the same file again should still fire a change.
    event.target.value = '';
  };

  const runImport = async (picked: File) => {
    setBusy(true);
    try {
      const answer = await importTeams(picked);
      setResult(answer);
      setFile(null);
      if (answer.successful === 0) {
        enqueueSnackbar('Egy csapat sem került be.', { variant: 'error' });
        return;
      }
      const held = [...codes, ...answer.export_table];
      setCodes(held);
      props.onImported();
      enqueueSnackbar(answer.failed === 0
        ? `${answer.successful} csapat importálva`
        : `${answer.successful} csapat importálva, ${answer.failed} sor hibás`,
      { variant: answer.failed === 0 ? 'success' : 'warning' });
      // Unasked for: the answer is the only copy of the generated join codes.
      // Its own catch, since the teams are in by now and a failed download is
      // not a failed import.
      try {
        downloadTsv(codesFileName(), codesTsv(held));
      } catch {
        enqueueSnackbar('A csapatok bekerültek, de a belépőkódokat nem sikerült letölteni. '
          + 'Használd a „Belépőkódok letöltése” gombot.', { variant: 'warning' });
      }
    } catch (e: unknown) {
      enqueueSnackbar(e instanceof Error ? e.message : 'Váratlan hiba történt', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // The narration's per-row "Generating…" lines say nothing an organiser acts
  // on, and the dashed lines it closes each failed row with are a terminal's
  // separators, not messages.
  const messages = result === null ? [] : result.logs.value
    .map((value, index) => ({ value, sev: result.logs.sev[index] }))
    .filter(message => message.sev !== 'info' && !/^-+$/.test(message.value.trim()));

  return (
    <Stack sx={{ gap: '16px', padding: '10px' }}>
      <Stack sx={{ fontSize: 14 }}>
        Tabulátorral elválasztott .tsv fájl, ebben az oszlopsorrendben: Teamname, Category, Email, Other, ID,
        Login Code, Credentials. Az utolsó hármat üresen hagyva a szerver generálja őket. A csapatok egyenként
        kerülnek be: a hibás sorok kimaradnak, a többi bekerül. A belépőkódokat a sikeres importálás után
        letöltött fájl tartalmazza.
      </Stack>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Button variant="outlined" color="primary" component="label" disabled={busy}>
          Fájl kiválasztása
          <input type="file" accept=".tsv" hidden data-testid="importTeamsFile" onChange={onPick}/>
        </Button>
        <Stack>{file?.name ?? 'Nincs kiválasztott fájl.'}</Stack>
        <Button
          variant="contained"
          color="primary"
          disabled={busy || file === null}
          onClick={() => { if (file !== null) void runImport(file); }}
        >
          {busy ? 'Importálás…' : 'Importálás indítása'}
        </Button>
        {codes.length > 0 && (
          <Button variant="outlined" color="primary" onClick={() => { downloadTsv(codesFileName(), codesTsv(codes)); }}>
            Belépőkódok letöltése
          </Button>
        )}
      </Stack>
      {result !== null && (
        <Stack data-testid="importTeamsSummary">
          {`${result.successful} csapat importálva, ${result.failed} sor hibás.`}
        </Stack>
      )}
      {messages.length > 0 && (
        <Stack sx={{ gap: '4px' }}>
          <Stack sx={{ fontSize: 14 }}>A szerver hibaüzenetei és figyelmeztetései (angolul):</Stack>
          <Stack
            component="ul"
            sx={{ margin: 0, maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: 13 }}
          >
            {messages.map((message, index) => (
              <li
                key={index}
                style={{ color: message.sev === 'error' ? theme.palette.error.main : theme.palette.text.primary }}
              >
                {message.value}
              </li>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
