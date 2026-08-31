import { Stack } from '@mui/system';
import { useAddMinutes, useGetLogs, useMatchState, useResetRelay, useResetStrategy, useRemoveTeam } from '../hooks/user-hooks';
import { Button } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { TeamModelDto, MatchStatus } from '../dto/TeamStateDto';
import { formatTime } from '../utils/DateFormatter';
import { ErrorMessage, Field, FieldProps } from 'formik';
import Form from "./form";
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { ConfirmDialogInterface } from './ConfirmDialog';
import { Countdown } from './Countdown';
import { RelayEndTableData } from './RelayEndTable';
import * as Yup from 'yup';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function TeamDetailDialog(props: {data: TeamModelDto, setConfirmDialog: Dispatch<ConfirmDialogInterface | null>}) {
  const resetRelay = useResetRelay();
  const resetStrategy = useResetStrategy();
  const repoRemoveTeam = useRemoveTeam();
  const { enqueueSnackbar } = useSnackbar();
  const [teamState, setTeamState] = useState(props.data);
  const [removing, setRemoving] = useState(false);

  let sum = 0;
  switch (props.data.relayMatch.state) {
    case "FINISHED": { sum+= props.data.relayMatch.score}
  }
  switch (props.data.strategyMatch.state) {
    case "FINISHED": { sum+= props.data.strategyMatch.score}
  }

  const removeTeam = async (teamId: string) => {
    setRemoving(true);
    try {
      // Dynamically import to avoid circular deps
      await repoRemoveTeam(teamId);
      enqueueSnackbar('Csapat törölve', { variant: 'success' });
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
      <Stack sx={{fontSize: 24, paddingBottom: "24px"}}>{teamState.teamName}</Stack>
      <Button
        sx={{ maxWidth: "200px", marginBottom: "16px" }}
        color="error"
        variant="contained"
        disabled={removing}
        onClick={() => {
          props.setConfirmDialog({
            text: `Biztosan törlöd a(z) ${teamState.teamName} csapatot?`,
            confirm: async () => removeTeam(teamState.teamId),
          });
        }}
      >
        Csapat törlése
      </Button>
      <Stack sx={{fontSize: 16}}>Relay:</Stack>
      <MatchStatusField name={teamState.teamName} data={teamState.relayMatch} isRelay={true} setConfirmDialog={props.setConfirmDialog}/>
      {teamState.relayMatch.state !== "NOT STARTED" && <Button sx={{
        maxWidth: "125px",
      }}
          onClick={()=>{
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${teamState.teamName} csapatnak alaphelyzetbe akarod állítani a váltó állását`,
              confirm: async () => {
                try {
                  const changed = await resetRelay(teamState.teamId);
                  setTeamState(changed);
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                  enqueueSnackbar(message, { variant: 'error' });
                }
              },
            })
          }}
        >reset</Button>}
      
      <Stack sx={{fontSize: 16, marginTop: "24px"}}>Strategy:</Stack>
        <MatchStatusField name={teamState.teamName} data={teamState.strategyMatch} isRelay={false} setConfirmDialog={props.setConfirmDialog}/>
      {teamState.strategyMatch.state !== "NOT STARTED" && <Button sx={{
        maxWidth: "125px",
      }}
          onClick={()=>{
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${teamState.teamName} csapatnak alaphelyzetbe akarod állítani a stratégiás állását`,
              confirm: async () => {
                try {
                  const changed = await resetStrategy(teamState.teamId);
                  setTeamState(changed);
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
      <Stack sx={{fontSize: 24, marginTop: "24px"}}>Összesen: {sum} pont</Stack>
    </Stack>
  )
}

function MatchStatusField(props: {name: string, data: MatchStatus, isRelay: boolean, setConfirmDialog: Dispatch<ConfirmDialogInterface | null>}) {
  const theme = useTheme();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const getLogs = useGetLogs();
  const [matchLogs, setMatchLogs] = useState<unknown|null>(null);

  switch (props.data.state) {
    case "IN PROGRESS": {
      const inProgressState = props.data 
      return (
        <><Stack>
          Folyamatban <br/>
          team-state-start: {formatTime(inProgressState.startAt)}<br/>
          team-state-end: {formatTime(inProgressState.endAt)}<br/>
        </Stack>
        <Stack><MatchStatusDataField matchId={inProgressState.matchID} isRelay={props.isRelay}/></Stack>
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
                await addMinutes(inProgressState.matchID, values.time);
                enqueueSnackbar("Sikeres művelet", { variant: 'success' });
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                enqueueSnackbar(message, { variant: 'error' });
              }
            },
          })
        }}>
        <Stack sx={{display: "flex", flexDirection: "row", margin: "15px"}}>
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
      onClick={()=>{
        void getLogs(inProgressState.matchID).then(logs=>{
          setMatchLogs(logs);
        });
      }}>logok Lekérése</Button>
      <Button
      sx={{
        width: '200px',
        textTransform: 'none',
      }}
      variant='contained'
      color='secondary'
      onClick={()=>{
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
          teamStateScore: {finishedState.score}<br/>
          <Button
          sx={{
            width: '200px',
            textTransform: 'none',
          }}
          variant='contained'
          color='primary'
          onClick={()=>{
            void getLogs(finishedState.matchID).then(logs=>{
              setMatchLogs(logs);
            });
          }}>logok Lekérése</Button>
          <Button
          sx={{
            width: '200px',
            textTransform: 'none',
          }}
          variant='contained'
          color='secondary'
          onClick={()=>{
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

function MatchStatusDataField(props: {matchId: string, isRelay: boolean}) {
  const matchState = useMatchState();
  const [msRemaining, setMsRemaining] = useState<number>(10000);
  const { data } = useSWR([`users/${props.matchId}`, props.matchId], ([, matchId]) => matchState(matchId))
  if (!data) {
    return null;
  }
  // Which match this is, read off the payload rather than taken on trust from
  // isRelay — see MatchStateDto.
  const relayG = 'currentProblem' in data.G ? data.G : null;
  const strategyG = 'numberOfTries' in data.G ? data.G : null;
  return (<>
  <Stack>
      { props.isRelay && relayG && <Stack>Aktuális feladatszám: {relayG.currentProblem + 1}</Stack>}
      { !props.isRelay && strategyG && <Stack>próbálkozások száma: {strategyG.numberOfTries}</Stack>}
      { !props.isRelay && strategyG && <Stack>Éles játékok eddigi eredményei: {strategyG.numberOfTries-strategyG.numberOfLoss-Number(strategyG.winner===null && strategyG.difficulty==="live")} győzelem, {strategyG.numberOfLoss} vereség</Stack>}
      <Stack>Befejezés dátuma: {formatTime(new Date(data.G.end))}</Stack>
      <Stack>pontszám: { data.G.points }</Stack>
      <Stack>Hátralévő idő: <Countdown
        msRemaining={msRemaining ?? null}
        setMsRemaining={setMsRemaining}
        endTime={new Date(data.G.end)}
        getServerTimer={() => undefined}
        serverRemainingMs={new Date(data.G.end).getTime() - new Date().getTime()}
      /></Stack>
      { props.isRelay && relayG && <Stack>
      <RelayEndTableData allPoints={relayG.points} task={
           // TODO .maxpoints
           [3, 3, 4, 4, 4, 5, 5, 6, 6].map((it, idx)=>({
            max: it,
            got: relayG.previousPoints[idx] ?? null,
            answers: relayG.previousAnswers[idx]?.map((a) => a.answer) ?? [],
           })
           ) 
          }/>
      </Stack>}
    </Stack>
  </>)
}