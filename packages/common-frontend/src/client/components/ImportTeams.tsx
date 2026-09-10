import { ChangeEvent, useMemo, useState } from 'react';
import { Stack } from '@mui/system';
import { Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { TeamTsvProblem, TeamTsvProblemCode, parseTeamsTsv, teamsToImportTsv } from 'schemas';
import { ImportResultDto } from '../dto/TeamStateDto';
import { useImportTeams } from '../hooks/user-hooks';
import { downloadTsv } from '../utils/download';

// The codes the parser reports, worded for an organiser. The rule lives in
// `schemas` and the wording here, so the command line can say the same things
// in English without either language reaching the other's caller.
const PROBLEM_TEXT: Record<TeamTsvProblemCode, string> = {
  'header-mismatch': 'A fejléc nem a megszokott. Ez általában nem baj: az importálás oszlopsorrend szerint olvas.',
  'no-rows': 'A fájl egyetlen csapatsort sem tartalmaz.',
  'wrong-column-count': 'Több oszlop van a sorban, mint a formátumban — valószínűleg tabulátor került valamelyik mezőbe.',
  'empty-teamname': 'Hiányzik a csapatnév.',
  'teamname-too-long': 'A csapatnév túl hosszú (legfeljebb 255 karakter).',
  'invalid-category': 'A kategória nem C, D vagy E.',
  'email-too-long': 'Az e-mail cím túl hosszú (legfeljebb 255 karakter).',
  'other-missing': 'Az „Other” mező üres. Ez alapján lehet később azonosítani a csapatot: nevek, iskola, e-mail címek.',
  'other-too-long': 'Az „Other” mező túl hosszú (legfeljebb 700 karakter).',
  'invalid-team-id': 'Az ID nem érvényes UUIDv4.',
  'invalid-join-code': 'A belépőkód nem 111-2222-333 alakú.',
  'invalid-credentials': 'A credentials nem érvényes UUID.',
  'duplicate-teamname': 'Ez a csapatnév kétszer szerepel a fájlban.',
  'duplicate-team-id': 'Ez az ID kétszer szerepel a fájlban.',
  'duplicate-join-code': 'Ez a belépőkód kétszer szerepel a fájlban.',
  'teamname-taken': 'Már van ilyen nevű csapat.',
  'team-id-taken': 'Már van ilyen ID-jú csapat.',
  'join-code-taken': 'Már van ilyen belépőkódú csapat.',
  'database-refused': 'Az adatbázis visszautasította ezt a sort.',
};

// Above this many warnings of one kind, the rows say the same thing and only
// the count is news — a file with no "Other" column is one warning per team.
const COLLAPSE_WARNINGS_FROM = 5;

interface ProblemRow {
  id: number;
  where: string;
  column: string;
  message: string;
  found: string;
  severity: TeamTsvProblem['severity'];
}

function describe(problem: TeamTsvProblem): string {
  const first = problem.otherRow === undefined ? '' : ` Először a(z) ${problem.otherRow}. sorban.`;
  return PROBLEM_TEXT[problem.code] + first;
}

/** The problems as grid rows: errors one by one, since each is a line to go and
 * fix, and repeated warnings as one row with a count. */
function problemRows(problems: TeamTsvProblem[]): ProblemRow[] {
  const row = (problem: TeamTsvProblem, id: number): ProblemRow => ({
    id,
    where: problem.row === 0 ? 'A fájl' : `${problem.row}. sor`,
    column: problem.column ?? '',
    message: describe(problem),
    found: problem.found ?? '',
    severity: problem.severity,
  });

  const errors = problems.filter(problem => problem.severity === 'error');
  const byCode = new Map<TeamTsvProblemCode, TeamTsvProblem[]>();
  for (const warning of problems.filter(problem => problem.severity === 'warning')) {
    byCode.set(warning.code, [...byCode.get(warning.code) ?? [], warning]);
  }

  const rows = errors.map(row);
  for (const group of byCode.values()) {
    if (group.length < COLLAPSE_WARNINGS_FROM) {
      rows.push(...group.map(row));
    } else {
      rows.push({ ...row(group[0], 0), where: `${group.length} sor`, column: '', found: '' });
    }
  }
  return rows.map((entry, id) => ({ ...entry, id }));
}

function exportFileName(): string {
  return `durer-csapatok-${new Date().toISOString().replace(/[:.]/g, '-')}.tsv`;
}

/// The team import: a TSV picked or pasted, checked, then loaded as one file.
///
/// The command line does the same job (`npm run teams:import`), and stays the
/// way a deploy is seeded, since it needs only DATABASE_URL. This is the path
/// for an organiser with the admin password and a browser: no shell on the
/// competition host, and the generated join codes come back as a download
/// rather than a file left on the server.
///
/// `onImported` fires when teams are live, since the list the page's other tab
/// shows is stale from that moment.
export function ImportTeams(props: { onImported: () => void }) {
  const importTeams = useImportTeams();
  const { enqueueSnackbar } = useSnackbar();
  const [tsv, setTsv] = useState('');
  const [result, setResult] = useState<ImportResultDto | null>(null);
  const [busy, setBusy] = useState<'check' | 'import' | null>(null);

  // What the browser can tell on its own. The server checks the same rules
  // again — this only makes the common mistakes instant.
  const local = useMemo(() => parseTeamsTsv(tsv), [tsv]);

  // The server's answer once there is one, since it knows about live teams too,
  // and it is about this text: any edit drops it.
  const problems = result?.problems ?? (tsv.trim() === '' ? [] : local.problems);
  const truncated = result?.problemsTruncated ?? 0;
  const errorCount = problems.filter(problem => problem.severity === 'error').length;
  const imported = result !== null && result.imported > 0;

  const edited = (text: string) => {
    setTsv(text);
    setResult(null);
  };

  const failed = (e: unknown) =>
    enqueueSnackbar(e instanceof Error ? e.message : 'Váratlan hiba történt', { variant: 'error' });

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Picking the same file twice should read it twice, and the input only
    // fires on a change of value.
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    edited(text);
    await check(text);
  };

  const check = async (text: string) => {
    if (text.trim() === '') return;
    setBusy('check');
    try {
      setResult(await importTeams(text, { dryRun: true }));
    } catch (e: unknown) {
      failed(e);
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    setBusy('import');
    try {
      const answer = await importTeams(tsv);
      setResult(answer);
      if (answer.imported === 0) {
        enqueueSnackbar('Az importálás nem futott le, egy csapat sem került be.', { variant: 'error' });
        return;
      }
      // Handed over without being asked for: this is the only copy of the join
      // codes the import generated, and a closed tab means digging them out of
      // the database by hand. The button below re-downloads the same file.
      downloadTsv(exportFileName(), teamsToImportTsv(answer.exportTable));
      enqueueSnackbar(`${answer.imported} csapat importálva`, { variant: 'success' });
      props.onImported();
    } catch (e: unknown) {
      failed(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Stack sx={{ gap: '16px', padding: '10px 0' }} data-testid="importTeamsRoot">
      <Stack sx={{ gap: '4px' }}>
        <Stack sx={{ fontSize: 18 }}>Csapatok importálása</Stack>
        <Stack sx={{ fontSize: 14 }}>
          Tabulátorral elválasztott fájl, ebben az oszlopsorrendben: Teamname, Category, Email, Other, ID,
          Login Code, Credentials. Az utolsó hármat üresen hagyva a szerver generálja őket — a belépőkódokat
          a sikeres importálás után letöltött fájl tartalmazza.
        </Stack>
        <Stack sx={{ fontSize: 14 }}>
          Az importálás mindent vagy semmit: egyetlen hibás sor az egész fájlt visszautasítja, így javítás
          után ugyanaz a fájl újra betölthető.
        </Stack>
      </Stack>

      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Button variant="outlined" color="primary" component="label" disabled={busy !== null}>
          Fájl kiválasztása
          <input
            type="file"
            accept=".tsv,text/tab-separated-values"
            hidden
            data-testid="importTeamsFile"
            onChange={(event) => { void onFile(event); }}
          />
        </Button>
        <Button
          variant="outlined"
          color="primary"
          disabled={busy !== null || tsv.trim() === ''}
          onClick={() => { void check(tsv); }}
        >
          Ellenőrzés
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={busy !== null || tsv.trim() === '' || !local.ok || imported}
          onClick={() => { void runImport(); }}
        >
          {busy === 'import' ? `${local.rows.length} csapat importálása…` : 'Importálás indítása'}
        </Button>
        {imported && result !== null && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => { downloadTsv(exportFileName(), teamsToImportTsv(result.exportTable)); }}
          >
            Belépőkódok letöltése újra
          </Button>
        )}
      </Stack>

      <textarea
        aria-label="A beillesztett TSV"
        data-testid="importTeamsTsv"
        value={tsv}
        onChange={(event) => { edited(event.target.value); }}
        placeholder={'Ide is be lehet illeszteni a sorokat.'}
        rows={10}
        spellCheck={false}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre', overflowX: 'auto' }}
      />

      <Stack data-testid="importTeamsSummary">
        {imported && result !== null
          ? `${result.rows} sorból ${result.imported} csapat importálva.`
          : tsv.trim() === ''
            ? 'Nincs betöltött fájl.'
            : errorCount === 0
              ? `${local.rows.length} sor, hiba nélkül.`
              : `${local.rows.length} sor, ebből ${errorCount} hibás. Az importálás így nem futna le.`}
      </Stack>

      {problems.length > 0 && (
        <DataGrid
          columns={[
            { field: 'where', headerName: 'Hol', width: 110 },
            { field: 'column', headerName: 'Oszlop', width: 120 },
            { field: 'message', headerName: 'Hiba', flex: 1, minWidth: 300 },
            { field: 'found', headerName: 'Érték', width: 200 },
          ]}
          rows={problemRows(problems)}
          getRowClassName={(params) => `import-problem-${String(params.row.severity)}`}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ height: 'auto' }}
        />
      )}
      {truncated > 0 && <Stack>És további {truncated} probléma, amit a szerver már nem sorolt fel.</Stack>}
    </Stack>
  );
}
