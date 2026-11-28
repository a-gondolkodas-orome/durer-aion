import { Box, Button, Checkbox, Chip, Dialog, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Visibility from '@mui/icons-material/Visibility';
import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { Language, ProblemId } from 'schemas';
import { localizeProblem } from 'schemas';
import type { AdminProblemSearchResultDto } from '../dto/TeamStateDto';
import { useCompetitions, useSearchProblems } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';
import { BORDER, DIALOG_BACKGROUND, MUTED } from './adminStyles';
import { competitionTitle, slug } from './CompetitionTable';
import { ExerciseTask } from './ExerciseTask';
import { Loading } from './Loading';

// The relay editor's picker: the database's problems, found by id or slug or
// by a competition using them, to add to this relay by id. A problem added so
// is shared: a fix to it reaches every relay using it.

const TITLE_ID = 'problem-picker-title';
/** The search waits for the typing to pause. */
const SEARCH_DELAY_MS = 250;

export function ProblemPicker(props: {
  open: boolean, onClose: () => void, onAdd: (picked: AdminProblemSearchResultDto[]) => void,
  /** The problems the relay already has, which are marked and not offered again. */
  inRelay: ReadonlySet<ProblemId>, language: Language, competitionId: string,
  /** Where the first picked problem would go, and at how many points. */
  serial: number, points: number,
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose} aria-labelledby={TITLE_ID} slotProps={{ paper: { sx: {
      width: 760, maxWidth: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' }, margin: { xs: '12px', sm: '32px' },
      borderRadius: '12px', border: `1px solid ${BORDER}`, backgroundColor: DIALOG_BACKGROUND,
    } } }}>
      {props.open && <PickerContent {...props}/>}
    </Dialog>
  );
}

// Mounted only while the picker is open, so each opening starts unselected.
function PickerContent(props: Parameters<typeof ProblemPicker>[0]) {
  const errorMessage = useErrorMessage();
  const getCompetitions = useCompetitions();
  const searchProblems = useSearchProblems();
  const [typed, setTyped] = useState('');
  const [q, setQ] = useState('');
  const [competition, setCompetition] = useState('');
  const [selected, setSelected] = useState<ReadonlyMap<ProblemId, AdminProblemSearchResultDto>>(new Map());
  const [previewed, setPreviewed] = useState<ProblemId | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => { setQ(typed); }, SEARCH_DELAY_MS);
    return () => { clearTimeout(timer); };
  }, [typed]);
  const { data: competitions } = useSWR('team/admin/competitions', getCompetitions);
  const { data, error } = useSWR(['team/admin/problems', q, competition],
    ([, query, id]) => searchProblems({ q: query, ...(id !== '' && { competition: id }) }), { revalidateOnFocus: false });

  const toggle = (result: AdminProblemSearchResultDto, on: boolean) => {
    setSelected((current) => {
      const next = new Map(current);
      if (on) next.set(result.problem.id, result);
      else next.delete(result.problem.id);
      return next;
    });
  };
  // In the order the results show them: a competition's filter gives its relay's.
  const add = () => {
    const shown = data?.problems.filter(({ problem }) => selected.has(problem.id)) ?? [];
    props.onAdd([...shown, ...[...selected.values()].filter(each => !shown.includes(each))]);
  };

  return <>
    <Stack sx={{ padding: { xs: '16px', sm: '20px 24px' }, gap: '4px', backgroundColor: '#fff',
      borderBottom: `1px solid ${BORDER}`, borderRadius: '12px 12px 0 0' }}>
      <Box component="h2" id={TITLE_ID} sx={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Meglévő feladat hozzáadása</Box>
      <Typography sx={{ fontSize: '13px', color: MUTED }}>
        Az adatbázisban tárolt feladatok. A hozzáadott feladat közös: a javítása minden versenyre kihat, amely használja.
      </Typography>
    </Stack>
    <Stack sx={{ padding: { xs: '16px', sm: '16px 24px' }, gap: '12px' }}>
      <Stack sx={{ flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
        <TextField size="small" label="Keresés azonosító vagy név szerint" value={typed} autoFocus
          sx={{ flex: '1 1 260px' }} onChange={(event) => { setTyped(event.target.value); }}/>
        <TextField select size="small" label="Verseny" value={competition} sx={{ flex: '1 1 220px' }}
          onChange={(event) => { setCompetition(event.target.value); }}>
          <MenuItem value="">Bármelyik</MenuItem>
          {(competitions ?? []).map(each => (
            <MenuItem key={each.id} value={each.id}>
              {competitionTitle(each)}{each.id === props.competitionId ? ' (ez a verseny)' : ''}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {error !== undefined && <Typography role="alert" color="error">{errorMessage(error)}</Typography>}
      {data === undefined && error === undefined && <Loading/>}
      {data !== undefined && data.problems.length === 0 &&
        <Typography sx={{ fontSize: '14px', color: MUTED }}>Nincs ilyen feladat az adatbázisban.</Typography>}
      {data !== undefined && data.problems.length > 0 &&
        <Stack component="ul" aria-label="Találatok" sx={{ margin: 0, padding: 0, listStyle: 'none', gap: '6px',
          maxHeight: '55vh', overflowY: 'auto' }}>
          {data.problems.map((result) => {
            const { problem, uses } = result;
            const name = slug(problem.id);
            const present = props.inRelay.has(problem.id);
            const opened = previewed === problem.id;
            const { problemText, imageUrl } = localizeProblem(problem, props.language);
            return (
              <Stack component="li" key={problem.id} aria-label={name}
                sx={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '6px 10px', backgroundColor: '#fff' }}>
                <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <Checkbox size="small" checked={present || selected.has(problem.id)} disabled={present}
                    slotProps={{ input: { 'aria-label': `Kiválasztás: ${name}` } }}
                    onChange={(event) => { toggle(result, event.target.checked); }}/>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Box component="span" sx={{ fontWeight: 500 }}>{name}</Box>
                      <Box component="span" sx={{ fontSize: '12px', color: MUTED, fontFamily: 'monospace' }}>{problem.id}</Box>
                      {present && <Chip size="small" label="már a váltóban"/>}
                    </Stack>
                    <Box sx={{ fontSize: '12px', color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {uses.length === 0 ? 'Egy váltó sem használja.'
                        : `Használja: ${[...new Map(uses.map(use => [use.competitionId, use])).values()]
                          .map(use => competitionTitle({ id: use.competitionId, metadata: use.metadata })).join(', ')}`}
                    </Box>
                  </Stack>
                  <IconButton size="small" aria-label={`Előnézet: ${name}`} aria-expanded={opened}
                    onClick={() => { setPreviewed(opened ? null : problem.id); }}>
                    {opened ? <ExpandLess fontSize="inherit"/> : <Visibility fontSize="inherit"/>}
                  </IconButton>
                </Stack>
                {opened && <Box role="region" aria-label={`Így látja a csapat: ${name}`}
                  sx={{ borderTop: `1px solid ${BORDER}`, marginTop: '6px', padding: '12px 4px 4px' }}>
                  <ExerciseTask task={problemText} serial={props.serial} availablePoints={props.points}
                    pictureUrl={imageUrl ?? null} language={props.language}/>
                  <Typography sx={{ fontSize: '12px', color: MUTED, marginTop: '8px' }}>Válasz: {problem.answer}</Typography>
                </Box>}
              </Stack>
            );
          })}
        </Stack>}
      {data?.truncated === true && <Typography sx={{ fontSize: '12px', color: MUTED }}>
        Csak az első {data.problems.length} találat látszik: szűkítsd a keresést.
      </Typography>}
    </Stack>
    <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: '12px', padding: { xs: '12px 16px', sm: '14px 24px' },
      borderTop: `1px solid ${BORDER}` }}>
      <Button variant="outlined" onClick={props.onClose}>Mégse</Button>
      <Button variant="contained" disabled={selected.size === 0} onClick={add}>
        {selected.size === 0 ? 'Hozzáadás' : `Hozzáadás (${selected.size})`}
      </Button>
    </Stack>
  </>;
}
