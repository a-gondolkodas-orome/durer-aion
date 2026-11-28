import {
  Box, Button, Checkbox, FormControlLabel, FormGroup, FormLabel, InputAdornment, Link, MenuItem, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import useSWR from 'swr';
import type { CompetitionConfig, Language, Problem, StartWindow } from 'schemas';
import { ENTITY_SLUG_PATTERN, LANGUAGES, ROUNDS, editionSchoolYear, randomIdPart, validateStartWindow } from 'schemas';
import type { AdminCompetitionDto, CompetitionWriteResultDto } from '../dto/TeamStateDto';
import { useCompetition, useCreateCompetition, useSaveCompetition, useStrategyGameIds } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';
import { windowText, windowTimeNow } from '../utils/window-time';
import { BORDER, DANGER, MUTED } from './adminStyles';
import { Card, ReviewMessages, Steps, WARNING, useLeaveWarning } from './EditPageParts';
import { ROUND_NAMES, SAVED_PARAM, competitionPath, competitionTitle, slug } from './CompetitionTable';
import {
  type FieldErrors, type SettingsForm, competitionFromForm, newSettingsForm, settingsForm, suggestedSlug,
} from './competition-form';
import { Loading } from './Loading';
import { brokenImageWarnings } from './ProblemContentCards';
import { RelayEditor, type RelayEntriesUpdate } from './RelayEditor';
import { type EntryErrors, type RelayEntryForm, entryProblemId, relayForm, relayFromForm } from './relay-form';

// A competition's edit page, /admin/verseny/:id/edit: its settings and its
// relay's problems (RelayEditor.tsx), then a review of what the server says
// of them, then Save. Nothing is written before Save, the new problems the
// relay brings included, and the draft lives in this page alone. One held in
// code changes only with a deploy, its start window aside: the same form
// shows it, every field but the window's read-only, so a window is set in one
// place for both. A new competition, /admin/verseny/new, is made on the same
// page from an empty draft (`NewCompetitionPage`), its id's slug editable
// until the save.

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'magyar', en: 'angol' };

export function CompetitionEditPage(props: { competitionId: string }) {
  const errorMessage = useErrorMessage();
  const getCompetition = useCompetition();
  const { data, error } = useSWR(['team/admin/competitions', props.competitionId],
    ([, id]) => getCompetition(id), { revalidateOnFocus: false });
  return (
    <Stack sx={{ padding: '10px', gap: '20px' }} data-testid="competitionEditPage">
      {error !== undefined && <Typography role="alert" color="error">{errorMessage(error)}</Typography>}
      {data === undefined && error === undefined && <Loading/>}
      {data !== undefined && <CompetitionEditor data={data}/>}
    </Stack>
  );
}

const COMPETITIONS_PATH = '/admin?tab=versenyek';

/// A new competition's draft. Its `id` is empty: the id is the form's to
/// settle until the save, and an empty one names no competition, so a problem
/// editor opened from the relay returns to none (`adminPath` in Main.tsx).
const NEW_DRAFT: CompetitionConfig =
  { id: '', languages: ['hu'], metadata: { kind: 'competition', edition: 0, round: 'online', category: '' } };

/// The page of a competition not yet saved: the edit page with an empty draft.
export function NewCompetitionPage() {
  const errorMessage = useErrorMessage();
  const getStrategyGameIds = useStrategyGameIds();
  const { data: strategyGameIds, error } = useSWR('team/admin/strategy-games', getStrategyGameIds,
    { revalidateOnFocus: false });
  return (
    <Stack sx={{ padding: '10px', gap: '20px' }} data-testid="newCompetitionPage">
      {error !== undefined && <Typography role="alert" color="error">{errorMessage(error)}</Typography>}
      {strategyGameIds === undefined && error === undefined && <Loading/>}
      {strategyGameIds !== undefined && <CompetitionEditor creating data={{
        id: '', metadata: NEW_DRAFT.metadata, storedIn: 'database', startWindow: null, configStartWindow: null,
        competition: NEW_DRAFT, relayProblems: [], strategyGameIds, started: false,
      }}/>}
    </Stack>
  );
}

function Breadcrumb(props: { data: AdminCompetitionDto, dirty: boolean, creating: boolean }) {
  return (
    <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      <Box component="nav" aria-label="Útvonal" sx={{ fontSize: '14px', color: MUTED }}>
        <Link href={COMPETITIONS_PATH}>Versenyek</Link>
        {props.creating ? ' › Új verseny' : <>
          {' › '}<Link href={competitionPath(props.data.id)}>{competitionTitle(props.data)}</Link> › Szerkesztés
        </>}
      </Box>
      {props.dirty && <Box sx={{ marginLeft: 'auto', fontSize: '13px', color: WARNING }}>● Mentetlen változások</Box>}
    </Stack>
  );
}

const SLUG_RULE = 'Kisbetűk és számjegyek, a szavak között egy-egy kötőjel.';

function CompetitionEditor({ data, creating = false }: { data: AdminCompetitionDto, creating?: boolean }) {
  const errorMessage = useErrorMessage();
  const saveCompetition = useSaveCompetition();
  const createCompetition = useCreateCompetition();
  const { enqueueSnackbar } = useSnackbar();
  // The window in force: for one held in code, the one set apart from its
  // config where there is one.
  const [initial] = useState(() => creating ? newSettingsForm()
    : settingsForm({ ...data.competition, startWindow: data.startWindow ?? undefined }));
  const [form, setForm] = useState(initial);
  const [initialRelay] = useState(() => relayForm(data.competition.relay));
  const [relay, setRelay] = useState(initialRelay);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [relayErrors, setRelayErrors] = useState<Record<string, EntryErrors>>({});
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // A new competition's id: a random part drawn once, and a slug that follows
  // the settings (`suggestedSlug`) until the organiser types one.
  const [random] = useState(randomIdPart);
  const [typedSlug, setTypedSlug] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | undefined>(undefined);
  const idSlug = typedSlug ?? suggestedSlug(form);
  const id = creating ? `${random}--${idSlug}` : data.id;
  // Whether each image URL of a new problem loaded in its preview.
  const [loads, setLoads] = useState<Record<string, boolean>>({});
  const broken = (url: string) => url !== '' && loads[url] === false;
  const dirty = !saved && (JSON.stringify([form, relay]) !== JSON.stringify([initial, initialRelay]) || typedSlug !== null);
  const leaving = useLeaveWarning(dirty);

  const update = (change: Partial<SettingsForm>) => { setForm(current => ({ ...current, ...change })); };

  const send = async (change: Omit<Review, 'result'>, dryRun: boolean) => {
    setBusy(true);
    try {
      return await (creating ? createCompetition : saveCompetition)(change, { dryRun });
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const toReview = async () => {
    // A relay turned off takes the problems it would have brought with it.
    const relayRead = form.hasRelay ? relayFromForm(relay) : { problems: [], created: [] };
    const read = competitionFromForm(form, { ...data.competition, id }, 'errors' in relayRead ? [] : relayRead.problems);
    const badSlug = creating && !ENTITY_SLUG_PATTERN.test(idSlug) ? SLUG_RULE : undefined;
    setFieldErrors('fieldErrors' in read ? read.fieldErrors : {});
    setRelayErrors('errors' in relayRead ? relayRead.errors : {});
    setSlugError(badSlug);
    if ('fieldErrors' in read || 'errors' in relayRead || badSlug !== undefined) return;
    const change = { competition: read.competition, problems: relayRead.created };
    const result = await send(change, true);
    if (result !== undefined) setReview({ ...change, result });
  };

  const save = async () => {
    if (review === null) return;
    const result = await send({ competition: review.competition, problems: review.problems }, false);
    if (result === undefined) return;
    if (!result.written) {
      // What changed since the dry run, a team starting say, is the report's to say.
      setReview({ ...review, result });
      return;
    }
    setSaved(true);
    leaving.current = true;
    // The competition's page says it was saved: a snackbar here would go with
    // the page it is shown on.
    window.location.assign(`${competitionPath(review.competition.id)}?${SAVED_PARAM}=1`);
  };

  return <>
    <Breadcrumb data={data} dirty={dirty} creating={creating}/>
    <Typography component="h1" sx={{ fontSize: '24px', fontWeight: 600 }}>
      {creating ? 'Új verseny' : competitionTitle(data)}
    </Typography>
    <Steps names={['Beállítások', 'Ellenőrzés és mentés']} step={review === null ? 1 : 2}/>
    {review === null
      ? <SettingsStep form={form} update={update} fieldErrors={fieldErrors} data={data} busy={busy} dirty={dirty}
        idField={creating ? { slug: idSlug, id, error: slugError, onChange: setTypedSlug } : undefined}
        relay={relay} setRelay={setRelay} relayErrors={relayErrors} broken={broken}
        onPictureLoad={(url, loaded) => { setLoads(current => ({ ...current, [url]: loaded })); }}
        onNext={() => { void toReview(); }}/>
      : <ReviewStep review={review} relay={relay} data={data} busy={busy}
        brokenImages={relay.flatMap((entry, index) => entry.created === undefined ? []
          : brokenImageWarnings(entry.created.problem.content, broken, `A váltó ${index + 1}. feladata: `))}
        onBack={() => { setReview(null); }} onSave={() => { void save(); }}/>}
  </>;
}

const fieldRow = { display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))',
  md: 'repeat(4, minmax(0, 1fr))' } };

function SettingsStep(props: {
  form: SettingsForm, update: (change: Partial<SettingsForm>) => void, fieldErrors: FieldErrors,
  data: AdminCompetitionDto, busy: boolean, dirty: boolean, onNext: () => void,
  /** A new competition's: the slug of its id, which stays editable until the save. */
  idField?: { slug: string, id: string, error: string | undefined, onChange: (slug: string) => void },
  relay: RelayEntryForm[], setRelay: RelayEntriesUpdate, relayErrors: Record<string, EntryErrors>,
  broken: (url: string) => boolean, onPictureLoad: (url: string, loaded: boolean) => void,
}) {
  const { form, update, fieldErrors, idField } = props;
  // A new competition has nothing to differ from: its empty draft goes on to
  // the review too, which says what it lacks.
  const canGoOn = props.dirty || idField !== undefined;
  const example = windowTimeNow();
  // The stored id, should it name a game no longer registered: the validator
  // says so in the review, and the select still shows what is stored.
  const gameIds = [...new Set([...props.data.strategyGameIds, ...form.gameId === '' ? [] : [form.gameId]])].sort();
  const inCode = props.data.storedIn === 'code';
  const codeWindow = props.data.configStartWindow ?? null;
  const showsCodeWindow = form.opensAt === (codeWindow?.opensAt ?? '') && form.closesAt === (codeWindow?.closesAt ?? '');
  // The current time, in the format the fields take: a value to start from,
  // since the placeholder goes once typing starts.
  const fillNow = (name: string, field: 'opensAt' | 'closesAt') => (
    <InputAdornment position="end">
      <Button size="small" aria-label={`${name}: most`} sx={{ textTransform: 'none' }}
        onClick={() => { update({ [field]: windowTimeNow() }); }}>Most</Button>
    </InputAdornment>
  );
  const languageText = (field: 'label' | 'finishMessage', language: Language, value: string) => {
    update({ [field]: { ...form[field], [language]: value } });
  };

  return (
    <Stack component="form" sx={{ gap: '20px' }} noValidate
      onSubmit={(event) => { event.preventDefault(); if (canGoOn) props.onNext(); }}>
      {inCode && <Typography role="note" sx={{ fontSize: '14px', backgroundColor: '#fff', border: `1px solid ${BORDER}`,
        borderRadius: '8px', padding: '16px 24px' }}>
        A kódban tárolt verseny csak telepítéssel változik, az indítási ablaka kivételével: itt csak az módosítható.
      </Typography>}
      <Card title="Alapadatok">
        <Stack sx={{ flexDirection: 'row', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px' }}>
          <Box component="span" id="kind-label" sx={{ color: MUTED }}>Fajta</Box>
          <ToggleButtonGroup exclusive size="small" color="primary" value={form.kind} aria-labelledby="kind-label" disabled={inCode}
            onChange={(_, kind: SettingsForm['kind'] | null) => { if (kind !== null) update({ kind }); }}>
            <ToggleButton value="competition">Dürer-forduló</ToggleButton>
            <ToggleButton value="other">Egyéb</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {form.kind === 'competition' && <Box sx={fieldRow}>
          <TextField label="Kiadás" value={form.edition} disabled={inCode} error={fieldErrors.edition !== undefined}
            helperText={fieldErrors.edition ?? (/^\d+$/.test(form.edition) ? editionSchoolYear(Number(form.edition)) : ' ')}
            onChange={(event) => { update({ edition: event.target.value }); }}/>
          <TextField select label="Forduló" value={form.round} disabled={inCode}
            onChange={(event) => { update({ round: event.target.value as SettingsForm['round'] }); }}>
            {ROUNDS.map(round => <MenuItem key={round} value={round}>{ROUND_NAMES[round]}</MenuItem>)}
          </TextField>
          <TextField label="Kategória" value={form.category} disabled={inCode} onChange={(event) => { update({ category: event.target.value }); }}/>
        </Box>}
        <Box sx={{ ...fieldRow, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
          {LANGUAGES.map(language => (
            <TextField key={language} value={form.label[language]} disabled={inCode}
              slotProps={{ inputLabel: { shrink: true } }}
              label={`Címke, ${LANGUAGE_NAMES[language]}${form.kind === 'competition' ? ' (nem kötelező)' : ''}`}
              onChange={(event) => { languageText('label', language, event.target.value); }}/>
          ))}
        </Box>
        <Stack sx={{ flexDirection: 'row', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box component="fieldset" sx={{ border: 0, padding: 0, margin: 0 }}>
            <FormLabel component="legend" sx={{ fontSize: '13px' }}>Nyelvek</FormLabel>
            <FormGroup row>
              {LANGUAGES.map(language => (
                <FormControlLabel key={language} label={LANGUAGE_NAMES[language]} control={
                  <Checkbox checked={form.languages.includes(language)} disabled={inCode} onChange={(event) => {
                    update({ languages: event.target.checked ? [...form.languages, language]
                      : form.languages.filter(each => each !== language) });
                  }}/>
                }/>
              ))}
            </FormGroup>
          </Box>
          {idField === undefined
            ? <TextField label="Azonosító" value={props.data.id} disabled helperText="Mentés után nem változik."
              sx={{ flex: '1 1 320px' }} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}/>
            : <TextField label="Név az azonosítóban" value={idField.slug} sx={{ flex: '1 1 320px' }}
              error={idField.error !== undefined}
              helperText={idField.error ?? `Azonosító: ${idField.id} (mentés után nem változik)`}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
              onChange={(event) => { idField.onChange(event.target.value); }}/>}
        </Stack>
      </Card>

      <Card title="Váltó" action={
        <FormControlLabel label="Van váltó" control={
          <Checkbox checked={form.hasRelay} disabled={inCode} onChange={(event) => { update({ hasRelay: event.target.checked }); }}/>
        }/>
      }>
        {form.hasRelay && <>
          <Box sx={fieldRow}>
            <TextField label="Időtartam (perc)" value={form.relayMinutes} disabled={inCode} error={fieldErrors.relayMinutes !== undefined}
              helperText={fieldErrors.relayMinutes} onChange={(event) => { update({ relayMinutes: event.target.value }); }}/>
          </Box>
          <RelayEditor entries={props.relay} setEntries={props.setRelay} errors={props.relayErrors} data={props.data}
            locked={inCode || props.data.started} broken={props.broken} onPictureLoad={props.onPictureLoad}/>
        </>}
      </Card>

      <Card title="Stratégiás játék" action={
        <FormControlLabel label="Van stratégiás játék" control={
          <Checkbox checked={form.hasStrategy} disabled={inCode} onChange={(event) => { update({ hasStrategy: event.target.checked }); }}/>
        }/>
      }>
        {form.hasStrategy && <Box sx={fieldRow}>
          <TextField select label="Játék azonosítója" value={form.gameId} disabled={inCode} sx={{ gridColumn: { md: 'span 2' } }}
            onChange={(event) => { update({ gameId: event.target.value }); }}>
            {gameIds.map(id => <MenuItem key={id} value={id}>{id}</MenuItem>)}
          </TextField>
          <TextField label="Időtartam (perc)" value={form.strategyMinutes} disabled={inCode} error={fieldErrors.strategyMinutes !== undefined}
            helperText={fieldErrors.strategyMinutes}
            onChange={(event) => { update({ strategyMinutes: event.target.value }); }}/>
        </Box>}
      </Card>

      <Card title="Forduló menete" action={inCode && !showsCodeWindow &&
        <Button size="small" onClick={() => { update({ opensAt: codeWindow?.opensAt ?? '', closesAt: codeWindow?.closesAt ?? '' }); }}>
          Vissza a kódbeli ablakhoz
        </Button>}>
        <Box sx={{ ...fieldRow, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
          <TextField label="Indítás ettől" value={form.opensAt} placeholder={example}
            helperText="Időzónás időpont. Üresen: bármikor indítható."
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: fillNow('Indítás ettől', 'opensAt') } }}
            onChange={(event) => { update({ opensAt: event.target.value }); }}/>
          <TextField label="Indítás eddig (nem kötelező)" value={form.closesAt} placeholder={example}
            helperText="Üresen: a kezdete után bármikor."
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: fillNow('Indítás eddig', 'closesAt') } }}
            onChange={(event) => { update({ closesAt: event.target.value }); }}/>
          <TextField label="Továbbjutási pontszám (nem kötelező)" value={form.advancingPoints} disabled={inCode}
            error={fieldErrors.advancingPoints !== undefined}
            helperText={fieldErrors.advancingPoints ?? 'A szabályok oldal írja ki, más nem dönt belőle.'}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) => { update({ advancingPoints: event.target.value }); }}/>
        </Box>
        {inCode && <Typography sx={{ fontSize: '12px', color: MUTED }}>
          {showsCodeWindow ? 'Ez a kódbeli ablak.' : `A kódbeli ablak: ${windowText(codeWindow)}.`}
        </Typography>}
        <Box sx={{ ...fieldRow, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
          {LANGUAGES.map(language => (
            <TextField key={language} multiline minRows={3} value={form.finishMessage[language]} disabled={inCode}
              slotProps={{ inputLabel: { shrink: true } }}
              label={`Záróüzenet, ${LANGUAGE_NAMES[language]} (nem kötelező)`}
              placeholder={language === 'hu' ? 'Üres: az online forduló szokásos köszönete és az eredmények csütörtöki közzététele.'
                : 'Üres: a másik nyelvé látszik.'}
              onChange={(event) => { languageText('finishMessage', language, event.target.value); }}/>
          ))}
        </Box>
      </Card>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="outlined" href={idField === undefined ? competitionPath(props.data.id) : COMPETITIONS_PATH}>
          Mégse
        </Button>
        <Stack sx={{ flexDirection: 'row', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!canGoOn && <Typography sx={{ fontSize: '13px', color: MUTED }}>Még nincs mit menteni.</Typography>}
          <Button variant="contained" type="submit" disabled={props.busy || !canGoOn}>Tovább: ellenőrzés</Button>
        </Stack>
      </Stack>
      <Typography sx={{ fontSize: '12px', color: MUTED }}>
        Semmi nem kerül az adatbázisba a mentésig. A félkész változtatás csak ezen az oldalon marad meg.
      </Typography>
    </Stack>
  );
}

/// The window as the rules page reads it out, or, where it breaks the rules,
/// as typed: a time that does not parse cannot be read out, and the review's
/// errors say what is wrong with it.
function startText(window: StartWindow | undefined): string {
  if (window === undefined || validateStartWindow(window).length === 0) return windowText(window ?? null);
  return `hibás: ${window.opensAt || '(nincs kezdete)'}${window.closesAt === undefined ? '' : ` – ${window.closesAt}`}`;
}

/// What the rules page and the end of the round tell a team, line by line.
export function rulesLines(competition: CompetitionConfig): [string, string][] {
  const { relay, strategy } = competition;
  const languages = competition.languages.map(each => LANGUAGE_NAMES[each]);
  const points = relay?.problems.map(each => each.points) ?? [];
  const finish = competition.finishMessage;
  return [
    ['Nyelv', languages.length > 1 ? `${languages.join(' és ')}, a csapat választ` : languages.join('')],
    ['Indítás', startText(competition.startWindow)],
    ['Váltó', relay === undefined ? 'nincs'
      : `${points.length} feladat, ${relay.durationMinutes} perc, összesen ${points.reduce((sum, each) => sum + each, 0)} pont`
        + (points.length > 0 ? ` (${points.join(', ')})` : '')],
    ['Stratégiás játék', strategy === undefined ? 'nincs' : `${strategy.gameId}, ${strategy.durationMinutes} perc`],
    ['Továbbjutás', competition.advancingPoints === undefined ? 'nem írja ki' : `${competition.advancingPoints} ponttól`],
    ...(finish === undefined ? [['Záróüzenet', 'az online forduló szokásos szövege'] satisfies [string, string]]
      : competition.languages.map((language): [string, string] =>
        [`Záróüzenet (${LANGUAGE_NAMES[language]})`, finish[language] ?? 'a másik nyelvé']))
  ];
}

interface Review {
  competition: CompetitionConfig;
  /** The new problems the relay brings. */
  problems: Problem[];
  result: CompetitionWriteResultDto;
}

function ReviewStep(props: {
  review: Review, relay: RelayEntryForm[], data: AdminCompetitionDto, busy: boolean, brokenImages: string[],
  onBack: () => void, onSave: () => void,
}) {
  const { competition, result: { errors, warnings } } = props.review;
  const before = props.data.competition.relay?.problems ?? [];
  const after = competition.relay?.problems ?? [];
  const relayChanged = JSON.stringify(before) !== JSON.stringify(after);
  return (
    <Stack sx={{ gap: '18px' }}>
      <ReviewMessages errors={errors} warnings={[...warnings, ...props.brokenImages]}/>
      <Card title="Amit a csapat a szabályok oldalon lát">
        <Box component="dl" sx={{ margin: 0 }}>
          {rulesLines(competition).map(([name, value]) => (
            <Stack key={name} sx={{ flexDirection: 'row', gap: '10px', padding: '6px 0', fontSize: '14px',
              borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 0 } }}>
              <Box component="dt" sx={{ color: MUTED, fontSize: '13px', minWidth: '170px' }}>{name}</Box>
              <Box component="dd" sx={{ margin: 0, whiteSpace: 'pre-wrap' }}>{value}</Box>
            </Stack>
          ))}
        </Box>
      </Card>
      {relayChanged && <Card title="A váltó feladatai a mentés után">
        <Box component="ol" sx={{ margin: 0, paddingLeft: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column',
          gap: '4px' }}>
          {after.map(({ problemId, points }) => {
            const created = props.review.problems.some(each => each.id === problemId);
            const copyOf = props.relay.find(each => each.created !== undefined && entryProblemId(each) === problemId)
              ?.created?.copyOf;
            const picked = props.relay.some(each => each.picked !== undefined && each.problemId === problemId);
            return (
              <li key={problemId}>
                <span title={problemId}>{slug(problemId)}</span> · {points} pont
                {created && <Box component="span" sx={{ color: MUTED }}>
                  {copyOf === undefined ? ' · új feladat' : ` · másolat, ennek a helyén: ${slug(copyOf.id)}`}
                </Box>}
                {picked && <Box component="span" sx={{ color: MUTED }}> · meglévő feladat, hozzáadva</Box>}
              </li>
            );
          })}
        </Box>
        {before.some(({ problemId }) => !after.some(each => each.problemId === problemId)) &&
          <Typography sx={{ fontSize: '13px', color: MUTED }}>
            Kikerül a váltóból: {before.filter(({ problemId }) => !after.some(each => each.problemId === problemId))
              .map(({ problemId }) => slug(problemId)).join(', ')}. A feladat megmarad, a többi verseny, amely használja,
            nem változik.
          </Typography>}
      </Card>}
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={props.onBack}>Vissza: beállítások</Button>
        <Stack sx={{ flexDirection: 'row', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {errors.length > 0 && <Typography sx={{ fontSize: '13px', color: DANGER }}>
            Előbb javítsd a {errors.length === 1 ? 'hibát' : `${errors.length} hibát`}.
          </Typography>}
          <Button variant="contained" disabled={errors.length > 0 || props.busy} onClick={props.onSave}>Mentés</Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
