import { Stack } from '@mui/system';
import { useAddMinutes, useMatchState, useResetRelay, useResetStrategy } from '../hooks/user-hooks';
import { Button } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { TeamModelDto, InProgressMatchStatus, FinishedMatchStatus, MatchStatus } from '../dto/TeamStateDto';
import { formatTime } from '../utils/DateFormatter';
import { ErrorMessage, Field } from 'formik';
import Form from "./form";
import theme from './theme';
import { useSnackbar } from 'notistack';
import { ConfirmDialogInterface } from './ConfirmDialog';
import { Countdown } from './Countdown';
import { RelayEndTableData } from './RelayEndTable';
import * as Yup from 'yup';

export function TeamDetailDialog(props: {data: TeamModelDto, setConfirmDialog: Dispatch<ConfirmDialogInterface | null>}) {
  const resetRelay = useResetRelay();
  const resetStrategy = useResetStrategy();
  const { enqueueSnackbar } = useSnackbar();
  const [teamState, setTeamState] = useState(props.data);

  let sum = 0;
  switch (props.data.relayMatch.state) {
    case "FINISHED": { sum+= props.data.relayMatch.score}
  }
  switch (props.data.strategyMatch.state) {
    case "FINISHED": { sum+= props.data.strategyMatch.score}
  }

  return (
    <Stack
      sx={{
        width: "1200px",
        maxWidth: "calc(100% - 12px)",
        padding: "12px",
        fontSize: 14,
      }}>
      <Stack sx={{fontSize: 24, paddingBottom: "24px"}}>{teamState.teamName}</Stack>
      <Stack sx={{fontSize: 16}}>Relay:</Stack>
      <MatchStatusField name={teamState.teamName} data={teamState.relayMatch} isRelay={true} setConfirmDialog={props.setConfirmDialog}/>
      {teamState.relayMatch.state !== "NOT STARTED" && <Button sx={{
        maxWidth: "125px",
      }}
          onClick={async ()=>{
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${teamState.teamName} csapatnak alaphelyzetbe akarod állítani a váltó állását`,
              confirm: async () => {
                try {
                  const changed = await resetRelay(teamState.teamId);
                  setTeamState(changed);
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e: any) {
                  enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
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
          onClick={async ()=>{
            props.setConfirmDialog({
              text: `Erősítsd meg, hogy ${teamState.teamName} csapatnak alaphelyzetbe akarod állítani a stratégiás állását`,
              confirm: async () => {
                try {
                  const changed = await resetStrategy(teamState.teamId);
                  setTeamState(changed);
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e: any) {
                  enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
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
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();

  switch (props.data.state) {
    case "IN PROGRESS":
      let inProgressState = props.data as InProgressMatchStatus 
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
        onSubmit={async (values) => { 
          props.setConfirmDialog({
            text: `Erősítsd meg, hogy ${props.name} csapatnak meg akaorod növelni az idejét ${values.time} perccel`,
            confirm: async () => {
              try {
                await addMinutes(inProgressState.matchID, values.time);
                enqueueSnackbar("Sikeres művelet", { variant: 'success' });
              } catch (e: any) {
                enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
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
            form: { handleChange },
          }: any) => <input
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
        <ErrorMessage name="time" sx={{color:'red'}}/>
      </Form>
      </>
      )
    case "FINISHED":
      let finishedState = props.data as FinishedMatchStatus 
      return (
        <Stack>
          Végzett <br/>
          start: {formatTime(finishedState.startAt)}<br/>
          end: {formatTime(finishedState.endAt)}<br/>
          
          <Stack><MatchStatusDataField matchId={finishedState.matchID} isRelay={props.isRelay}/></Stack>
          teamStateScore: {finishedState.score}<br/>
        </Stack>
      )
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
  return (<>
  {data && <Stack>
      { props.isRelay && <Stack>Aktuális feladatszám: {data.G.currentProblem + 1}</Stack>}
      { !props.isRelay && <Stack>próbálkozások száma: {(data.G as any).numberOfTries}</Stack>}
      { !props.isRelay && <Stack>Éles játékok eddigi eredményei: {(data.G as any).numberOfTries-(data.G as any).numberOfLoss-Number((data.G as any).winner===null && (data.G as any).difficulty==="live")} győzelem, {(data.G as any).numberOfLoss} vereség</Stack>}
      <Stack>Befejezés dátuma: {formatTime(new Date(data.G.end))}</Stack>
      <Stack>pontszám: { data.G.points }</Stack>
      <Stack>Hátralévő idő: <Countdown
        msRemaining={msRemaining ?? null}
        setMsRemaining={setMsRemaining}
        endTime={new Date(data.G.end)}
        getServerTimer={()=>{}}
        serverRemainingMs={new Date(data.G.end).getTime() - new Date().getTime()}
      /></Stack>
      { props.isRelay && <Stack>
      <RelayEndTableData allPoints={data.G.points} task={
           // TODO .maxpoints
           [3, 3, 4, 4, 4, 5, 5, 6, 6].map((it, idx)=>({
            max: it,
            got: data.G.previousPoints[idx] ?? null,
            answers: data.G.previousAnswers[idx]?.map(a=>a.answer) ?? [],
           })
           ) 
          }/>
      </Stack>}
    </Stack>}
  </>)
}