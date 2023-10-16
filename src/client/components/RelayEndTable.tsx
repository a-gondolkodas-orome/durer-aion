import React from 'react';
import { Button, Table, TableCell, TableRow } from '@mui/material';
import { Stack } from '@mui/system';
import { dictionary } from '../text-constants';
import { useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import theme from './theme';

/**
 * Component to display an end game screen with close button, and score
 * @param props {{setShow: React.Dispatch<boolean>, points: number}}
 * @returns End screen
 */
export function RelayEndTable(props: {allPoints: number, task: {max: number, got: number | null}[]}) {
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  return (
    <Stack sx={{
      display: 'flex',
      width: "750px",
      maxWidth: "100%",
      marginTop: '30px',
      marginBottom: '30px',
      borderRadius: '30px',
      backgroundColor: '#fff',
      padding: '25px',
    }}>
      <Stack sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center'
      }}>{dictionary.relay.endTable.all}</Stack>
        <Stack sx={{
          display: 'flex',
          flexFlow: 'column',
          alignItems: 'center',
        }}>
        <Table sx={{
        marginTop: '20px',
        marginLeft:'10px',
        borderCollapse: 'collapse',
        fontSize: '18px',
        ['& td']:{
            borderStyle: 'solid',
            borderColor: '#000',
            borderWidth: '1px',
            textAlign: 'center',
            padding: '5px',
            minWidth: '40px',
            [theme.breakpoints.down(800)]:{
                minWidth: '0px',
                padding: '0px',
            }
        },
        [theme.breakpoints.down(1200)]:{
            width: '100%',
            marginLeft:'0px',
        },
        [theme.breakpoints.down(800)]:{
            fontSize: '11px',
        }
    }}>
            <TableRow>
                <TableCell>{dictionary.relay.endTable.task}</TableCell>
                {props.task.map((data, idx)=><TableCell>
                    {idx+1}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{dictionary.relay.endTable.point}</TableCell>
                {props.task.map((data, idx)=>{
                    let currStyle = { backgroundColor: '#fff' };
                    if(data.got !== null){
                        switch(data.max - data.got){
                            case 0: 
                              currStyle = { backgroundColor: '#3fc523' }; break;
                            case 1: 
                              currStyle = { backgroundColor: '#9beb53' }; break;
                            case 2: 
                              currStyle = { backgroundColor: '#d5eb42' }; break;
                            default:
                              currStyle = { backgroundColor: '#ee5555' };
                        }
                    }
                return <TableCell sx={currStyle}>
                    {data.got}
                </TableCell>})}
            </TableRow>
        </Table>
        <Stack sx={{
          marginTop: '25px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          ['& div']: {
              width: '40px',
              height: '40px',
              marginRight: '7px',
          },
          ['& span']: {
              marginRight: '25px'
          }
        }}>
            <Stack sx={{ backgroundColor: '#3fc523' }}></Stack>
            <span>1. {dictionary.relay.endTable.try}</span>
            <Stack sx={{ backgroundColor: '#9beb53' }}></Stack>
            <span>2. {dictionary.relay.endTable.try}</span>
            <Stack sx={{ backgroundColor: '#d5eb42' }}></Stack>
            <span>3. {dictionary.relay.endTable.try}</span>
            <Stack sx={{ backgroundColor: '#ee5555' }}></Stack>
            <span>{dictionary.relay.endTable.wrong}</span>
        </Stack>
        </Stack>
        <Stack sx={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '35px',
            marginLeft: '55px',
        }}>
            {dictionary.relay.endTable.all}: {props.allPoints} <br/>
            Ne feledkezzetek meg a stratégiás játékról, ha azzal még nem játszottatok!
        </Stack>
      <Button sx={{
        width: '300px',
        height: '75px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={async ()=>{
        await refreshState();
        await toHome();
        window.location.reload(); 
      }}>
        {dictionary.relay.endTable.back}
      </Button>
    </Stack>
  )
}