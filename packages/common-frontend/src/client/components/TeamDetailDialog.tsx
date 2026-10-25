import { Stack } from '@mui/system';
import { useAddMinutes, useGetLogs, useMatchState, useResetRelay, useResetStrategy, useRemoveTeam } from '../hooks/user-hooks';
import { Button } from '@mui/material';
import { Dispatch, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { TeamModelDto, MatchStatus, adminTeamId } from '../dto/TeamStateDto';
import { formatTime } from '../utils/DateFormatter';
import { ErrorMessage, Field, FieldProps } from 'formik';
import Form from "./form";
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { ConfirmDialogInterface, DELETE_WORDS } from './ConfirmDialog';
import { relayProblemResults } from 'game';
import { RelayResultsTable, StrategyGamesTable } from './ResultTables';
import * as Yup from 'yup';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

/// `onRemoved` fires once the server has dropped the team, and `onChanged` with
/// the team's new row once an action has changed it: the list this dialog was
/// opened from is stale from that moment, and `data` is read off that list.
export function TeamDetailDialog(props: {
  data: TeamModelDto,
  setConfirmDialog: Dispatch<ConfirmDialogInterface | null>,
  onRemoved: () => void,
  onChanged: (team: TeamModelDto) => void,
}) {
  const resetRelay = useResetRelay();
  const resetStrategy = useResetStrategy();
  const repoRemoveTeam = useRemoveTeam();
  const { enqueueSnackbar } = useSnackbar();
  const team = props.data;
  const [removing, setRemoving] = useState(false);

  const relayPoints = useMatchPoints(team.relayMatch);
  const strategyPoints = useMatchPoints(team.strategyMatch);
  const sum = relayPoints === undefined || strategyPoints === undefined
    ? undefined
    : relayPoints + strategyPoints;

  const removeTeam = async (teamId: string) => {
    setRemoving(true);
    try {
      await repoRemoveTeam(teamId);
      enqueueSnackbar('Csapat törölve', { variant: 'success' });
      props.onRemoved();
    } catch (e: unknown) {
      enqueueSnackbar((e instanceof Error && e.message) || 'Hiba történt', { variant: 'error' });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Stack
      sx={{
        width: "1200px",
        maxWidth: "calc(100% - 12px)",
        padding: "12px",
        fontSize: 14,
      }}>
      <Stack sx={{ fontSize: 24, paddingBottom: "12px" }}>{team.teamName}</Stack>
      <Stack sx={{ paddingBottom: "24px" }}>
        <HiddenField label="E-mail" value={team.email}/>
        <HiddenField label="Belépési kód" value={team.joinCode}/>
      </Stack>
      <Stack sx={{ fontSize: 16 }}>Relay:</Stack>
      <MatchStatusField key={`relay ${matchKey(team.relayMatch)}`} name={team.teamName} data={team.relayMatch} isRelay={true} setConfirmDialog={props.setConfirmDialog} onChanged={props.onChanged}/>
      {team.relayMatch.state !== "NOT STARTED" && <Button sx={{
        maxWidth: "125px",
      }}
          onClick={() => {
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${team.teamName} csapatnak alaphelyzetbe akarod állítani a váltó állását. A játék NOT STARTED állapotba kerül, a csapat újra elindíthatja.`,
              confirm: async () => {
                try {
                  props.onChanged(await resetRelay(adminTeamId(team)));
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                  enqueueSnackbar(message, { variant: 'error' });
                }
              },
            })
          }}
        >reset</Button>}

      <Stack sx={{ fontSize: 16, marginTop: "24px" }}>Strategy:</Stack>
        <MatchStatusField key={`strategy ${matchKey(team.strategyMatch)}`} name={team.teamName} data={team.strategyMatch} isRelay={false} setConfirmDialog={props.setConfirmDialog} onChanged={props.onChanged}/>
      {team.strategyMatch.state !== "NOT STARTED" && <Button sx={{
        maxWidth: "125px",
      }}
          onClick={() => {
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${team.teamName} csapatnak alaphelyzetbe akarod állítani a stratégiás állását. A játék NOT STARTED állapotba kerül, a csapat újra elindíthatja.`,
              confirm: async () => {
                try {
                  props.onChanged(await resetStrategy(adminTeamId(team)));
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                  enqueueSnackbar(message, { variant: 'error' });
                }
              },
            })
          }}
          >reset
      </Button>}
      <Stack sx={{ fontSize: 24, marginTop: "24px" }}>Összesen: {sum ?? "?"} pont</Stack>
      <Stack sx={{ marginTop: "24px", padding: "12px", border: "1px solid", borderColor: "error.main", borderRadius: "4px", maxWidth: 400 }}>
        <Stack sx={{ fontSize: 16, fontWeight: "bold", color: "error.main" }}>Veszélyzóna</Stack>
        <Button
          sx={{ maxWidth: "200px", margin: "10px 0" }}
          color="error"
          variant="contained"
          disabled={removing}
          onClick={() => {
            props.setConfirmDialog({
              text: `Biztosan törlöd a(z) ${team.teamName} csapatot? A verseny közben semmiképpen se törölj csapatokat.`,
              requiredWords: DELETE_WORDS,
              confirm: async () => removeTeam(adminTeamId(team)),
            });
          }}
        >
          Csapat törlése
        </Button>
      </Stack>
    </Stack>
  )
}

/// Remounts the field for another match, so the logs fetched for one are not
/// shown under the next.
function matchKey(status: MatchStatus) {
  return status.state === "NOT STARTED" ? "" : status.matchID;
}

function MatchStatusField(props: { name: string, data: MatchStatus, isRelay: boolean, setConfirmDialog: Dispatch<ConfirmDialogInterface | null>, onChanged: (team: TeamModelDto) => void }) {
  const theme = useTheme();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const getLogs = useGetLogs();
  const [matchLogs, setMatchLogs] = useState<unknown | null>(null);
  const { mutate } = useSWRConfig();

  const showLogs = async (matchId: string) => {
    try {
      setMatchLogs(await getLogs(matchId));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Váratlan hiba történt";
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  switch (props.data.state) {
    case "IN PROGRESS": {
      const inProgressState = props.data
      return (
        <><Stack>
          Folyamatban <br/>
          team-state-start: {formatTime(inProgressState.startAt)}<br/>
          team-state-end: {formatTime(inProgressState.endAt)}<br/>
        </Stack>
        <Stack><MatchStatusDataField matchId={inProgressState.matchID} isRelay={props.isRelay} inProgress/></Stack>
        <Form
        initialValues={{ time: '' }}
        validationSchema={Yup.object().shape({
          time: Yup.number()
            .integer('Egész számot kell írni')
            .typeError('Számot kell írni')
            .required('Nincs megadva érték')
          })}
        onSubmit={(values) => {
          props.setConfirmDialog({
            text: `Erősítsd meg, hogy ${props.name} csapatnak meg akarod növelni az idejét ${values.time} perccel`,
            confirm: async () => {
              try {
                const changed = await addMinutes(inProgressState.matchID, values.time);
                // The match's new `G.end`, which its end and countdown below
                // read, and the team's new `endAt`, which team-state-end reads.
                await mutate(matchStateKey(inProgressState.matchID));
                props.onChanged(changed);
                enqueueSnackbar("Sikeres művelet", { variant: 'success' });
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                enqueueSnackbar(message, { variant: 'error' });
              }
            },
          })
        }}>
        <Stack sx={{ display: "flex", flexDirection: "row", margin: "15px" }}>
        <Field
          name="time"
        >
        {
          ({
            field,
          }: FieldProps<string | number>) => <input
            {...field}
            className="text-input"
            placeholder="perc"
            style={{
              width: '200px',
              borderWidth: '2px',
              borderColor: theme.palette.primary.main,
            }}
          />
        }</Field>
        <Button sx={{
          width: '150px',
          alignSelf: 'center',
          textTransform: 'none',
        }} variant='contained' color='primary' type="submit">
          idő hozzáadása
        </Button></Stack>
        <ErrorMessage name="time" render={msg => (
          <Stack sx={{ color: 'red', fontSize: '0.875rem' }}>
            {msg}
          </Stack>
        )}/>
      </Form>
      <Button
      sx={{
        width: '200px',
        textTransform: 'none',
      }}
      variant='contained'
      color='primary'
      onClick={() => {
        void showLogs(inProgressState.matchID);
      }}>logok Lekérése</Button>
      <Button
      sx={{
        width: '200px',
        textTransform: 'none',
      }}
      variant='contained'
      color='secondary'
      onClick={() => {
        setMatchLogs(null);
      }}>logok elrejtése</Button>
      {matchLogs && <SyntaxHighlighter language="json" style={tomorrow}>
      {JSON.stringify(matchLogs, null, 2)}
    </SyntaxHighlighter>}
      </>
      )
    }
    case "FINISHED": {
      const finishedState = props.data
      return (
        <Stack>
          Végzett <br/>
          start: {formatTime(finishedState.startAt)}<br/>
          end: {formatTime(finishedState.endAt)}<br/>

          <Stack><MatchStatusDataField matchId={finishedState.matchID} isRelay={props.isRelay}/></Stack>
          <Button
          sx={{
            width: '200px',
            textTransform: 'none',
          }}
          variant='contained'
          color='primary'
          onClick={() => {
            void showLogs(finishedState.matchID);
          }}>logok Lekérése</Button>
          <Button
          sx={{
            width: '200px',
            textTransform: 'none',
          }}
          variant='contained'
          color='secondary'
          onClick={() => {
            setMatchLogs(null);
          }}>logok elrejtése</Button>
          <>{matchLogs && <SyntaxHighlighter language="json" style={tomorrow}>
      {JSON.stringify(matchLogs, null, 2)}
    </SyntaxHighlighter>}</>
        </Stack>
      )
    }
      case "NOT STARTED":
        return (
          <Stack>
            Nem kezdte el
          </Stack>
        )
  }
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

/// A match's share of the total, `undefined` while it runs, so a mid-round
/// total never reads as final. A finished match's `score` is its `G.points` as
/// of the list's last load; the match state the dialog fetches is fresher, for
/// an answer judged just past the end.
function useMatchPoints(status: MatchStatus): number | undefined {
  const { data } = useMatchStateData(status.state === "FINISHED" ? status.matchID : null);
  if (status.state === "NOT STARTED")
    return 0;
  if (status.state === "IN PROGRESS")
    return undefined;
  return data?.G.points ?? status.score;
}

/// SWR keeps retrying a failed request, so an error with no data clears once
/// one succeeds, and an error beside data means the shown state is the last
/// one that loaded.
function MatchStatusDataField(props: { matchId: string, isRelay: boolean, inProgress?: boolean }) {
  const { data, error } = useMatchStateData(props.matchId);
  if (!data) {
    return error
      ? <Stack sx={{ color: 'error.main' }}>A játék állását nem sikerült betölteni.</Stack>
      : <Stack>A játék állása töltődik…</Stack>;
  }
  // Which match this is, read off the payload rather than taken on trust from
  // isRelay — see MatchStateDto.
  const relayG = 'currentProblem' in data.G ? data.G : null;
  const strategyG = 'numberOfTries' in data.G ? data.G : null;
  return (<>
  <Stack>
      { error && <Stack sx={{ color: 'error.main' }}>A játék állását nem sikerült frissíteni, a lenti adatok elavultak lehetnek.</Stack>}
      { props.isRelay && relayG && <Stack>Aktuális feladatszám: {relayG.currentProblem + 1}</Stack>}
      { !props.isRelay && strategyG && <Stack>próbálkozások száma: {strategyG.numberOfTries}</Stack>}
      { !props.isRelay && strategyG && <StrategyGamesTable results={strategyG.liveResults}/>}
      <Stack>Befejezés dátuma: {formatTime(new Date(data.G.end))}</Stack>
      <Stack>pontszám: { data.G.points }</Stack>
      <Stack>Hátralévő idő: <RemainingTime end={new Date(data.G.end)}/></Stack>
      { props.isRelay && relayG && <RelayResultsTable problems={relayProblemResults(relayG)} details
        answers={relayG.previousAnswers.map(answers => answers.map(it => it.answer))}
        current={props.inProgress ? relayG.currentProblem : undefined}/>}
    </Stack>
  </>)
}

/// Read off `G.end` each second rather than through `Countdown`, whose last
/// second waits on a server refresh the dialog has none of. The admin needs a
/// correct clock: it stops at zero, and follows minutes added after that.
function RemainingTime(props: { end: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);
  const seconds = Math.max(0, Math.floor((props.end.getTime() - now) / 1000));
  const pad = (n: number) => n.toString().padStart(2, '0');
  return <code>{pad(Math.floor(seconds / 3600))}:{pad(Math.floor(seconds / 60) % 60)}:{pad(seconds % 60)}</code>;
}

/// A value shown only on request. The page already holds it, so this guards
/// against a shared screen, not against the admin: an organiser helping a team
/// over a screen share should not show every passer-by the team's contact or
/// its login code. Each opening of the dialog starts hidden again.
function HiddenField(props: { label: string, value: string | undefined }) {
  const [shown, setShown] = useState(false);
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
      {props.label}: {shown ? (props.value || "—") : "••••••"}
      <Button size="small" sx={{ textTransform: "none" }} onClick={() => setShown(!shown)}>
        {shown ? "Elrejtés" : "Mutasd"}
      </Button>
    </Stack>
  );
}
