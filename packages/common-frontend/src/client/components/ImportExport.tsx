import { ChangeEvent, useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import useSWR from 'swr';
import { TeamImportResultDto, TeamModelDto } from '../dto/TeamStateDto';
import { useCompetitions, useImportTeams } from '../hooks/user-hooks';
import { downloadTsv } from '../utils/download';
import { CompetitionTable } from './CompetitionTable';
import { InfoTip } from './InfoTip';
import { joinCodesFileName, teamTsvRow, teamsTsv } from '../utils/team-tsv';

function summary(result: TeamImportResultDto): string {
  const existing = result.existing > 0 ? `, ${result.existing} már szerepelt` : '';
  return `${result.successful} csapat importálva${existing}, ${result.failed} sor hibás`;
}

/// Where teams come in and where their secrets go out. The import runs on the
/// same route and the same importer as `npm run teams:import`, row by row, so
/// a file with bad rows still loads the good ones. Each row names its team's
/// competition, so one file can fill the C, D and E competitions of a round at
/// once; the table beside it says what to write for each. The export is every
/// team with its join code and credentials, in the import's own format: the one
/// download on the admin page that carries a login secret.
export function ImportExport(props: { teams: TeamModelDto[], onImported: () => void }) {
  const theme = useTheme();
  const importTeams = useImportTeams();
  const getCompetitions = useCompetitions();
  const { data: competitions } = useSWR('team/admin/competitions', getCompetitions);
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
        // A file whose every team is already there is a re-run, not a failure.
        if (answer.failed === 0 && answer.existing > 0) {
          enqueueSnackbar(`Nem került be új csapat: mind a(z) ${answer.existing} már szerepelt.`, { variant: 'info' });
        } else {
          enqueueSnackbar('Egy csapat sem került be.', { variant: 'error' });
        }
        return;
      }
      setCodes(held => [...held, ...answer.export_table]);
      props.onImported();
      enqueueSnackbar(summary(answer), { variant: answer.failed === 0 ? 'success' : 'warning' });
    } catch (e: unknown) {
      enqueueSnackbar(e instanceof Error ? e.message : 'Váratlan hiba történt', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const messages = result === null ? [] : result.logs.value
    .map((value, index) => ({ value, sev: result.logs.sev[index] }));

  return (
    <Stack sx={{ gap: '32px', padding: '10px' }}>
      <Stack sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: '32px' }}>
        <Stack sx={{ gap: '16px', flex: '1 1 0', minWidth: 0 }}>
          <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Importálás</Stack>
          <ImportHelp/>
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
              {`${summary(result)}.`}
            </Stack>
          )}
          {messages.length > 0 && (
            <Stack sx={{ gap: '4px' }}>
              <Stack sx={{ fontSize: 14 }}>Hibák és figyelmeztetések:</Stack>
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
        <Stack sx={{ gap: '16px', flex: '1 1 0', minWidth: 0 }}>
          <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Exportálás</Stack>
          <Stack sx={{ fontSize: 14 }}>
            Az összes csapat a belépőkódjával és a credentials-szel, az importálás oszlopaival. A fájl titkos
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
      </Stack>
      <Stack sx={{ gap: '16px', minWidth: 0 }}>
        <Stack component="h3" sx={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Versenyek</Stack>
        <CompetitionTable competitions={competitions ?? []}/>
      </Stack>
    </Stack>
  );
}

/// What the import takes, column by column: what an organiser needs at a
/// glance is in sight, the rest behind an ⓘ beside its column.
function ImportHelp() {
  return (
    <Stack sx={{ fontSize: 14, gap: '8px', '& ul': { margin: 0, paddingLeft: '20px' }, '& li': { margin: '4px 0' } }}>
      <span>
        Tabulátorral elválasztott .tsv fájl, az első sora a fejléc. Az oszlopok sorrendje tetszőleges, az ismeretlenek
        kimaradnak.
      </span>
      <span>Kötelező oszlopok:</span>
      <ul>
        <li><b>Teamname</b></li>
        <li>
          <b>Competition</b>: a csapat versenye, a lenti táblázat szerint, például 20 online C
          <InfoTip label="Competition">
            A verseny neve vagy azonosítója. Soronként más lehet, így egy fájlban több verseny csapatai is lehetnek.
          </InfoTip>
        </li>
      </ul>
      <span>Elhagyható vagy üresen hagyható oszlopok:</span>
      <ul>
        <li><b>Email</b>, <b>Other</b></li>
        <li>
          <b>ID</b>, <b>Login Code</b>, <b>Credentials</b>: üresen a szerver generálja
        </li>
        <li>
          <b>Opens At</b>, <b>Closes At</b>: a csapat saját indítási ablaka a versenyé helyett
          <InfoTip label="Opens At, Closes At">
            Időzónás időpont, például 2026-11-20T15:00+01:00; a Closes At elhagyható. Tesztkódnak tág ablak való, például
            2001-től 2099-ig, egy később író csapatnak a saját napja. Csak azt korlátozza, mikor kezdhet játékot: az elkezdett játék
            végig fut.
          </InfoTip>
        </li>
      </ul>
      <span>
        A csapatok egyenként kerülnek be: a hibás sorok kimaradnak, a többi bekerül. Az itt importált csapatok
        belépőkódjait az importálás után megjelenő gomb adja, az összes csapatét az Exportálás rész.
      </span>
    </Stack>
  );
}
