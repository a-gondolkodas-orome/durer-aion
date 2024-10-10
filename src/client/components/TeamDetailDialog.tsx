import { Stack, width } from '@mui/system';
import { useAddMinutes, useAll, useMatchState, useResetRelay, useResetStrategy } from '../hooks/user-hooks';
import { Button, Dialog } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { MatchStateDto, TeamModelDto, InProgressMatchStatus, FinishedMatchStatus, MatchStatus, NotStartedMatchStatus } from '../dto/TeamStateDto';
import { formatTime } from '../utils/DateFormatter';
import { Field } from 'formik';
import Form from "./form";
import theme from './theme';
import { useSnackbar } from 'notistack';


export function TeamDetailDialog(props: {data: TeamModelDto}) {
  const resetRelay = useResetRelay();
  const resetStrategy = useResetStrategy();
  const [teamState, setTeamState] = useState(props.data);

  return (
    <Stack
      sx={{
        width: "1200px",
        maxWidth: "calc(100% - 12px)",
        padding: "12px",
        fontSize: 14,
      }}>
      <Stack sx={{fontSize: 24, paddingBottom: "24px"}}>{teamState.teamName}</Stack>
      <Stack>relay: <br/>
        <MatchStatusField data={teamState.relayMatch} isRelay={true}/>
      </Stack>
      <Button
          onClick={async ()=>{
            const changed = await resetRelay(teamState.teamId);
            setTeamState(changed);
          }}
          >resetRelay
      </Button>
      <Stack>strategy: <br/>
        <MatchStatusField data={teamState.strategyMatch} isRelay={false}/>
      </Stack>
      <Button
          onClick={async ()=>{
            const changed = await resetStrategy(teamState.teamId);
            setTeamState(changed);
          }}
          >resetStrategy
      </Button>
    </Stack>
  )
}

function MatchStatusField(props: {data: MatchStatus, isRelay: boolean}) {
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
          matchId: {inProgressState.matchID}<br/>
        </Stack>
        <Stack><MatchStatusDataField matchId={inProgressState.matchID}/></Stack>
        <Form
        initialValues={{ time: '' }}
        onSubmit={async (values) => { 
          try {
            await addMinutes(inProgressState.matchID, values.time);
            enqueueSnackbar("Sikeres művelet", { variant: 'success' });
          } catch (e: any) {
            enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
          }
        }}>
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
            style={{
              width: '100%',
              height: '40px',
              borderWidth: '2px',
              borderRadius: '5px',
              borderColor: theme.palette.primary.main,
              fontSize: '18px',
            }}
          />
        }</Field>
        <Button sx={{
          width: '100%',
          height: '60px',
          fontSize: '26px',
          alignSelf: 'center',
          textTransform: 'none',
          borderRadius: '10px',
          marginTop: '40px',
        }} variant='contained' color='primary' type="submit">
          hozzáadás
        </Button>
      </Form></>
      )
    case "FINISHED":
      let finishedState = props.data as FinishedMatchStatus 
      return (
        <Stack>
          Végzett <br/>
          start: {formatTime(finishedState.startAt)}<br/>
          end: {formatTime(finishedState.endAt)}<br/>
          
          <Stack><MatchStatusDataField matchId={finishedState.matchID}/></Stack>
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

function MatchStatusDataField(props: {matchId: string}) {

  const matchState = useMatchState();
  const { data } = useSWR([`users/${props.matchId}`, props.matchId], ([, matchId]) => matchState(matchId))
  return (<>
  {data && JSON.stringify(data)}
  </>)
}