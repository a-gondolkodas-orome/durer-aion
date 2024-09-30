import { Stack } from '@mui/system';
import { useAll } from '../hooks/user-hooks';
import { Button } from '@mui/material';
import { Dispatch } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';


export function Admin(props: {setAdmin: Dispatch<boolean>}) {
  const getAll = useAll();
  const { data } = useSWR("users/all", getAll)

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
        Admin felület 
        <Button
          color='primary'
          variant='contained'
          onClick={()=>{props.setAdmin(false)}}
        >
          Kilépés
        </Button>
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
        ]}
        rows={data.map((a)=>{
          const { id, ...rest} = a;
          return {id: a.joinCode, ...rest};
        })}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
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