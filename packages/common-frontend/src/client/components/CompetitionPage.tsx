import { Box, Chip, Link, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import useSWR from 'swr';
import { editionSchoolYear, localizeProblem } from 'schemas';
import type { CompetitionConfig, Language, Problem } from 'schemas';
import { AdminCompetitionDto, ProblemUseDto } from '../dto/TeamStateDto';
import { useCompetition } from '../hooks/user-hooks';
import { useErrorMessage } from '../utils/error-message';
import { windowText } from '../utils/window-time';
import { BORDER, MUTED } from './adminStyles';
import { ROUND_NAMES, STORED_IN, competitionPath, competitionTitle } from './CompetitionTable';
import { ExerciseTask } from './ExerciseTask';
import { Loading } from './Loading';

// A competition's own admin page, /admin/verseny/:id: its settings, its
// relay's problems with their answers, and each problem as a team sees it.
// Read-only, for in-code and database competitions alike.

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'Magyar', en: 'Angol' };

/// The part of an id people recognise a problem by: its slug.
function slug(id: string): string {
  return id.split('--').slice(1).join('--') || id;
}

function describeUse(use: ProblemUseDto): string {
  return `${competitionTitle({ id: use.competitionId, metadata: use.metadata })} · ${use.position}. · ${use.points} pont`;
}

export function CompetitionPage(props: { competitionId: string }) {
  const errorMessage = useErrorMessage();
  const getCompetition = useCompetition();
  const { data, error } = useSWR(['team/admin/competitions', props.competitionId],
    ([, id]) => getCompetition(id));

  return (
    <Stack sx={{ padding: '10px', gap: '24px' }} data-testid="competitionPage">
      <Box component="nav" aria-label="Útvonal" sx={{ fontSize: '14px', color: MUTED }}>
        <Link href="/admin?tab=versenyek">Versenyek</Link> › {data === undefined ? props.competitionId : competitionTitle(data)}
      </Box>
      {error !== undefined && <Typography role="alert" color="error">{errorMessage(error)}</Typography>}
      {data === undefined && error === undefined && <Loading/>}
      {data !== undefined && <CompetitionDetails data={data}/>}
    </Stack>
  );
}

function CompetitionDetails({ data }: { data: AdminCompetitionDto }) {
  const { competition } = data;
  const [language, setLanguage] = useState<Language>(competition.languages[0] ?? 'hu');
  return <>
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <Typography component="h1" sx={{ fontSize: '24px', fontWeight: 600 }}>{competitionTitle(data)}</Typography>
      <Chip size="small" label={STORED_IN[data.storedIn]}/>
    </Stack>
    <Settings data={data}/>
    {competition.relay !== undefined && <>
      <Stack>
        <Typography component="h2" sx={{ fontSize: '20px', fontWeight: 600 }}>
          Váltó · {competition.relay.problems.length} feladat · {competition.relay.durationMinutes} perc
        </Typography>
        <Typography sx={{ fontSize: '13px', color: MUTED }}>
          Összesen {competition.relay.problems.reduce((sum, { points }) => sum + points, 0)} pont.
          A „Használja” oszlop minden versenyt felsorol, amelyre a feladat javítása kihat.
        </Typography>
      </Stack>
      <RelayTable data={data}/>
      <Stack sx={{ gap: '16px' }}>
        <Typography component="h2" sx={{ fontSize: '20px', fontWeight: 600 }}>Így látja a csapat</Typography>
        {competition.languages.length > 1 && <Tabs value={language} onChange={(_, value: Language) => { setLanguage(value); }}
          aria-label="Nyelv" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {competition.languages.map(each => <Tab key={each} value={each} label={LANGUAGE_NAMES[each]}/>)}
        </Tabs>}
        {data.relayProblems.map(({ problem, points }, index) => (
          <ProblemPreview key={`${index}-${problem.id}`} problem={problem} points={points} serial={index + 1}
            language={language}/>
        ))}
      </Stack>
    </>}
  </>;
}

function Settings({ data }: { data: AdminCompetitionDto }) {
  const { competition } = data;
  const { metadata } = competition;
  const windowSet = JSON.stringify(data.startWindow ?? null) !== JSON.stringify(data.configStartWindow ?? null);
  const rows: [string, string][] = [
    ['Azonosító', competition.id],
    ...(metadata.kind === 'competition' ? [
      ['Kiadás', `${metadata.edition}. (${editionSchoolYear(metadata.edition)})`],
      ['Forduló', ROUND_NAMES[metadata.round]],
      ['Kategória', metadata.category],
    ] satisfies [string, string][] : []),
    ...labelRows('Címke', metadata.label, competition),
    ['Nyelvek', competition.languages.map(each => LANGUAGE_NAMES[each]).join(', ')],
    ['Váltó', competition.relay === undefined ? 'nincs'
      : `${competition.relay.problems.length} feladat · ${competition.relay.durationMinutes} perc`],
    ['Stratégiás játék', competition.strategy === undefined ? 'nincs'
      : `${competition.strategy.gameId} · ${competition.strategy.durationMinutes} perc`],
    ['Indítási ablak', `${windowText(data.startWindow ?? null)}${windowSet ? ' (itt megadva)' : ''}`],
    ['Továbbjutás', competition.advancingPoints === undefined ? 'nincs megadva' : `${competition.advancingPoints} pont`],
    ...labelRows('Befejező üzenet', competition.finishMessage, competition),
  ];
  return (
    <Box sx={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
      <Table size="small" aria-label="Beállítások">
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell component="th" scope="row" sx={{ width: '220px', color: MUTED }}>{label}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/// A row per language a localized text has, under the competition's
/// languages first, so a text missing in one of them shows as missing.
function labelRows(name: string, label: Partial<Record<Language, string>> | undefined, competition: CompetitionConfig):
  [string, string][] {
  if (label === undefined) return [];
  const languages = [...new Set([...competition.languages, ...Object.keys(label) as Language[]])];
  return languages.map(each => [
    languages.length > 1 ? `${name} (${LANGUAGE_NAMES[each].toLowerCase()})` : name,
    label[each] ?? 'hiányzik',
  ]);
}

function RelayTable({ data }: { data: AdminCompetitionDto }) {
  const { languages } = data.competition;
  return (
    <Box sx={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', overflowX: 'auto' }}>
      <Table size="small" aria-label="A váltó feladatai" sx={{ minWidth: '900px' }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Feladat</TableCell>
            <TableCell>Pont</TableCell>
            <TableCell>Válasz</TableCell>
            <TableCell>Nyelvek</TableCell>
            <TableCell>Használja</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.relayProblems.map(({ problem, points, storedIn, uses }, index) => (
            <TableRow key={`${index}-${problem.id}`}>
              <TableCell><Link href={`#feladat-${index + 1}`}>{index + 1}</Link></TableCell>
              <TableCell>
                <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <span title={problem.id} style={{ fontWeight: 500 }}>{slug(problem.id)}</span>
                  <Chip size="small" label={STORED_IN[storedIn]}/>
                </Stack>
                <Box sx={{ fontSize: '12px', color: MUTED, maxWidth: '330px', whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis' }}>
                  {localizeProblem(problem, languages[0] ?? 'hu').problemText}
                </Box>
              </TableCell>
              <TableCell>{points}</TableCell>
              <TableCell>{problem.answer}</TableCell>
              <TableCell>
                <Stack sx={{ flexDirection: 'row', gap: '4px', flexWrap: 'wrap' }}>
                  {languages.map(each => problem.content[each] === undefined
                    ? <Chip key={each} size="small" color="warning" label={`${each.toUpperCase()} hiányzik`}
                      title="Ezen a nyelven egy másik nyelv szövege jelenik meg"/>
                    : <Chip key={each} size="small" color="success" variant="outlined" label={each.toUpperCase()}/>)}
                </Stack>
              </TableCell>
              <TableCell sx={{ fontSize: '13px' }}>
                {/* This competition's own uses unlinked: the page is already open */}
                {uses.map(use => (
                  <Box key={`${use.competitionId}-${use.position}`}>
                    {use.competitionId === data.id ? describeUse(use)
                      : <Link href={competitionPath(use.competitionId)}>{describeUse(use)}</Link>}
                  </Box>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function ProblemPreview(props: { problem: Problem, points: number, serial: number, language: Language }) {
  const { problemText, imageUrl, help1, help2 } = localizeProblem(props.problem, props.language);
  return (
    <Stack id={`feladat-${props.serial}`} sx={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px',
      padding: '22px', gap: '12px' }}>
      <ExerciseTask task={problemText} serial={props.serial} availablePoints={props.points} pictureUrl={imageUrl ?? null}
        language={props.language}/>
      <Typography sx={{ fontSize: '14px' }}>Válasz: <strong>{props.problem.answer}</strong></Typography>
      {help1 !== undefined && <Typography sx={{ fontSize: '14px', color: MUTED }}>1. segítség: {help1}</Typography>}
      {help2 !== undefined && <Typography sx={{ fontSize: '14px', color: MUTED }}>2. segítség: {help2}</Typography>}
    </Stack>
  );
}
