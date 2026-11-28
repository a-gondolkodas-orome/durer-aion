import { Box, Button, Link, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import useSWR from 'swr';
import type { Language, Problem } from 'schemas';
import { LANGUAGES, localizeProblem } from 'schemas';
import type { AdminProblemDto, ProblemUseDto, ProblemWriteResultDto } from '../dto/TeamStateDto';
import { useProblem, useSaveProblem } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';
import { BORDER, DANGER, MUTED } from './adminStyles';
import { SAVED_PARAM, competitionPath, competitionTitle } from './CompetitionTable';
import { Card, ReviewMessages, Steps, WARNING, useLeaveWarning } from './EditPageParts';
import { ExerciseTask } from './ExerciseTask';
import { Loading } from './Loading';
import {
  type ContentForm, FIELD_NAMES, LANGUAGE_NAMES, type ProblemForm, hasContent, problemChanges, problemForm,
  problemFromForm,
} from './problem-form';

// A problem's edit page, /admin/verseny/:competitionId/feladat/:problemId:
// each language's LaTeX beside what a team sees, then a review of what the
// server says, then Save. The problem is shared by id, so the change reaches
// every relay using it, which both steps list; the competition in the path
// is only where the page was opened from and goes back to. One held in code
// changes only with a deploy, and is shown read-only.

const STEPS = ['Feladat', 'Ellenőrzés és mentés'];

export function ProblemEditPage(props: { competitionId: string, problemId: string }) {
  const errorMessage = useErrorMessage();
  const getProblem = useProblem();
  const { data, error } = useSWR(['team/admin/problems', props.problemId],
    ([, id]) => getProblem(id), { revalidateOnFocus: false });
  return (
    <Stack sx={{ padding: '10px', gap: '20px' }} data-testid="problemEditPage">
      {error !== undefined && <Typography role="alert" color="error">{errorMessage(error)}</Typography>}
      {data === undefined && error === undefined && <Loading/>}
      {data !== undefined && <ProblemEditor data={data} competitionId={props.competitionId}/>}
    </Stack>
  );
}

/// The part of an id people recognise a problem by: its slug.
function slug(id: string): string {
  return id.split('--').slice(1).join('--') || id;
}

function describeUse(use: ProblemUseDto): string {
  return `${competitionTitle({ id: use.competitionId, metadata: use.metadata })} · ${use.position}. feladat · ${use.points} pont`;
}

function ProblemEditor({ data, competitionId }: { data: AdminProblemDto, competitionId: string }) {
  const errorMessage = useErrorMessage();
  const saveProblem = useSaveProblem();
  const { enqueueSnackbar } = useSnackbar();
  const [initial] = useState(() => problemForm(data.problem));
  const [form, setForm] = useState(initial);
  const [answerError, setAnswerError] = useState<string | undefined>();
  const [review, setReview] = useState<{ problem: Problem, result: ProblemWriteResultDto } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // Whether each image URL loaded in the preview, the browser's say alone.
  const [loads, setLoads] = useState<Record<string, boolean>>({});
  const dirty = !saved && JSON.stringify(form) !== JSON.stringify(initial);
  const leaving = useLeaveWarning(dirty);
  const back = competitionPath(competitionId);
  const opener = data.uses.find(use => use.competitionId === competitionId);
  const broken = (url: string) => url !== '' && loads[url] === false;
  const brokenImages = LANGUAGES.flatMap((language) => {
    const url = form.content[language].imageUrl.trim();
    return broken(url) ? [`A kép nem töltődik be a böngészőben (${LANGUAGE_NAMES[language]}): ${url}`] : [];
  });

  const send = async (problem: Problem, dryRun: boolean) => {
    setBusy(true);
    try {
      return await saveProblem(problem, { dryRun });
    } catch (e: unknown) {
      enqueueSnackbar(errorMessage(e), { variant: 'error' });
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const toReview = async () => {
    const read = problemFromForm(form, data.problem);
    if ('answerError' in read) {
      setAnswerError(read.answerError);
      return;
    }
    setAnswerError(undefined);
    const result = await send(read.problem, true);
    if (result !== undefined) setReview({ problem: read.problem, result });
  };

  const save = async () => {
    if (review === null) return;
    const result = await send(review.problem, false);
    if (result === undefined) return;
    if (!result.written) {
      // What changed since the dry run, a team starting say, is the report's to say.
      setReview({ ...review, result });
      return;
    }
    setSaved(true);
    leaving.current = true;
    window.location.assign(`${back}?${SAVED_PARAM}=1`);
  };

  const title = opener === undefined ? competitionId
    : competitionTitle({ id: opener.competitionId, metadata: opener.metadata });
  return <>
    <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      <Box component="nav" aria-label="Útvonal" sx={{ fontSize: '14px', color: MUTED }}>
        <Link href="/admin?tab=versenyek">Versenyek</Link>
        {' › '}<Link href={back}>{title}</Link> › {slug(data.problem.id)}
      </Box>
      {dirty && <Box sx={{ marginLeft: 'auto', fontSize: '13px', color: WARNING }}>● Mentetlen változások</Box>}
    </Stack>
    <Stack>
      <Typography component="h1" sx={{ fontSize: '24px', fontWeight: 600 }}>{slug(data.problem.id)}</Typography>
      <Typography sx={{ fontSize: '13px', color: MUTED, fontFamily: 'monospace' }}>{data.problem.id}</Typography>
    </Stack>
    <Steps names={STEPS} step={review === null ? 1 : 2}/>
    {review === null
      ? <ProblemStep form={form} setForm={setForm} answerError={answerError} data={data} busy={busy} dirty={dirty}
        back={back} opener={opener} broken={broken}
        onPictureLoad={(url, loaded) => { setLoads(current => ({ ...current, [url]: loaded })); }}
        onNext={() => { void toReview(); }}/>
      : <ReviewStep before={data.problem} after={review.problem} result={review.result} brokenImages={brokenImages}
        busy={busy} onBack={() => { setReview(null); }} onSave={() => { void save(); }}/>}
  </>;
}

function Uses({ uses }: { uses: ProblemUseDto[] }) {
  return (
    <Card title="Ezekre a versenyekre hat ki">
      {uses.length === 0 ? <Typography sx={{ fontSize: '14px' }}>Egy váltó sem használja.</Typography>
        : <Box component="ul" sx={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
          {uses.map(use => (
            <li key={`${use.competitionId}-${use.position}`}>
              <Link href={competitionPath(use.competitionId)}>{describeUse(use)}</Link>
            </li>
          ))}
        </Box>}
      <Typography sx={{ fontSize: '12px', color: MUTED }}>
        A javítás az ezután induló meccsekre érvényes: egy meccs indulásakor kapja meg a feladatait.
      </Typography>
    </Card>
  );
}

function ProblemStep(props: {
  form: ProblemForm, setForm: (change: (current: ProblemForm) => ProblemForm) => void, answerError?: string,
  data: AdminProblemDto, busy: boolean, dirty: boolean, back: string, opener?: ProblemUseDto, broken: (url: string) => boolean,
  onPictureLoad: (url: string, loaded: boolean) => void, onNext: () => void,
}) {
  const { form, data } = props;
  const inCode = data.storedIn === 'code';
  const updateContent = (language: Language, change: Partial<ContentForm>) => {
    props.setForm(current => ({
      ...current, content: { ...current.content, [language]: { ...current.content[language], ...change } },
    }));
  };
  // What a team sees, from the draft: a language left without content shows
  // another one's, as `localizeProblem` falls back. A draft with no content
  // in any language has nothing to show.
  const draft: Problem = {
    id: data.problem.id, answer: 0,
    content: Object.fromEntries(LANGUAGES.filter(each => hasContent(form.content[each]))
      .map(each => [each, { ...form.content[each], imageUrl: form.content[each].imageUrl.trim() || undefined }])),
  };

  return (
    <Stack component="form" sx={{ gap: '20px' }} noValidate
      onSubmit={(event) => { event.preventDefault(); if (props.dirty) props.onNext(); }}>
      {inCode && <Typography role="note" sx={{ fontSize: '14px', backgroundColor: '#fff', border: `1px solid ${BORDER}`,
        borderRadius: '8px', padding: '16px 24px' }}>
        A kódban tárolt feladat csak telepítéssel változik: itt nem szerkeszthető.
      </Typography>}
      <Uses uses={data.uses}/>
      <Card title="Válasz">
        <TextField label="Válasz" value={form.answer} disabled={inCode || data.answerLocked} sx={{ maxWidth: '240px' }}
          error={props.answerError !== undefined}
          helperText={props.answerError ?? (data.answerLocked
            ? 'Nem változhat: már indult csapat egy versenyben, amely használja.' : 'Egész szám.')}
          onChange={(event) => { const answer = event.target.value; props.setForm(current => ({ ...current, answer })); }}/>
      </Card>
      {LANGUAGES.map((language) => {
        const content = form.content[language];
        const broken = props.broken(content.imageUrl.trim());
        const name = LANGUAGE_NAMES[language];
        return (
          <Card key={language} title={name[0].toUpperCase() + name.slice(1)}>
            <Box sx={{ display: 'grid', gap: '24px', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <Stack sx={{ gap: '16px' }}>
                <TextField multiline minRows={6} label={`${FIELD_NAMES.problemText}, ${name}`} value={content.problemText}
                  disabled={inCode} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
                  helperText={hasContent(content) ? ' ' : 'Üresen ezen a nyelven a másik nyelv szövege látszik.'}
                  onChange={(event) => { updateContent(language, { problemText: event.target.value }); }}/>
                <TextField label={`${FIELD_NAMES.imageUrl}, ${name} (nem kötelező)`} value={content.imageUrl} disabled={inCode}
                  placeholder="https://durerinfo.hu/…" slotProps={{ inputLabel: { shrink: true } }}
                  error={broken} helperText={broken ? 'A kép nem töltődik be a böngészőben.' : ' '}
                  onChange={(event) => { updateContent(language, { imageUrl: event.target.value }); }}/>
              </Stack>
              <Stack aria-label={`Így látja a csapat, ${name}`} role="region" sx={{ border: `1px solid ${BORDER}`,
                borderRadius: '10px', padding: '22px', gap: '12px', minWidth: 0 }}>
                <Typography sx={{ fontSize: '13px', color: MUTED }}>Így látja a csapat</Typography>
                {Object.keys(draft.content).length === 0 ? <Typography sx={{ fontSize: '14px' }}>Nincs szövege.</Typography>
                  : <Preview problem={draft} language={language} opener={props.opener} onPictureLoad={props.onPictureLoad}/>}
              </Stack>
            </Box>
          </Card>
        );
      })}

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="outlined" href={props.back}>Mégse</Button>
        {!inCode && <Stack sx={{ flexDirection: 'row', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!props.dirty && <Typography sx={{ fontSize: '13px', color: MUTED }}>Még nincs mit menteni.</Typography>}
          <Button variant="contained" type="submit" disabled={props.busy || !props.dirty}>Tovább: ellenőrzés</Button>
        </Stack>}
      </Stack>
      {!inCode && <Typography sx={{ fontSize: '12px', color: MUTED }}>
        Semmi nem kerül az adatbázisba a mentésig. A félkész változtatás csak ezen az oldalon marad meg.
      </Typography>}
    </Stack>
  );
}

function Preview(props: {
  problem: Problem, language: Language, opener?: ProblemUseDto, onPictureLoad: (url: string, loaded: boolean) => void,
}) {
  const { problemText, imageUrl } = localizeProblem(props.problem, props.language);
  return (
    <ExerciseTask task={problemText} serial={props.opener?.position ?? 1}
      availablePoints={props.opener?.points ?? 0} pictureUrl={imageUrl ?? null} language={props.language}
      onPictureLoad={(loaded) => { if (imageUrl !== undefined) props.onPictureLoad(imageUrl, loaded); }}/>
  );
}

function ReviewStep(props: {
  before: Problem, after: Problem, result: ProblemWriteResultDto, brokenImages: string[], busy: boolean,
  onBack: () => void, onSave: () => void,
}) {
  const { errors, warnings } = props.result;
  const changes = problemChanges(props.before, props.after);
  return (
    <Stack sx={{ gap: '18px' }}>
      <ReviewMessages errors={errors} warnings={[...warnings, ...props.brokenImages]}/>
      <Card title="Változások">
        <Box component="dl" sx={{ margin: 0 }}>
          {changes.map(({ name, before, after }) => (
            <Stack key={name} sx={{ gap: '6px', padding: '8px 0', fontSize: '14px', borderBottom: `1px solid ${BORDER}`,
              '&:last-child': { borderBottom: 0 } }}>
              <Box component="dt" sx={{ color: MUTED, fontSize: '13px' }}>{name}</Box>
              <Box component="dd" sx={{ margin: 0, display: 'grid', gap: '12px',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                <Box sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: MUTED }}>Eddig: </Box>
                  {before === '' ? '(nincs)' : before}</Box>
                <Box sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: MUTED }}>Ezután: </Box>
                  {after === '' ? '(nincs)' : after}</Box>
              </Box>
            </Stack>
          ))}
        </Box>
      </Card>
      <Uses uses={props.result.uses}/>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={props.onBack}>Vissza: feladat</Button>
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
