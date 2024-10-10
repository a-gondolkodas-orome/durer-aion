import { Stack } from '@mui/system';
import { useAddMinutes, useAll } from '../hooks/user-hooks';
import { Button, Dialog } from '@mui/material';
import { Dispatch, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { InProgressMatchStatus, TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import Form from './form';
import { Field } from 'formik';
import theme from './theme';
import { useSnackbar } from 'notistack';


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
        Admin felület 
        <Button
          color='primary'
          variant='contained'
          onClick={()=>{props.setAdmin(false)}}
        >
          Kilépés
        </Button>
        <Form
        initialValues={{ time: '' }}
        onSubmit={async (values) => { 
          try {
            data?.forEach(async a=>{
              if(a.relayMatch.state == "IN PROGRESS") {
                await addMinutes(a.relayMatch.matchID, values.time);
              }
              if(a.strategyMatch.state == "IN PROGRESS") {
                await addMinutes(a.strategyMatch.matchID, values.time);
              }
            })
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
          idő hozzáadása minden aktív játékosnak
        </Button>
      </ Form>
      <Stack sx={{
        height: "600px",
      }}>
        {data && <DataGrid columns={[
          {
            field: 'id',
            headerName: 'ID',
            width: 150,
            editable: false,
          },
          {
            field: 'teamName',
            headerName: 'Csapanév',
            width: 150,
            editable: false,
          },
          {
            field: 'category',
            headerName: 'Kategória',
            width: 50,
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
    </Stack>
  )
}