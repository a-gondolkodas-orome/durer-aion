import { ChangeEvent, useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { AdminTeamDto, TeamImportResultDto } from '../dto/TeamStateDto';
import { useImportTeams } from '../hooks/user-hooks';
import { downloadTsv } from '../utils/download';
import { joinCodesFileName, teamTsvRow, teamsTsv } from '../utils/team-tsv';

/// Where teams come in and where their secrets go out. The import runs on the
/// same route and the same importer as `npm run teams:import`, row by row, so
/// a file with bad rows still loads the good ones. The export is every team
/// with its join code and credentials, in the import's own format: the one
/// download on the admin page that carries a login secret.
export function ImportExport(props: { teams: AdminTeamDto[], onImported: () => void }) {
  const theme = useTheme();
  const importTeams = useImportTeams();
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TeamImportResultDto | null>(null);
  // Every import's codes, not the last one's, so one file holds the teams this
  // page imported — late teams' codes to mail without everyone else's.
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
      setCodes(held => [...held, ...answer.export_table]);
      props.onImported();
      enqueueSnackbar(answer.failed === 0
        ? `${answer.successful} csapat importálva`
        : `${answer.successful} csapat importálva, ${answer.failed} sor hibás`,
      { variant: answer.failed === 0 ? 'success' : 'warning' });
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
      <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Importálás</Stack>
      <Stack sx={{ fontSize: 14 }}>
        Tabulátorral elválasztott .tsv fájl, ebben az oszlopsorrendben: Teamname, Category, Email, Other, ID,
        Login Code, Credentials. Az Email és az Other üresen hagyható, az utolsó hármat üresen hagyva a szerver
        generálja őket. A csapatok egyenként kerülnek be: a hibás sorok kimaradnak, a többi bekerül.
        Az itt importált csapatok belépőkódjait az importálás után megjelenő gomb adja, az összes csapatét lent az
        Exportálás rész.
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
          <Button variant="contained" color="primary" onClick={() => { downloadTsv(joinCodesFileName(), teamsTsv(codes)); }}>
            Az importáltak belépőkódjainak letöltése
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
      <Stack component="h3" sx={{ margin: '16px 0 0', fontSize: 18, fontWeight: 500 }}>Exportálás</Stack>
      <Stack sx={{ fontSize: 14 }}>
        Az összes csapat a belépőkódjával és a credentials-szel, az importálás oszlopsorrendjében. A fájl titkos
        adatokat tartalmaz: aki egy csapat belépőkódját ismeri, beléphet a csapat nevében.
      </Stack>
      <Stack sx={{ flexDirection: 'row' }}>
        <Button
          variant="outlined"
          color="primary"
          disabled={props.teams.length === 0}
          onClick={() => { downloadTsv(joinCodesFileName(), teamsTsv(props.teams.map(teamTsvRow))); }}
        >
          {`Mind a(z) ${props.teams.length} csapat letöltése belépőkódokkal`}
        </Button>
      </Stack>
    </Stack>
  );
}
