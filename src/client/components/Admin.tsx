import { Stack } from '@mui/system';
import { useAddMinutes, useAll } from '../hooks/user-hooks';
import { Button, Dialog, Table, TableCell, TableRow } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import Form from './form';
import { Field } from 'formik';
import theme from './theme';
import { useSnackbar } from 'notistack';
import { FinishedMatchStatus } from '../../server/entities/model';


export function Admin(props: {setAdmin: Dispatch<boolean>}) {
  const getAll = useAll();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const { data } = useSWR("users/all", getAll)
  const [selectedRow, setSelectedRow] = useState<TeamModelDto | null>(null);

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
          {selectedRow && <TeamDetailDialog data={selectedRow!!}/>}
        </Dialog>
        
        <Stack sx={{width: "100%", display:"flex", flexDirection: "row"}}>
          <Stack sx={{fontSize:"32px", width: "100%", textAlign: "center"}}>Admin felület </Stack>
          <Button
          sx={{width:"100px", height: "35px", alignSelf: "center"}}
            color='primary'
            variant='contained'
            onClick={()=>{props.setAdmin(false)}}
          >
          Kilépés
        </Button>
        </Stack>
        <Stack sx={{padding: "10px"}}>
        idő hozzáadása minden aktív játékosnak:
        <Form
        initialValues={{ time: '' }}
        onSubmit={async (values) => { 
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
      </ Form>
      </Stack>
      <Stack sx={{
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
            headerName: 'Csapanév',
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
      </Stack>
     {data && <Stats data={data}/>}
    </Stack>
  )
}

function Stats(props: {data: TeamModelDto[]}) {
  const categories = Array.from(new Set(props.data.map(it=>it.category)));
  const stat = categories.map(cat=>{
    const current = props.data.filter(it=>it.category === cat);
    const finishedRelayScores = current.filter(it=>it.relayMatch.state === "FINISHED").map(it=>(it.relayMatch as FinishedMatchStatus).score);
    const finishedStrategyScores = current.filter(it=>it.strategyMatch.state === "FINISHED").map(it=>(it.strategyMatch as FinishedMatchStatus).score);
    const strategyPoints = Array.from(new Set(finishedStrategyScores));
    const relayPoints = Array.from(new Set(finishedRelayScores));
    return {
      category: cat,
      all: current.length,
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
      <TableCell>Befejezte a váltót</TableCell>
      <TableCell>Befejezte a stratégiáss</TableCell>
      <TableCell>Befejezte</TableCell>
      <TableCell>Relay-Pontszámok</TableCell>
      <TableCell>Strategy-Pontszámok</TableCell>
    </TableRow>
    {stat.map(s=> (
      <TableRow>
        <TableCell>{s.category}</TableCell>
        <TableCell>{s.all}</TableCell>
        <TableCell>{s.relay}</TableCell>
        <TableCell>{s.strategy}</TableCell>
        <TableCell>{s.finished}</TableCell>
        <TableCell>{s.relayPoints.map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
        <TableCell>{s.strategyPoints.map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
      </TableRow>
    ))}
  </Table>
}