import { Box, Stack } from '@mui/system';
import { useAddMinutes, useGetLogs, useMatchState, useResetRelay, useResetStrategy } from '../hooks/user-hooks';
import { Button, IconButton, Tooltip } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Refresh from '@mui/icons-material/Refresh';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { Dispatch, ReactNode, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { TeamModelDto, MatchStatus, PageState, adminTeamId } from '../dto/TeamStateDto';
import { formatTime } from '../utils/DateFormatter';
import { ErrorMessage, Field, FieldProps } from 'formik';
import Form from "./form";
import { useSnackbar } from 'notistack';
import { ConfirmDialogInterface } from './ConfirmDialog';
import { Countdown } from './Countdown';
import { relayProblemResults, STRATEGY_POINTS_BY_LOSSES } from 'game';
import { RelayResultsTable, SOLVED_ON_TRY, StrategyGamesTable, UNANSWERED, WRONG } from './ResultTables';
import * as Yup from 'yup';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

type MatchKind = 'relay' | 'strategy';

export const TEAM_DIALOG_TITLE_ID = 'team-dialog-title';

const BORDER = '#e6e0c8';
const DIVIDER = '#efe9d4';
const MUTED = '#5f6368';

/// `page` is the team's own `/admin/<teamId>` tab, where the team's name is the
/// page's title and links back to the list. In the dialog the name is an h2,
/// which names the dialog (`TEAM_DIALOG_TITLE_ID`).
export function TeamDetailDialog(props: {
  data: TeamModelDto,
  setConfirmDialog: Dispatch<ConfirmDialogInterface | null>,
  page?: boolean,
}) {
  const [teamState, setTeamState] = useState(props.data);
  // The cards sit one level under the team's name.
  const heading = props.page ? 'h2' : 'h3';

  return (
    <Stack
      sx={{
        width: "1200px",
        maxWidth: "100%",
        fontSize: 14,
        backgroundColor: props.page ? 'transparent' : '#fffdf5',
      }}>
      <Header team={teamState} page={props.page}/>
      <Stack sx={{ gap: '20px', padding: { xs: '16px 12px 24px', md: '24px 32px 32px' } }}>
        <MatchCard kind="relay" heading={heading} teamName={teamState.teamName} status={teamState.relayMatch} setConfirmDialog={props.setConfirmDialog}/>
        <MatchCard kind="strategy" heading={heading} teamName={teamState.teamName} status={teamState.strategyMatch} setConfirmDialog={props.setConfirmDialog}/>
        <DangerZone heading={heading} team={teamState} setTeamState={setTeamState} setConfirmDialog={props.setConfirmDialog}/>
      </Stack>
    </Stack>
  )
}

function Header(props: { team: TeamModelDto, page?: boolean }) {
  const { team } = props;
  return <>
    <Stack sx={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      gap: '12px 24px',
      padding: { xs: '20px 16px 16px', md: '24px 32px 20px' },
      backgroundColor: props.page ? 'transparent' : '#fff',
      borderBottom: props.page ? 'none' : `1px solid ${BORDER}`,
    }}>
      <Stack sx={{ gap: '2px', minWidth: 0 }}>
        {props.page
          ? <Box component="a" href="/admin" sx={{ fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'primary.main', display: 'inline-flex', alignItems: 'center' }}>
            <ChevronLeft fontSize="small"/>Admin felület
          </Box>
          : <Box sx={{ fontSize: 12, fontWeight: 500, color: MUTED }}>Csapat</Box>}
        <Box component={props.page ? 'h1' : 'h2'} id={props.page ? undefined : TEAM_DIALOG_TITLE_ID} sx={{ margin: 0, fontSize: { xs: 22, md: props.page ? 32 : 28 }, fontWeight: 600, lineHeight: 1.2 }}>
          {team.teamName}
        </Box>
        <PageStateLine pageState={team.pageState}/>
      </Stack>
      <Total team={team}/>
    </Stack>
    <Stack sx={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '4px 24px',
      padding: { xs: '8px 16px', md: props.page ? '0 32px' : '8px 32px' },
      backgroundColor: props.page ? 'transparent' : '#fff',
      borderBottom: props.page ? 'none' : `1px solid ${BORDER}`,
      fontSize: 13,
      color: MUTED,
    }}>
      <HiddenField label="E-mail" value={team.email}/>
      <HiddenField label="Belépési kód" value={team.joinCode}/>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px', marginLeft: { sm: 'auto' } }}>
        <Refresh sx={{ fontSize: 16 }}/>Friss adatokért töltsd újra az oldalt.
      </Stack>
    </Stack>
  </>;
}

const PAGE_STATE_LABEL: Record<PageState, string> = {
  DISCLAIMER: 'Tájékoztató oldalon',
  HOME: 'Kezdőlapon',
  RELAY: 'A váltó oldalán',
  STRATEGY: 'A stratégiás játék oldalán',
};

/// The raw value beside the label is what the list's Állapot column shows.
function PageStateLine(props: { pageState: PageState }) {
  return (
    <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: '4px', fontSize: 13, color: MUTED }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '4px', backgroundColor: 'primary.main' }}/>
      <span>
        Most: <Box component="b" sx={{ color: 'text.primary', fontWeight: 500 }}>{PAGE_STATE_LABEL[props.pageState]}</Box>
        {' ('}<Box component="code" sx={{ fontSize: 11 }}>{props.pageState}</Box>{')'}
        {/* `allowedToStart` in the backend refuses a match from this page. */}
        {props.pageState === 'DISCLAIMER' && ' · még nem indíthat játékot'}
      </span>
      <HelpButton label="Most" help="Melyik oldalt látja a csapat. A játék oldalán a vége után is ott marad, amíg vissza nem lép."/>
    </Stack>
  );
}

const MATCH_NAME: Record<MatchKind, string> = { relay: 'váltó', strategy: 'stratégia' };

/// The total so far, marked as not final until both matches have finished: a
/// running match's points are its game's points at the moment they were fetched.
function Total(props: { team: TeamModelDto }) {
  const relay = useMatchPoints(props.team.relayMatch);
  const strategy = useMatchPoints(props.team.strategyMatch);
  const statuses = { relay: props.team.relayMatch, strategy: props.team.strategyMatch };
  const final = statuses.relay.state === 'FINISHED' && statuses.strategy.state === 'FINISHED';
  const notStarted = statuses.relay.state === 'NOT STARTED' && statuses.strategy.state === 'NOT STARTED';
  const sum = relay === undefined || strategy === undefined ? undefined : relay + strategy;
  const part = (kind: MatchKind, points: number | undefined) => {
    const state = statuses[kind].state;
    return `${MATCH_NAME[kind]} ${points ?? '?'}${state === 'IN PROGRESS' ? ', még tart' : state === 'NOT STARTED' ? ' (nem kezdte el)' : ''}`;
  };
  return (
    <Stack sx={{ marginLeft: 'auto', alignItems: 'flex-end', textAlign: 'right' }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: 12, fontWeight: 500, color: MUTED }}>
        {final ? 'Összesen' : 'Eddig összesen'}
        {!final && <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: '10px', backgroundColor: '#fff4e5', color: '#8a4b00', fontSize: 11, fontWeight: 600 }}>
          nem végleges
        </Box>}
      </Stack>
      <Box data-testid="teamTotal" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 700, lineHeight: 1.1, color: notStarted ? '#757575' : 'text.primary' }}>
        {sum ?? '?'} <Box component="span" sx={{ fontSize: { xs: 14, md: 16 }, fontWeight: 400 }}>pont</Box>
      </Box>
      <Box sx={{ fontSize: 12, color: MUTED }}>
        {notStarted ? 'még egyik fordulót sem kezdték el' : `${part('relay', relay)} + ${part('strategy', strategy)}`}
      </Box>
    </Stack>
  );
}

const cardSx = { backgroundColor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px' } as const;
const cardHeaderSx = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px 12px',
  padding: { xs: '14px 16px', md: '16px 24px' },
} as const;
const cardFooterSx = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px 16px',
  padding: { xs: '14px 16px', md: '12px 24px' },
  backgroundColor: '#fbf9f1',
  borderTop: `1px solid ${DIVIDER}`,
  borderRadius: '0 0 12px 12px',
} as const;
const cardTitleSx = { margin: 0, fontSize: 18, fontWeight: 600 } as const;

const STATUS_CHIP: Record<MatchStatus['state'], { label: string, color: string, background: string }> = {
  'NOT STARTED': { label: 'Nem kezdte el', color: '#424242', background: '#eeeeee' },
  'IN PROGRESS': { label: 'Folyamatban', color: '#0d47a1', background: '#e3f2fd' },
  'FINISHED': { label: 'Végzett', color: '#1b5e20', background: '#e8f5e9' },
};

function StatusChip(props: { state: MatchStatus['state'] }) {
  const chip = STATUS_CHIP[props.state];
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: 26, padding: '0 10px', borderRadius: '13px', fontSize: 12, fontWeight: 600, color: chip.color, backgroundColor: chip.background }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '4px', backgroundColor: 'currentColor' }}/>
      {chip.label}
    </Box>
  );
}

function MatchCard(props: { kind: MatchKind, heading: 'h2' | 'h3', teamName: string, status: MatchStatus, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const title = props.kind === 'relay' ? 'Váltó' : 'Stratégia';
  const status = props.status;
  if (status.state === 'NOT STARTED') {
    return (
      <Stack component="section" aria-label={title} sx={cardSx}>
        <Stack sx={cardHeaderSx}>
          <Box component={props.heading} sx={cardTitleSx}>{title}</Box>
          <StatusChip state={status.state}/>
        </Stack>
      </Stack>
    );
  }
  return (
    <Stack component="section" aria-label={title} sx={cardSx}>
      <Stack sx={{ ...cardHeaderSx, borderBottom: `1px solid ${DIVIDER}` }}>
        <Box component={props.heading} sx={cardTitleSx}>{title}</Box>
        <StatusChip state={status.state}/>
        <HeaderMetric kind={props.kind} status={status}/>
      </Stack>
      <Stack sx={{ gap: '20px', padding: { xs: '16px', md: '20px 24px' } }}>
        <MatchDetails kind={props.kind} status={status}/>
      </Stack>
      <MatchTools kind={props.kind} teamName={props.teamName} status={status} setConfirmDialog={props.setConfirmDialog}/>
    </Stack>
  );
}

/// The number an organiser looks for first: how long a running match has
/// left, or what a finished one scored.
function HeaderMetric(props: { kind: MatchKind, status: Exclude<MatchStatus, { state: 'NOT STARTED' }> }) {
  const { data } = useMatchStateData(props.status.matchID);
  const metricSx = { marginLeft: 'auto', textAlign: 'right' } as const;
  const labelSx = { fontSize: 12, color: MUTED } as const;
  const valueSx = { fontSize: { xs: 20, md: 24 }, fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' } as const;
  if (props.status.state === 'IN PROGRESS') {
    return data ? (
      <Box sx={metricSx}>
        <Box sx={labelSx}>Hátralévő idő</Box>
        <Box sx={valueSx} data-testid={`${props.kind}Remaining`}><RemainingTime end={data.G.end}/></Box>
      </Box>
    ) : null;
  }
  const points = data?.G.points ?? props.status.score;
  // A finished relay's status carries every problem's max, so the max needs no
  // fetch; the problem set is fixed when the match starts.
  const max = props.kind === 'strategy'
    ? STRATEGY_POINTS_BY_LOSSES[0]
    : props.status.relayResults?.reduce((sum, it) => sum + it.maxPoints, 0);
  return (
    <Box sx={metricSx}>
      <Box sx={labelSx}>Pontszám</Box>
      <Box sx={valueSx}>
        {points}
        {max !== undefined && <Box component="span" sx={{ fontSize: 14, fontWeight: 400, color: MUTED }}> / {max}</Box>}
      </Box>
    </Box>
  );
}

/// Keyed by the end, so added minutes restart the countdown: Countdown, past
/// its last second, waits for a server reading that never comes here.
function RemainingTime(props: { end: string }) {
  return <EndCountdown key={props.end} end={props.end}/>;
}

function EndCountdown(props: { end: string }) {
  const [endTime] = useState(() => new Date(props.end));
  // Read once: Countdown re-measures the clock whenever this changes.
  const [serverRemainingMs] = useState(() => endTime.getTime() - Date.now());
  const [msRemaining, setMsRemaining] = useState(serverRemainingMs);
  return <Countdown
    msRemaining={msRemaining}
    setMsRemaining={setMsRemaining}
    endTime={endTime}
    getServerTimer={() => undefined}
    serverRemainingMs={serverRemainingMs}
  />;
}

/// `describeChild`: the help is the button's description, read after its name.
/// Without it a string title becomes the button's name, and the button's own
/// `aria-label` overrides it, so a screen reader never reads the help.
function HelpButton(props: { label: string, help: string }) {
  return (
    <Tooltip title={props.help} describeChild enterTouchDelay={0}>
      <IconButton size="small" aria-label={`Mit jelent: ${props.label}`} sx={{ padding: '2px', color: MUTED }}>
        <InfoOutlined sx={{ fontSize: 15 }}/>
      </IconButton>
    </Tooltip>
  );
}

function Fact(props: { label: string, help?: string, children: ReactNode }) {
  return (
    <Box>
      <Stack component="dt" sx={{ flexDirection: 'row', alignItems: 'center', gap: '2px', margin: '0 0 2px', fontSize: 12, color: MUTED }}>
        {props.label}
        {props.help && <HelpButton label={props.label} help={props.help}/>}
      </Stack>
      <Box component="dd" sx={{ margin: 0, fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{props.children}</Box>
    </Box>
  );
}

const LEGEND: { label: string, background: string }[] = [
  ...SOLVED_ON_TRY.map((background, idx) => ({ label: `${idx + 1}. próbára`, background })),
  { label: 'hibás', background: WRONG },
  { label: 'nincs válasz', background: UNANSWERED },
];

/// The colours of RelayResultsTable, which teams see without a key.
function RelayLegend() {
  return (
    <Stack component="ul" aria-label="Jelmagyarázat" sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '6px 18px', margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: MUTED }}>
      {LEGEND.map(it => <Stack component="li" key={it.label} sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
        <Box sx={{ width: 14, height: 14, border: '1px solid #bdbdbd', borderRadius: '3px', background: it.background }}/>
        {it.label}
      </Stack>)}
    </Stack>
  );
}

function MatchDetails(props: { kind: MatchKind, status: Exclude<MatchStatus, { state: 'NOT STARTED' }> }) {
  const { status } = props;
  const inProgress = status.state === 'IN PROGRESS';
  const { data, error } = useMatchStateData(status.matchID);
  if (!data) {
    // SWR keeps retrying, so an error clears once a request succeeds.
    return error
      ? <Box sx={{ color: 'error.main' }}>A játék állását nem sikerült betölteni.</Box>
      : <Box sx={{ color: MUTED }}>A játék állása töltődik…</Box>;
  }
  // Which match this is, read off the payload rather than taken on trust from
  // the card — see MatchStateDto.
  const relayG = props.kind === 'relay' && 'currentProblem' in data.G ? data.G : null;
  const strategyG = props.kind === 'strategy' && 'numberOfTries' in data.G ? data.G : null;
  // A live game is counted when it starts and recorded when it ends, so while
  // one is being played there is one try more than there are results.
  const gameInPlay = inProgress && strategyG !== null && strategyG.numberOfTries > strategyG.liveResults.length;
  return <>
    <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', margin: 0 }}>
      <Fact label="Kezdés">{formatTime(status.startAt)}</Fact>
      <Fact label="Vége">{formatTime(new Date(data.G.end))}</Fact>
      {relayG && <Fact label="Aktuális feladat">{relayG.currentProblem + 1}.</Fact>}
      {strategyG && <Fact label="Próbálkozások" help="Az elkezdett éles játszmák száma, a most futót is beleértve. A táblázatban csak a befejezettek vannak, ezért játszma közben eggyel több.">
        {strategyG.numberOfTries}
      </Fact>}
      <Fact label="Pontszám">{data.G.points}</Fact>
    </Box>
    {relayG && <Stack sx={{ gap: '10px' }}>
      <RelayResultsTable problems={relayProblemResults(relayG)} details transposeOnPhone
        answers={relayG.previousAnswers.map(answers => answers.map(it => it.answer))}
        current={inProgress ? relayG.currentProblem : undefined}/>
      <RelayLegend/>
    </Stack>}
    {strategyG && (strategyG.liveResults.length > 0 || gameInPlay) && <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' }}>
      <StrategyGamesTable results={strategyG.liveResults}/>
      {gameInPlay && <Box sx={{ fontSize: 13, color: MUTED }}>
        A {strategyG.numberOfTries}. játszma most tart, a táblázatba a végén kerül be.
      </Box>}
    </Stack>}
  </>;
}

const LOGS_HINT: Record<MatchKind, string> = {
  relay: 'A váltó nyers eseménynaplója hibakereséshez.',
  strategy: 'A stratégiás játék nyers eseménynaplója hibakereséshez.',
};

/// Adding minutes, for a running match only, and the match's log.
function MatchTools(props: { kind: MatchKind, teamName: string, status: Exclude<MatchStatus, { state: 'NOT STARTED' }>, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const { status } = props;
  const addMinutes = useAddMinutes();
  const getLogs = useGetLogs();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate } = useSWRConfig();
  const [matchLogs, setMatchLogs] = useState<unknown | null>(null);

  const showLogs = async () => {
    try {
      setMatchLogs(await getLogs(status.matchID));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Váratlan hiba történt";
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Stack sx={cardFooterSx}>
      {status.state === 'IN PROGRESS' && <Form
        initialValues={{ time: '' }}
        validationSchema={Yup.object().shape({
          time: Yup.number()
            .integer('Egész számot kell írni')
            .typeError('Számot kell írni')
            .required('Nincs megadva érték')
        })}
        onSubmit={(values) => {
          props.setConfirmDialog({
            text: `Erősítsd meg, hogy ${props.teamName} csapatnak meg akarod növelni az idejét ${values.time} perccel`,
            confirm: async () => {
              try {
                await addMinutes(status.matchID, values.time);
                // The match's new `G.end`, which the end and the countdown read.
                await mutate(matchStateKey(status.matchID));
                enqueueSnackbar("Sikeres művelet", { variant: 'success' });
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                enqueueSnackbar(message, { variant: 'error' });
              }
            },
          })
        }}>
        <Stack sx={{ gap: '4px' }}>
          <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '8px 10px' }}>
            <Box component="label" htmlFor={`${props.kind}-minutes`} sx={{ fontWeight: 500 }}>Idő hozzáadása</Box>
            <Field name="time">
              {({ field, meta }: FieldProps<string | number>) => <Box
                component="input"
                {...field}
                id={`${props.kind}-minutes`}
                aria-invalid={meta.touched && meta.error !== undefined}
                aria-describedby={meta.touched && meta.error !== undefined ? `${props.kind}-minutes-error` : undefined}
                placeholder="perc"
                inputMode="numeric"
                sx={{ font: 'inherit', height: 40, boxSizing: 'border-box', width: 110, padding: '0 12px', border: '1px solid #9e9e9e', borderRadius: '8px' }}
              />}
            </Field>
            <Button variant="contained" color="primary" type="submit" sx={{ textTransform: 'none', height: 40 }}>
              Hozzáadás
            </Button>
          </Stack>
          <ErrorMessage name="time" render={msg => (
            <Box id={`${props.kind}-minutes-error`} sx={{ color: 'error.main', fontSize: '0.875rem' }}>{msg}</Box>
          )}/>
        </Stack>
      </Form>}
      <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', marginLeft: 'auto' }}>
        <Box sx={{ fontSize: 13, color: MUTED }}>{LOGS_HINT[props.kind]}</Box>
        <Button variant="outlined" color="primary" sx={{ textTransform: 'none', height: 40 }}
          aria-expanded={matchLogs !== null}
          aria-controls={matchLogs === null ? undefined : `${props.kind}-logs`}
          onClick={() => {
            if (matchLogs === null) {
              void showLogs();
            } else {
              setMatchLogs(null);
            }
          }}>
          {matchLogs === null ? 'Logok lekérése' : 'Logok elrejtése'}
        </Button>
      </Stack>
      {matchLogs !== null && <Box id={`${props.kind}-logs`} sx={{ width: '100%', maxHeight: 320, overflow: 'auto', borderRadius: '8px' }}>
        <SyntaxHighlighter language="json" style={tomorrow} customStyle={{ margin: 0 }}>
          {JSON.stringify(matchLogs, null, 2)}
        </SyntaxHighlighter>
      </Box>}
    </Stack>
  );
}

/// The resets, together: both are destructive and both ask first.
function DangerZone(props: { heading: 'h2' | 'h3', team: TeamModelDto, setTeamState: (team: TeamModelDto) => void, setConfirmDialog: Dispatch<ConfirmDialogInterface | null> }) {
  const resetRelay = useResetRelay();
  const resetStrategy = useResetStrategy();
  const { enqueueSnackbar } = useSnackbar();
  const { team } = props;

  const confirmReset = (text: string, reset: (teamId: string) => Promise<TeamModelDto>) => {
    props.setConfirmDialog({
      text,
      confirm: async () => {
        try {
          props.setTeamState(await reset(adminTeamId(team)));
          enqueueSnackbar("Sikeres művelet", { variant: 'success' });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Váratlan hiba történt";
          enqueueSnackbar(message, { variant: 'error' });
        }
      },
    });
  };

  return (
    <Stack component="section" aria-label="Veszélyzóna" sx={{ ...cardSx, borderColor: '#f1c4c4' }}>
      <Stack sx={{ ...cardHeaderSx, borderBottom: '1px solid #f6dada' }}>
        <WarningAmber sx={{ color: '#c62828', fontSize: 20 }}/>
        <Box component={props.heading} sx={{ ...cardTitleSx, color: '#c62828' }}>Veszélyzóna</Box>
        <Box sx={{ fontSize: 13, color: MUTED }}>Mindkettő megerősítést kér.</Box>
      </Stack>
      {/* The match itself is kept; the backend's reset routes note its id in
          the team's notes (`other`). */}
      <ResetRow
        first
        title="Váltó alaphelyzetbe állítása"
        description={<>A váltó NOT STARTED állapotba kerül, a csapat újra elindíthatja. A mostani meccse leválik róla, a pontjai nem számítanak tovább, <b>befejezett váltónál sem</b>. A meccs megmarad, az azonosítója <code>prevrelayid:</code> jelöléssel az Egyéb mezőbe kerül. Ha a csapat épp a váltó oldalán van, a kezdőlapra kerül.</>}
        button="Váltó reset"
        notStarted={team.relayMatch.state === 'NOT STARTED'}
        onClick={() => confirmReset(
          `Erősítsd meg, hogy ${team.teamName} csapatnak alaphelyzetbe akarod állítani a váltó állását. A játék NOT STARTED állapotba kerül, a csapat újra elindíthatja.`,
          resetRelay,
        )}
      />
      <ResetRow
        title="Stratégia alaphelyzetbe állítása"
        description={<>A stratégiás játék NOT STARTED állapotba kerül, a csapat újra elindíthatja. A mostani meccse leválik róla, a pontjai nem számítanak tovább, <b>befejezett játéknál sem</b>. A meccs megmarad, az azonosítója <code>prevstratid:</code> jelöléssel az Egyéb mezőbe kerül. Ha a csapat épp a stratégiás oldalon van, a kezdőlapra kerül.</>}
        button="Stratégia reset"
        notStarted={team.strategyMatch.state === 'NOT STARTED'}
        onClick={() => confirmReset(
          `Erősítsd meg, hogy ${team.teamName} csapatnak alaphelyzetbe akarod állítani a stratégiás állását. A játék NOT STARTED állapotba kerül, a csapat újra elindíthatja.`,
          resetStrategy,
        )}
      />
    </Stack>
  );
}

function ResetRow(props: { first?: boolean, title: string, description: ReactNode, button: string, notStarted: boolean, onClick: () => void }) {
  return (
    <Stack sx={{
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'stretch', sm: 'center' },
      gap: { xs: '10px', sm: '24px' },
      padding: { xs: '14px 16px', md: '14px 24px' },
      borderTop: props.first ? 0 : '1px solid #f6dada',
    }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ fontWeight: 600 }}>{props.title}</Box>
        <Box sx={{ fontSize: 13, color: MUTED, maxWidth: 780, '& code': { fontSize: 12, backgroundColor: '#f5f5f5', padding: '1px 4px', borderRadius: '3px' } }}>
          {props.notStarted ? 'Még nem kezdték el, nincs mit visszaállítani.' : props.description}
        </Box>
      </Box>
      <Button variant="outlined" color="error" disabled={props.notStarted} onClick={props.onClick} sx={{ textTransform: 'none', height: 40, whiteSpace: 'nowrap' }}>
        {props.button}
      </Button>
    </Stack>
  );
}

/// One SWR key per match, so every field of the dialog reading the same match
/// shares one request.
function matchStateKey(matchId: string) {
  return [`users/${matchId}`, matchId];
}

function useMatchStateData(matchId: string | null) {
  const matchState = useMatchState();
  return useSWR(matchId === null ? null : matchStateKey(matchId), ([, id]) => matchState(id));
}

/// A match's share of the total so far. A finished match's `score` is its
/// `G.points` as of the list's last load, and the match state the dialog
/// fetches is fresher, for an answer judged just past the end; a running
/// match's points are known only from that fetch.
function useMatchPoints(status: MatchStatus): number | undefined {
  const { data } = useMatchStateData(status.state === "NOT STARTED" ? null : status.matchID);
  if (status.state === "NOT STARTED")
    return 0;
  if (status.state === "IN PROGRESS")
    return data?.G.points;
  return data?.G.points ?? status.score;
}

/// A value shown only on request. The page already holds it, so this guards
/// against a shared screen, not against the admin: an organiser helping a team
/// over a screen share should not show every passer-by the team's contact or
/// its login code. Each opening of the dialog starts hidden again.
function HiddenField(props: { label: string, value: string | undefined }) {
  const [shown, setShown] = useState(false);
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: "6px" }}>
      {props.label}: <Box component="b" sx={{ color: 'text.primary', fontWeight: 500 }}>{shown ? (props.value || "—") : "••••••"}</Box>
      <Button size="small" sx={{ textTransform: "none", minWidth: 0 }} onClick={() => setShown(!shown)}>
        {shown ? "Elrejtés" : "Mutasd"}
      </Button>
    </Stack>
  );
}
