import { ChangeEvent, useMemo, useState } from 'react';
import { Stack } from '@mui/system';
import { Button, alpha } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import {
  OTHER_IMPORT_MAX_LENGTH, OTHER_MAX_LENGTH, TeamTsvProblem, TeamTsvProblemCode,
  parseTeamsTsv, teamsToImportTsv,
} from 'schemas';
import { ImportResultDto } from '../dto/TeamStateDto';
import { useImportTeams } from '../hooks/user-hooks';
import { downloadTsv } from '../utils/download';

// The codes the parser reports, worded for an organiser. The rule lives in
// `schemas` and the wording here, so the command line can say the same things
// in English without either language reaching the other's caller.
const PROBLEM_TEXT: Record<TeamTsvProblemCode, string> = {
  'header-mismatch': 'A fejléc nem a megszokott. Az első sort fejlécként olvassuk — nem importáljuk —, az oszlopokat sorrend szerint vesszük.',
  'missing-header': 'Az első sor egy csapat, nem fejléc — a fájlból hiányzik a fejlécsor. Szúrd be, különben ez a csapat nem kerül be.',
  'no-rows': 'A fájl egyetlen csapatsort sem tartalmaz.',
  'wrong-column-count': 'Több oszlop van a sorban, mint a formátumban — valószínűleg tabulátor került valamelyik mezőbe.',
  'empty-teamname': 'Hiányzik a csapatnév.',
  'teamname-too-long': 'A csapatnév túl hosszú (legfeljebb 255 karakter).',
  'invalid-category': 'A kategória nem C, D vagy E.',
  'email-too-long': 'Az e-mail cím túl hosszú (legfeljebb 255 karakter).',
  'other-missing': 'Az „Other” mező üres. Ez alapján lehet később azonosítani a csapatot: nevek, iskola, e-mail címek.',
  'other-truncated': `Az „Other” mező hosszabb, mint amennyit az importálás megtart: `
    + `az első ${OTHER_IMPORT_MAX_LENGTH} karakter kerül be, a végén lévő előzmények nem.`,
  'other-too-long': `Az „Other” mező túl hosszú (legfeljebb ${OTHER_MAX_LENGTH} karakter).`,
  'invalid-team-id': 'Az ID nem érvényes UUIDv4.',
  'invalid-join-code': 'A belépőkód nem 111-2222-333 alakú.',
  'invalid-credentials': 'A credentials nem érvényes UUID.',
  'duplicate-teamname': 'Ez a csapatnév kétszer szerepel a fájlban.',
  'duplicate-team-id': 'Ez az ID kétszer szerepel a fájlban.',
  'duplicate-join-code': 'Ez a belépőkód kétszer szerepel a fájlban.',
  'teamname-taken': 'Már van ilyen nevű csapat.',
  'team-id-taken': 'Már van ilyen ID-jú csapat.',
  'join-code-taken': 'Már van ilyen belépőkódú csapat.',
  'already-exists': 'Ez a csapat már létezik: változatlanul marad, nem importáljuk újra.',
  'category-differs': 'A csapat már létezik, más kategóriával (fájlban ≠ élőben). NEM változtattuk meg — '
    + 'ha tényleg át kell sorolni, az admin felületen kell.',
  'email-differs': 'A csapat már létezik, más e-mail címmel (fájlban ≠ élőben). NEM változtattuk meg.',
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
 * fix, and repeated warnings as one row with a count.
 *
 * `counts` is how many of each the file really drew: the server caps what it
 * lists, so `problems` is the wrong thing to count — a 500-row re-import would
 * say 20. It is absent only before the server has answered, when the browser's
 * own list is the whole of it. */
function problemRows(
  problems: TeamTsvProblem[], counts: Partial<Record<TeamTsvProblemCode, number>> = {},
): ProblemRow[] {
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
      const total = counts[group[0].code] ?? group.length;
      rows.push({ ...row(group[0], 0), where: `${total} sor`, column: '', found: '' });
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
/// shows is stale from that moment, and it carries the join codes the import
/// generated. Those are held by the page rather than here: no admin screen
/// shows a join code, so this table is the only copy, and this tab is unmounted
/// the moment the organiser goes to look at the teams that just landed.
export function ImportTeams(props: {
  exported: string[][] | null,
  onImported: (exportTable: string[][]) => void,
}) {
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
  const errors = problems.filter(problem => problem.severity === 'error');
  // Rows, not problems: one row can break several rules at once, and a problem
  // about the file — a missing header, no rows at all — belongs to no row. The
  // summary counts what it says it counts; the grid below lists every problem.
  //
  // The server's own count when it has answered, because it caps the problems
  // it sends: counting the rows in that list would report 200 bad rows for a
  // file with 500, right above the note saying the list is short.
  //
  // Counted off the problems either way, as the server counts it: a row refused
  // unread — too many columns — is not among the parsed rows, so looking for it
  // there would hide it and blame the file as a whole for one bad line.
  const badRows = result?.badRows
    ?? new Set(errors.filter(problem => problem.row !== 0).map(problem => problem.row)).size;
  const imported = result !== null && result.imported > 0;
  // Read out of props once so the button below can be sure of it: a narrowing
  // on `props.exported` would not hold inside the click handler.
  const exported = props.exported;

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
    let text: string;
    try {
      text = await file.text();
    } catch (e: unknown) {
      // Said rather than swallowed: the read failing leaves the box as it was,
      // so without this the pick looks like it simply did nothing.
      failed(e);
      return;
    }
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
      if (answer.refused) {
        enqueueSnackbar('Az importálás nem futott le, egy csapat sem került be.', { variant: 'error' });
        return;
      }
      if (answer.imported === 0) {
        // Every team in the file was already there. Not a failure — re-running a
        // file is how late teams are added — and there is nothing to download.
        enqueueSnackbar(`Nem került be új csapat: mind a(z) ${answer.accepted} már létezett.`,
          { variant: 'info' });
        return;
      }
      // Handed to the page before anything else is attempted: the teams are
      // written by now, and this table is the only copy of the join codes the
      // import generated. Whatever happens next, the button below can still
      // re-download it.
      props.onImported(answer.exportTable);
      enqueueSnackbar(
        answer.accepted === 0
          ? `${answer.imported} csapat importálva`
          : `${answer.imported} új csapat importálva, ${answer.accepted} már létezett`,
        { variant: 'success' },
      );
      // Handed over without being asked for, since a closed tab means digging
      // the codes out of the database by hand. Its own catch because the import
      // has already succeeded: reporting a failed download as a failed import
      // would send the organiser to re-run one that cannot work twice.
      try {
        downloadTsv(exportFileName(), teamsToImportTsv(answer.exportTable));
      } catch {
        enqueueSnackbar('A csapatok bekerültek, de a belépőkódokat nem sikerült letölteni. '
          + 'Használd a „Belépőkódok letöltése újra” gombot.', { variant: 'warning' });
      }
    } catch (e: unknown) {
      failed(e);
    } finally {
      setBusy(null);
    }
  };

  /** The one line above the problem grid: what this file is, or was. */
  const summary = (): string => {
    if (imported && result !== null) {
      return `${result.rows} sorból ${result.imported} csapat importálva`
        + (result.accepted === 0 ? '.' : `, ${result.accepted} már létezett.`);
    }
    if (tsv.trim() === '') return 'Nincs betöltött fájl.';
    if (errors.length > 0) {
      return badRows === 0
        ? `${local.dataLines} sor. Magával a fájllal van baj, az importálás így nem futna le.`
        : `${local.dataLines} sor, ebből ${badRows} hibás. Az importálás így nem futna le.`;
    }
    // Which teams are already there is the server's answer alone, so this is
    // said only once it has looked. Without it a re-upload reads "N sor, hiba
    // nélkül" and the organiser waits for teams this file is not going to add.
    if (result !== null && result.accepted > 0) {
      return result.accepted === result.rows
        ? `${result.rows} sor, és mind a(z) ${result.accepted} csapat már létezik — nincs mit importálni.`
        : `${result.rows} sor: ${result.rows - result.accepted} új csapat, ${result.accepted} már létezik. `
          + 'A meglévőket nem módosítjuk.';
    }
    return `${local.dataLines} sor, hiba nélkül.`;
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
          // Stopped once this text is imported, like the button beside it: a
          // check now would report every row of it as a team that already
          // exists, which is the import having worked.
          disabled={busy !== null || tsv.trim() === '' || imported}
          onClick={() => { void check(tsv); }}
        >
          Ellenőrzés
        </Button>
        <Button
          variant="contained"
          color="primary"
          // Every error we are showing, the server's included: an *Ellenőrzés*
          // that came back with a clash should stop the button it was run for,
          // and its answer is about this exact text — any edit drops it.
          disabled={busy !== null || tsv.trim() === '' || errors.length > 0 || imported}
          onClick={() => { void runImport(); }}
        >
          {busy === 'import' ? `${local.rows.length} csapat importálása…` : 'Importálás indítása'}
        </Button>
        {exported !== null && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => { downloadTsv(exportFileName(), teamsToImportTsv(exported)); }}
          >
            Belépőkódok letöltése újra
          </Button>
        )}
      </Stack>

      {/* Held while a request is out, because `check` applies whatever comes
          back: an edit now would have an answer about the old text land on the
          new, re-enabling the import for a file the browser had just refused.
          The file button is the other way in, and is already disabled.
          Read-only rather than disabled, so a sub-second round trip does not
          cost the organiser their selection and scroll position. */}
      <textarea
        aria-label="A beillesztett TSV"
        data-testid="importTeamsTsv"
        value={tsv}
        readOnly={busy !== null}
        onChange={(event) => { edited(event.target.value); }}
        placeholder={'Ide is be lehet illeszteni a sorokat.'}
        rows={10}
        spellCheck={false}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre', overflowX: 'auto' }}
      />

      <Stack data-testid="importTeamsSummary">{summary()}</Stack>

      {problems.length > 0 && (
        <DataGrid
          columns={[
            { field: 'where', headerName: 'Hol', width: 110 },
            { field: 'column', headerName: 'Oszlop', width: 120 },
            { field: 'message', headerName: 'Hiba', flex: 1, minWidth: 300 },
            { field: 'found', headerName: 'Érték', width: 200 },
          ]}
          rows={problemRows(problems, result?.warningCounts)}
          getRowClassName={(params) => `import-problem-${String(params.row.severity)}`}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          // What the row classes above are for: an error is why the file will
          // not load, a warning is something to look at once it has. A tint
          // rather than recoloured text, which the grid's own hover and
          // selection colours would fight.
          sx={(theme) => ({
            height: 'auto',
            '& .import-problem-error': { backgroundColor: alpha(theme.palette.error.main, 0.12) },
            '& .import-problem-warning': { backgroundColor: alpha(theme.palette.warning.main, 0.12) },
          })}
        />
      )}
      {truncated > 0 && <Stack>És további {truncated} probléma, amit a szerver már nem sorolt fel.</Stack>}
    </Stack>
  );
}
