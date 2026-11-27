import {
  Box, Button, Checkbox, FormControlLabel, FormGroup, FormLabel, Link, MenuItem, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import { type ReactNode, useEffect, useState } from 'react';
import useSWR from 'swr';
import type { CompetitionConfig, Language } from 'schemas';
import { LANGUAGES, ROUNDS, editionSchoolYear } from 'schemas';
import type { AdminCompetitionDto, CompetitionWriteResultDto } from '../dto/TeamStateDto';
import { useCompetition, useSaveCompetition } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';
import { windowText, windowTimeNow } from '../utils/window-time';
import { BORDER, DANGER, DANGER_BORDER, MUTED } from './adminStyles';
import { ROUND_NAMES, competitionPath, competitionTitle } from './CompetitionTable';
import { type FieldErrors, type SettingsForm, competitionFromForm, settingsForm } from './competition-form';
import { Loading } from './Loading';

// A competition's edit page, /admin/verseny/:id/edit: its settings,
// then a review of what the server says of them, then Save. Nothing is
// written before Save, and the draft lives in this page alone. The relay's
// problems are not edited here (#818–#819). One held in code changes only
// with a deploy, its start window aside: the same form shows it, every field
// but the window's read-only, so a window is set in one place for both.

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'magyar', en: 'angol' };
const WARNING = '#7a4b00';
const WARNING_BORDER = '#f0d49a';

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

function Breadcrumb(props: { data: AdminCompetitionDto, dirty: boolean }) {
  return (
    <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      <Box component="nav" aria-label="Útvonal" sx={{ fontSize: '14px', color: MUTED }}>
        <Link href="/admin?tab=versenyek">Versenyek</Link>
        {' › '}<Link href={competitionPath(props.data.id)}>{competitionTitle(props.data)}</Link> › Szerkesztés
      </Box>
      {props.dirty && <Box sx={{ marginLeft: 'auto', fontSize: '13px', color: WARNING }}>● Mentetlen változások</Box>}
    </Stack>
  );
}

function CompetitionEditor({ data }: { data: AdminCompetitionDto }) {
  const errorMessage = useErrorMessage();
  const saveCompetition = useSaveCompetition();
  const { enqueueSnackbar } = useSnackbar();
  // The window in force: for one held in code, the one set apart from its
  // config where there is one.
  const [initial] = useState(() => settingsForm({ ...data.competition, startWindow: data.startWindow ?? undefined }));
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [review, setReview] = useState<{ competition: CompetitionConfig, result: CompetitionWriteResultDto } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = !saved && JSON.stringify(form) !== JSON.stringify(initial);

  // Every way off the page is a page load, the breadcrumb's links included,
  // so the browser's own prompt is the warning.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); };
  }, [dirty]);

  const update = (change: Partial<SettingsForm>) => { setForm(current => ({ ...current, ...change })); };

  const send = async (competition: CompetitionConfig, dryRun: boolean) => {
    setBusy(true);
    try {
      return await saveCompetition(competition, { dryRun });
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const toReview = async () => {
    const read = competitionFromForm(form, data.competition);
    if ('fieldErrors' in read) {
      setFieldErrors(read.fieldErrors);
      return;
    }
    setFieldErrors({});
    const result = await send(read.competition, true);
    if (result !== undefined) setReview({ competition: read.competition, result });
  };

  const save = async () => {
    if (review === null) return;
    const result = await send(review.competition, false);
    if (result === undefined) return;
    if (!result.written) {
      // What changed since the dry run, a team starting say, is the report's to say.
      setReview({ ...review, result });
      return;
    }
    setSaved(true);
    enqueueSnackbar('Mentve', { variant: 'success' });
    window.location.assign(competitionPath(data.id));
  };

  return <>
    <Breadcrumb data={data} dirty={dirty}/>
    <Typography component="h1" sx={{ fontSize: '24px', fontWeight: 600 }}>{competitionTitle(data)}</Typography>
    <Steps step={review === null ? 1 : 2}/>
    {review === null
      ? <SettingsStep form={form} update={update} fieldErrors={fieldErrors} data={data} busy={busy}
        onNext={() => { void toReview(); }}/>
      : <ReviewStep competition={review.competition} result={review.result} busy={busy}
        onBack={() => { setReview(null); }} onSave={() => { void save(); }}/>}
  </>;
}

function Steps({ step }: { step: 1 | 2 }) {
  const names = ['Beállítások', 'Ellenőrzés és mentés'];
  return (
    <Stack component="ol" aria-label="Lépések" sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '28px', margin: 0,
      padding: 0, listStyle: 'none' }}>
      {names.map((name, index) => {
        const current = index + 1 === step;
        return (
          <Stack component="li" key={name} aria-current={current ? 'step' : undefined}
            sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '14px',
              color: current ? 'text.primary' : MUTED, fontWeight: current ? 500 : 400 }}>
            <Box component="span" sx={{ width: 26, height: 26, borderRadius: '13px', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '13px',
              backgroundColor: index + 1 <= step ? 'primary.main' : BORDER,
              color: index + 1 <= step ? 'primary.contrastText' : 'text.primary' }}>{index + 1}</Box>
            {name}
          </Stack>
        );
      })}
    </Stack>
  );
}

function Card(props: { title: string, action?: ReactNode, children: ReactNode, tone?: 'danger' | 'warning' }) {
  const color = props.tone === 'danger' ? DANGER : props.tone === 'warning' ? WARNING : undefined;
  const border = props.tone === 'danger' ? DANGER_BORDER : props.tone === 'warning' ? WARNING_BORDER : BORDER;
  return (
    <Stack component="section" aria-label={props.title} sx={{ backgroundColor: '#fff', border: `1px solid ${border}`,
      borderRadius: '8px', padding: '24px', gap: '16px' }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        flexWrap: 'wrap' }}>
        <Typography component="h2" sx={{ fontSize: '17px', fontWeight: 600, color }}>{props.title}</Typography>
        {props.action}
      </Stack>
      {props.children}
    </Stack>
  );
}

const fieldRow = { display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))',
  md: 'repeat(4, minmax(0, 1fr))' } };

function SettingsStep(props: {
  form: SettingsForm, update: (change: Partial<SettingsForm>) => void, fieldErrors: FieldErrors,
  data: AdminCompetitionDto, busy: boolean, onNext: () => void,
}) {
  const { form, update, fieldErrors } = props;
  const example = windowTimeNow();
  // The stored id, should it name a game no longer registered: the validator
  // says so in the review, and the select still shows what is stored.
  const gameIds = [...new Set([...props.data.strategyGameIds, ...form.gameId === '' ? [] : [form.gameId]])].sort();
  const inCode = props.data.storedIn === 'code';
  const codeWindow = props.data.configStartWindow ?? null;
  const showsCodeWindow = form.opensAt === (codeWindow?.opensAt ?? '') && form.closesAt === (codeWindow?.closesAt ?? '');
  const languageText = (field: 'label' | 'finishMessage', language: Language, value: string) => {
    update({ [field]: { ...form[field], [language]: value } });
  };

  return (
    <Stack component="form" sx={{ gap: '20px' }} noValidate
      onSubmit={(event) => { event.preventDefault(); props.onNext(); }}>
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
          <TextField label="Azonosító" value={props.data.id} disabled helperText="Mentés után nem változik."
            sx={{ flex: '1 1 320px' }} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}/>
        </Stack>
      </Card>

      <Card title="Váltó" action={
        <FormControlLabel label="Van váltó" control={
          <Checkbox checked={form.hasRelay} disabled={inCode} onChange={(event) => { update({ hasRelay: event.target.checked }); }}/>
        }/>
      }>
        {form.hasRelay && <Box sx={fieldRow}>
          <TextField label="Időtartam (perc)" value={form.relayMinutes} disabled={inCode} error={fieldErrors.relayMinutes !== undefined}
            helperText={fieldErrors.relayMinutes} onChange={(event) => { update({ relayMinutes: event.target.value }); }}/>
          <Typography sx={{ gridColumn: { md: 'span 3' }, fontSize: '14px', alignSelf: 'center' }}>
            {props.data.competition.relay?.problems.length ?? 0} feladat. A feladatok itt még nem szerkeszthetők.
          </Typography>
        </Box>}
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
        <Box sx={fieldRow}>
          <TextField label="Indítás ettől" value={form.opensAt} placeholder={example}
            onChange={(event) => { update({ opensAt: event.target.value }); }}/>
          <TextField label="Indítás eddig (nem kötelező)" value={form.closesAt} placeholder={example}
            onChange={(event) => { update({ closesAt: event.target.value }); }}/>
          <TextField label="Továbbjutási pontszám (nem kötelező)" value={form.advancingPoints} disabled={inCode}
            error={fieldErrors.advancingPoints !== undefined}
            helperText={fieldErrors.advancingPoints ?? 'A szabályok oldal írja ki, más nem dönt belőle.'}
            onChange={(event) => { update({ advancingPoints: event.target.value }); }}/>
        </Box>
        <Typography sx={{ fontSize: '12px', color: MUTED }}>
          Időzónás időpont, például {example}. Üresen hagyva bármikor indítható.
          {inCode && (showsCodeWindow ? ' Ez a kódbeli ablak.' : ` A kódbeli ablak: ${windowText(codeWindow)}.`)}
        </Typography>
        <Box sx={{ ...fieldRow, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
          {LANGUAGES.map(language => (
            <TextField key={language} multiline minRows={3} value={form.finishMessage[language]} disabled={inCode}
              label={`Záróüzenet, ${LANGUAGE_NAMES[language]} (nem kötelező)`}
              placeholder={language === 'hu' ? 'Üres: az online forduló szokásos köszönete és az eredmények csütörtöki közzététele.'
                : 'Üres: a másik nyelvé látszik.'}
              onChange={(event) => { languageText('finishMessage', language, event.target.value); }}/>
          ))}
        </Box>
      </Card>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="outlined" href={competitionPath(props.data.id)}>Mégse</Button>
        <Button variant="contained" type="submit" disabled={props.busy}>Tovább: ellenőrzés</Button>
      </Stack>
      <Typography sx={{ fontSize: '12px', color: MUTED }}>
        Semmi nem kerül az adatbázisba a mentésig. A félkész változtatás csak ezen az oldalon marad meg.
      </Typography>
    </Stack>
  );
}

/// What the rules page and the end of the round tell a team, line by line.
export function rulesLines(competition: CompetitionConfig): [string, string][] {
  const { relay, strategy } = competition;
  const languages = competition.languages.map(each => LANGUAGE_NAMES[each]);
  const points = relay?.problems.map(each => each.points) ?? [];
  const finish = competition.finishMessage;
  return [
    ['Nyelv', languages.length > 1 ? `${languages.join(' és ')}, a csapat választ` : languages.join('')],
    ['Indítás', windowText(competition.startWindow ?? null)],
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

function ReviewStep(props: {
  competition: CompetitionConfig, result: CompetitionWriteResultDto, busy: boolean,
  onBack: () => void, onSave: () => void,
}) {
  const { errors, warnings } = props.result;
  return (
    <Stack sx={{ gap: '18px' }}>
      {errors.length > 0 && <Card tone="danger" title={`${errors.length} hiba, ezek miatt még nem menthető`}>
        <MessageList messages={errors}/>
      </Card>}
      {warnings.length > 0 && <Card tone="warning" title={`${warnings.length} figyelmeztetés`}>
        <MessageList messages={warnings}/>
      </Card>}
      <Card title="Amit a csapat a szabályok oldalon lát">
        <Box component="dl" sx={{ margin: 0 }}>
          {rulesLines(props.competition).map(([name, value]) => (
            <Stack key={name} sx={{ flexDirection: 'row', gap: '10px', padding: '6px 0', fontSize: '14px',
              borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 0 } }}>
              <Box component="dt" sx={{ color: MUTED, fontSize: '13px', minWidth: '170px' }}>{name}</Box>
              <Box component="dd" sx={{ margin: 0, whiteSpace: 'pre-wrap' }}>{value}</Box>
            </Stack>
          ))}
        </Box>
      </Card>
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

function MessageList({ messages }: { messages: string[] }) {
  return (
    <Box component="ul" sx={{ margin: 0, paddingLeft: '20px', fontSize: '14px', display: 'flex', flexDirection: 'column',
      gap: '6px' }}>
      {messages.map(message => <li key={message}>{message}</li>)}
    </Box>
  );
}
