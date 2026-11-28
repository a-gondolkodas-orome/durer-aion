import { Box, Button, Chip, IconButton, TextField, Typography } from '@mui/material';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Visibility from '@mui/icons-material/Visibility';
import { Stack } from '@mui/system';
import { useState } from 'react';
import type { Language } from 'schemas';
import { localizeProblem } from 'schemas';
import type { AdminCompetitionDto } from '../dto/TeamStateDto';
import { BORDER, DANGER, MUTED } from './adminStyles';
import { problemEditPath, slug } from './CompetitionTable';
import { ProblemContentCards } from './ProblemContentCards';
import { ProblemPicker } from './ProblemPicker';
import type { ContentForm } from './problem-form';
import { type EntryErrors, type RelayEntryForm, copyEntry, entryProblemId, move, newEntry, pickedEntries } from './relay-form';

// The relay's problems on the competition's edit page: in play order, each
// one's points, moved up or down, removed, copied, added as new, or picked
// from those the database holds (ProblemPicker.tsx). A held
// problem's text is changed in its own editor, which reaches every relay
// using it; a problem this relay brings is written out here, and saved with
// the competition.

/** What a problem picked from those already held starts at. */
const PICKED_POINTS = '3';

export type RelayEntriesUpdate = (change: (entries: RelayEntryForm[]) => RelayEntryForm[]) => void;

export function RelayEditor(props: {
  entries: RelayEntryForm[], setEntries: RelayEntriesUpdate, errors: Record<string, EntryErrors>,
  data: AdminCompetitionDto, locked: boolean, broken: (url: string) => boolean,
  onPictureLoad: (url: string, loaded: boolean) => void,
}) {
  const { entries, setEntries, data } = props;
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [picking, setPicking] = useState(false);
  const held = new Map(data.relayProblems.map(each => [each.problem.id, each]));
  const language: Language = data.competition.languages[0] ?? 'hu';
  const toggle = (key: string, opened: boolean) => {
    setOpen((current) => {
      const next = new Set(current);
      if (opened) next.add(key);
      else next.delete(key);
      return next;
    });
  };
  const replace = (key: string, change: (entry: RelayEntryForm) => RelayEntryForm) => {
    setEntries(current => current.map(each => each.key === key ? change(each) : each));
  };
  const nextPoints = entries.at(-1)?.points ?? '1';
  const add = () => {
    const entry = newEntry(nextPoints);
    setEntries(current => [...current, entry]);
    toggle(entry.key, true);
  };

  return (
    <Stack sx={{ gap: '12px' }}>
      {props.locked && data.started && <Typography role="note" sx={{ fontSize: '14px' }}>
        Már indult csapat ebben a versenyben: a váltó feladatai, sorrendjük és pontjuk nem változhat.
      </Typography>}
      {entries.length === 0 && <Typography sx={{ fontSize: '14px', color: MUTED }}>Még nincs feladata.</Typography>}
      <Stack component="ol" aria-label="A váltó feladatai" sx={{ margin: 0, padding: 0, listStyle: 'none', gap: '8px' }}>
        {entries.map((entry, index) => {
          const name = `${index + 1}. feladat`;
          const errors = props.errors[entry.key] ?? {};
          const created = entry.created;
          const heldProblem = entry.problemId === undefined ? undefined : held.get(entry.problemId) ?? entry.picked;
          const opened = created !== undefined && (open.has(entry.key) || errors.slug !== undefined
            || errors.answer !== undefined);
          const text = created === undefined ? heldProblem && localizeProblem(heldProblem.problem, language).problemText
            : created.problem.content[language].problemText;
          return (
            <Stack component="li" key={entry.key} aria-label={name}
              sx={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', gap: '12px' }}>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: '24px', fontWeight: 500 }}>{index + 1}.</Box>
                <Stack sx={{ flex: '1 1 260px', minWidth: 0 }}>
                  <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Box component="span" title={entryProblemId(entry)} sx={{ fontWeight: 500 }}>
                      {created === undefined ? slug(entry.problemId ?? '') : created.slug.trim() || '(névtelen)'}
                    </Box>
                    {created !== undefined && <Chip size="small" color="primary" variant="outlined"
                      label={created.copyOf === undefined ? 'új' : `másolat: ${slug(created.copyOf.id)}`}/>}
                    {entry.picked !== undefined && <Chip size="small" color="primary" variant="outlined" label="hozzáadva"/>}
                    {heldProblem !== undefined && heldProblem.uses.length > 1 && <Chip size="small" variant="outlined"
                      label={`${heldProblem.uses.length} helyen használt`}
                      title="A javítása minden versenyre kihat, amely használja. A Másolat csak ebben a váltóban cseréli le."/>}
                  </Stack>
                  <Box sx={{ fontSize: '12px', color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {text}
                  </Box>
                  {(errors.slug ?? errors.answer) !== undefined && !opened &&
                    <Box sx={{ fontSize: '12px', color: DANGER }}>Javítsd a feladatot.</Box>}
                </Stack>
                <TextField size="small" label={`Pont, ${name}`} value={entry.points} disabled={props.locked}
                  error={errors.points !== undefined} helperText={errors.points} sx={{ width: '130px' }}
                  onChange={(event) => { const points = event.target.value; replace(entry.key, each => ({ ...each, points })); }}/>
                <Stack sx={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!props.locked && <>
                    <IconButton size="small" aria-label={`Feljebb: ${name}`} disabled={index === 0}
                      onClick={() => { setEntries(current => move(current, index, -1)); }}><ArrowUpward fontSize="inherit"/></IconButton>
                    <IconButton size="small" aria-label={`Lejjebb: ${name}`} disabled={index === entries.length - 1}
                      onClick={() => { setEntries(current => move(current, index, 1)); }}><ArrowDownward fontSize="inherit"/></IconButton>
                  </>}
                  {created === undefined
                    ? <IconButton size="small" href={problemEditPath(entry.problemId ?? '', data.id)}
                      aria-label={`${heldProblem?.storedIn === 'code' ? 'Megnyitás' : 'Szerkesztés'}: ${name}`}
                      title={heldProblem?.storedIn === 'code' ? 'Megnyitás (kódban tárolt, nem szerkeszthető)'
                        : 'Szerkesztés: minden versenyre kihat, amely használja'}>
                      {heldProblem?.storedIn === 'code' ? <Visibility fontSize="inherit"/> : <Edit fontSize="inherit"/>}
                    </IconButton>
                    : <IconButton size="small" aria-label={`Szerkesztés: ${name}`} aria-expanded={opened}
                      onClick={() => { toggle(entry.key, !opened); }}>
                      {opened ? <ExpandLess fontSize="inherit"/> : <Edit fontSize="inherit"/>}
                    </IconButton>}
                  {!props.locked && heldProblem !== undefined && <IconButton size="small" aria-label={`Másolat: ${name}`}
                    title="Másolat új azonosítóval, amely csak ebben a váltóban cseréli le a feladatot"
                    onClick={() => {
                      const copy = copyEntry(entry, heldProblem.problem);
                      replace(entry.key, () => copy);
                      toggle(copy.key, true);
                    }}><ContentCopy fontSize="inherit"/></IconButton>}
                  {!props.locked && <IconButton size="small" aria-label={`Eltávolítás: ${name}`}
                    title="Csak ebből a váltóból veszi ki, a feladat megmarad"
                    onClick={() => { setEntries(current => current.filter(each => each.key !== entry.key)); }}>
                    <Delete fontSize="inherit"/>
                  </IconButton>}
                </Stack>
              </Stack>
              {opened && <CreatedProblemFields entry={entry} errors={errors} serial={index + 1}
                points={Number(entry.points) || 0} broken={props.broken} onPictureLoad={props.onPictureLoad}
                update={(change) => { replace(entry.key, change); }}/>}
            </Stack>
          );
        })}
      </Stack>
      {!props.locked && <Stack sx={{ flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={add}>+ Új feladat</Button>
        <Button variant="outlined" onClick={() => { setPicking(true); }}>+ Meglévő feladat</Button>
      </Stack>}
      <ProblemPicker open={picking} onClose={() => { setPicking(false); }} language={language} competitionId={data.id}
        inRelay={new Set(entries.map(entryProblemId))} serial={entries.length + 1} points={Number(PICKED_POINTS)}
        onAdd={(picked) => {
          setEntries(current => [...current, ...pickedEntries(picked, PICKED_POINTS)]);
          setPicking(false);
        }}/>
    </Stack>
  );
}

function CreatedProblemFields(props: {
  entry: RelayEntryForm, errors: EntryErrors, serial: number, points: number, broken: (url: string) => boolean,
  onPictureLoad: (url: string, loaded: boolean) => void, update: (change: (entry: RelayEntryForm) => RelayEntryForm) => void,
}) {
  const created = props.entry.created;
  if (created === undefined) return null;
  const change = (update: (current: NonNullable<RelayEntryForm['created']>) => Partial<NonNullable<RelayEntryForm['created']>>) => {
    props.update(entry => entry.created === undefined ? entry
      : { ...entry, created: { ...entry.created, ...update(entry.created) } });
  };
  const updateContent = (language: Language, update: Partial<ContentForm>) => {
    change(current => ({ problem: { ...current.problem, content: {
      ...current.problem.content, [language]: { ...current.problem.content[language], ...update },
    } } }));
  };
  return (
    <Stack sx={{ gap: '16px' }}>
      {created.copyOf !== undefined && <Typography sx={{ fontSize: '13px', color: MUTED }}>
        Másolat erről: {slug(created.copyOf.id)}. A mentéskor új feladat lesz, amely csak ebben a váltóban veszi át a
        helyét: a többi verseny, amely az eredetit használja, nem változik.
      </Typography>}
      <Stack sx={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
        <TextField label="Név az azonosítóban" value={created.slug} sx={{ flex: '1 1 320px' }}
          error={props.errors.slug !== undefined}
          helperText={props.errors.slug ?? `Azonosító: ${created.random}--${created.slug.trim() || '…'} (mentés után nem változik)`}
          slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
          onChange={(event) => { const slugText = event.target.value; change(() => ({ slug: slugText })); }}/>
        <TextField label="Válasz" value={created.problem.answer} sx={{ width: '200px' }}
          error={props.errors.answer !== undefined} helperText={props.errors.answer ?? 'Egész szám.'}
          onChange={(event) => {
            const answer = event.target.value;
            change(current => ({ problem: { ...current.problem, answer } }));
          }}/>
      </Stack>
      <ProblemContentCards content={created.problem.content} onChange={updateContent} serial={props.serial}
        points={props.points} broken={props.broken} onPictureLoad={props.onPictureLoad}/>
    </Stack>
  );
}
