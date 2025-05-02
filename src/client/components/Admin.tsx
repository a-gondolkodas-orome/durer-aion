import { Stack } from '@mui/system';
import { useAddMinutes, useAll } from '../hooks/user-hooks';
import { Button, Dialog, Table, TableCell, TableRow } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import Form from './form';
import { ErrorMessage, Field } from 'formik';
import theme from './theme';
import { useSnackbar } from 'notistack';
import { FinishedMatchStatus } from '../../server/entities/model';
import { ConfirmDialogInterface, ConfirmDialog } from './ConfirmDialog';
import * as Yup from 'yup';

export function Admin(props: {teamId?: String}) {
  const getAll = useAll();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const { data } = useSWR("users/all", getAll)
  const [selectedRow, setSelectedRow] = useState<TeamModelDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInterface | null>(null);
  const [teamFromPath, setTeamFromPath] = useState<TeamModelDto | null>(null);

  useEffect(()=>{
    if (props.teamId) {
      const current = data?.find(d=>d.teamId === props.teamId)
      if (current) {
        setTeamFromPath(current);
      }
    } else if (teamFromPath) {
      setTeamFromPath(null);
    }
  }, [data, props.teamId, teamFromPath]);

  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      paddingLeft: {
        xs: '10px',
        lg: 0
      },
      paddingRight: {
        xs: '10px',
        md: 0
      },
      backgroundColor: "#fff",
    }} data-testId="adminRoot">
      <Dialog 
        maxWidth={false} 
        PaperProps={{
          sx: {
            marginLeft: {
              xs: 0,
              md: '32px'
            },
            marginRight: {
              xs: 0,
              md: '32px'
            },
            maxWidth: {
              xs: '100%',
              md: 'calc(100% - 64px)'
            },
          }
        }}
        open={
          selectedRow != null
        } onClose={async () => {
            setSelectedRow(null); 
           }}>
          {selectedRow && <TeamDetailDialog data={selectedRow!!} setConfirmDialog={setConfirmDialog}/>}
      </Dialog>
      <ConfirmDialog confirmDialog={confirmDialog}  setConfirmDialog={setConfirmDialog}/>
      <Stack sx={{width: "100%", display:"flex", flexDirection: "row"}}>
        <Stack sx={{fontSize:"32px", width: "100%", textAlign: "center"}}>Admin felület </Stack>
      </Stack>
      {teamFromPath && <TeamDetailDialog data={teamFromPath!!} setConfirmDialog={setConfirmDialog}/>}
      {!teamFromPath && <Stack sx={{
        height: "635px",
      }}>
        {data && <DataGrid columns={[
          {
            field: 'id',
            headerName: 'ID',
            width: 75,
            editable: false,
          },
          {
            field: 'teamName',
            headerName: 'Csapatnév',
            width: 200,
            editable: false,
          },
          {
            field: 'category',
            headerName: 'Kategória',
            width: 100,
            editable: false,
          },
          {
            field: 'pageState',
            headerName: 'Állapot',
            width: 150,
            editable: false,
          },
          {
            field: 'other',
            headerName: 'Egyéb',
            width: 250,
            editable: false,
          },
          {
            field: 'relayMatchState',
            headerName: 'Relay',
            width: 120,
            editable: false,
          },
          {
            field: 'strategyMatchState',
            headerName: 'Strategy',
            width: 120,
            editable: false,
          },
          {
            field: 'view',
            width: 170,
            headerName: '',
            renderCell: (renderData) => {
              return (
                <Button
                  color='primary'
                  variant='contained'
                  onClick={() => {setSelectedRow(renderData.row as TeamModelDto)}}>
                    Szerkesztés
                </Button>
              )
            }
          },
          {
            field: 'view_tab',
            width: 170,
            headerName: '',
            renderCell: (renderData) => {
              return (
                <Button
                  color='primary'
                  variant='contained'
                  onClick={()=>{
                    window.open("/admin/"+renderData.row.teamId, '_blank', 'noopener,noreferrer')
                  }}>
                    + új tab
                </Button>
              )
            }
          }
        ]}
        rows={data.map((a)=>{
          return {
            id: a.teamId,
            relayMatchState: a.relayMatch.state,
            strategyMatchState: a.strategyMatch.state,
             ...a,
          };
        })}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
          columns: {
            columnVisibilityModel: {
              other: false,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        sx={{
          height: "auto",
        }}
        />}
      </Stack>}
      {!teamFromPath && data && <Stack sx={{padding: "10px"}}>
        idő hozzáadása minden aktív játékosnak:
        <Form
        initialValues={{ time: '' }}
        validationSchema={Yup.object().shape({
          time: Yup.number()
            .integer('Egész számot kell írni')
            .typeError('Számot kell írni')
            .required('Nincs megadva érték')
          })}
        onSubmit={async (values) => { 
          setConfirmDialog({
            text: `Erősítsd meg, hogy minden aktuális csapatnak meg akarod növelni az idejét ${values.time} perccel`,
            confirm: () => {
              try {
                data?.forEach(async a=>{
                  if(a.relayMatch.state === "IN PROGRESS") {
                    await addMinutes(a.relayMatch.matchID, values.time);
                  }
                  if(a.strategyMatch.state === "IN PROGRESS") {
                    await addMinutes(a.strategyMatch.matchID, values.time);
                  }
                })
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
          hozzáadás
        </Button>
        </Stack>
        <ErrorMessage name="time" sx={{color:'red'}}/>
      </ Form>
      </Stack>}
     {!teamFromPath && data && <Stats data={data}/>}
    </Stack>
  )
}

function Stats(props: {data: TeamModelDto[]}) {
  const categories = Array.from(new Set(props.data.map(it=>it.category)));
  const stat = categories.sort().map(cat=>{
    const current = props.data.filter(it=>it.category===cat);
    const bothNotStarted = current.filter(it=>it.strategyMatch.state === "NOT STARTED" && it.relayMatch.state === "NOT STARTED").length;
    const relayInProgress = current.filter(it=>it.relayMatch.state === "IN PROGRESS").length;
    const strategyInProgress = current.filter(it=>it.strategyMatch.state === "IN PROGRESS").length;
    const finishedRelayScores = current.filter(it=>it.relayMatch.state === "FINISHED").map(it=>(it.relayMatch as FinishedMatchStatus).score);
    const finishedStrategyScores = current.filter(it=>it.strategyMatch.state === "FINISHED").map(it=>(it.strategyMatch as FinishedMatchStatus).score);
    const strategyPoints = Array.from(new Set(finishedStrategyScores));
    const relayPoints = Array.from(new Set(finishedRelayScores));
    return {
      category: cat,
      all: current.length,
      notStarted: bothNotStarted,
      relayInProgress: relayInProgress,
      strategyInProgress: strategyInProgress,
      relay: finishedRelayScores.length,
      strategy: finishedStrategyScores.length,
      finished: current.filter(it=>it.strategyMatch.state === "FINISHED" && it.relayMatch.state === "FINISHED").length,
      strategyPoints: strategyPoints.map(it=> ({
        point: it,
        count: finishedStrategyScores.filter(s=>s === it).length
      })),
      relayPoints: relayPoints.map(it=> ({
        point: it,
        count: finishedRelayScores.filter(s=>s === it).length
      })),
    }
  })
  return <Table>
    <TableRow>
      <TableCell>Kategória</TableCell>
      <TableCell>Összesen</TableCell>
      <TableCell>Váltó</TableCell>
      <TableCell>Stratégiás</TableCell>
      <TableCell>Teljes verseny</TableCell>
      <TableCell>Relay-Pontszámok</TableCell>
      <TableCell>Strategy-Pontszámok</TableCell>
    </TableRow>
    {stat.map(s=> (
      <TableRow>
        <TableCell>{s.category}</TableCell>
        <TableCell>{s.all}</TableCell>
        <TableCell><Progress notStarted={s.all - s.relayInProgress - s.relay} inProgress={s.relayInProgress} finished={s.relay}/></TableCell>
        <TableCell><Progress notStarted={s.all - s.strategyInProgress - s.strategy} inProgress={s.strategyInProgress} finished={s.strategy}/></TableCell>
        <TableCell><Progress notStarted={s.notStarted} inProgress={s.all - s.notStarted - s.finished} finished={s.finished}/></TableCell>
        <TableCell>{s.relayPoints.sort((a, b)=>a.point-b.point).map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
        <TableCell>{s.strategyPoints.sort((a, b)=>a.point-b.point).map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
      </TableRow>
    ))}
  </Table>
}

export function Progress(props: { notStarted: number, inProgress: number, finished: number}) {
  return ( <>
    <i title='NOT STARTED' style={{color: "red"}}>{props.notStarted}</i> / <i title='IN PROGRESS' style={{color: "orange"}}>{props.inProgress}</i> / <i title='FINISHED' style={{color: "green"}}>{[props.finished]}</i>
  </>);
}