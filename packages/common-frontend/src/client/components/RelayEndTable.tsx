import React from 'react';
import { Button, Table, TableCell, TableRow } from '@mui/material';
import { Stack } from '@mui/system';
import { useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const pointColours: string[] = ['#3fc523', '#9beb53', '#d5eb42', '#ee5555'];

/**
 * Component to display an end game screen with close button, and score
 * @param props {{setShow: React.Dispatch<boolean>, points: number}}
 * @returns End screen
 */
export function RelayEndTable(props: {allPoints: number, task: {max: number, got: number | null}[]}) {
  const theme = useTheme();
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  const { t } = useTranslation(undefined, { keyPrefix: 'relay' });

  return (
    <Stack sx={{
      display: 'flex',
      width: "750px",
      maxWidth: "100%",
      marginTop: '10px',
      marginBottom: '10px',
      borderRadius: '30px',
      backgroundColor: theme.palette.background.paper,
      padding: '25px',
    }}>
      <Stack sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center'
      }}>{t('endTable.all')}</Stack>
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
        '& td':{
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
                <TableCell>{t('endTable.task')}</TableCell>
                {props.task.slice(0, 10).map((data, idx)=><TableCell>
                    {idx+1}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('endTable.point')}</TableCell>
                {props.task.slice(0, 10).map((data, idx)=>{
                    let currStyle = { backgroundColor: '#fff' };
                    if(data.got !== null){
                      if(0 < data.max - data.got && data.max - data.got < 3) {
                        currStyle = { backgroundColor: pointColours[data.max - data.got] }
                      } else {
                        currStyle = { backgroundColor: pointColours[3] }
                      }
                    }
                return <TableCell sx={currStyle}>
                    {data.got}
                </TableCell>})}
            </TableRow>
            {props.task.length > 10 && <>
              <TableRow>
                <TableCell>{t('endTable.task')}</TableCell>
                {props.task.slice(10).map((data, idx)=><TableCell>
                    {idx+11}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('endTable.point')}</TableCell>
                {props.task.slice(10).map((data, idx)=>{
                    let currStyle = { backgroundColor: '#fff' };
                    if(data.got !== null){
                      if(0 < data.max - data.got && data.max - data.got < 3) {
                        currStyle = { backgroundColor: pointColours[data.max - data.got] }
                      } else {
                        currStyle = { backgroundColor: pointColours[3] }
                      }
                    }
                return <TableCell sx={currStyle}>
                    {data.got}
                </TableCell>})}
            </TableRow>
            </>}
        </Table>
        <Stack sx={{
          marginTop: '25px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          '& div': {
            alignItems: 'center',
          },
          '& div div': {
              width: '40px',
              height: '40px',
          },
          flexDirection: 'row',
          '& div span': {
              marginLeft: '12px',
              marginRight: '12px',
          }
        }}>
          {pointColours.map((colour, attempt) => (
            <Stack sx={{display: 'flex' }}>
              <Stack sx={{ backgroundColor: colour }}></Stack>
              <span>{attempt === 3 ? t('endTable.wrong') : t('endTable.try', {count: attempt + 1})}</span>
            </Stack>
          ))}
        </Stack>
        </Stack>
        <Stack sx={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '35px',
            marginLeft: '55px',
            marginBottom: '10px',
        }}>
            {t('endTable.all')}: {props.allPoints} <br/>
            {t('endTable.reminder')}
        </Stack>
      <Button sx={{
        width: '300px',
        height: '55px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={async ()=>{
        await refreshState();
        await toHome();
        window.location.reload(); 
      }}>
        {t('endTable.back')}
      </Button>
    </Stack>
  )
}

export function RelayEndTableData(props: {allPoints: number, task: {max: number, got: number | null, answers: number[]}[]}) {
  const theme = useTheme();
  const { t } = useTranslation(undefined, { keyPrefix: 'relay' });
  return (
        <Table sx={{
        marginTop: '20px',
        marginLeft:'10px',
        borderCollapse: 'collapse',
        fontSize: '18px',
        '& td':{
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
                <TableCell>{t('endTable.task')}</TableCell>
                {props.task.slice(0, 10).map((data, idx)=><TableCell>
                    {idx+1}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('endTable.point')}</TableCell>
                {props.task.slice(0, 10).map((data, idx)=>{
                    let currStyle = { backgroundColor: '#fff' };
                    if(data.got !== null){
                      if(0 < data.max - data.got && data.max - data.got < 3) {
                        currStyle = { backgroundColor: pointColours[data.max - data.got] }
                      } else {
                        currStyle = { backgroundColor: pointColours[3] }
                      }
                    }
                return <TableCell sx={currStyle}>
                    {data.got}
                </TableCell>})}
            </TableRow><TableRow>
                <TableCell>Válaszok</TableCell>
                {props.task.slice(0, 10).map((data, idx)=>{
                return <TableCell>
                    {data.answers.join(", ")}
                </TableCell>})}
            </TableRow>
            {props.task.length > 10 && <>
              <TableRow>
                <TableCell>{t('endTable.task')}</TableCell>
                {props.task.slice(10).map((data, idx)=><TableCell>
                    {idx+11}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('endTable.point')}</TableCell>
                {props.task.slice(10).map((data, idx)=>{
                    let currStyle = { backgroundColor: '#fff' };
                    if(data.got !== null){
                      if(0 < data.max - data.got && data.max - data.got < 3) {
                        currStyle = { backgroundColor: pointColours[data.max - data.got] }
                      } else {
                        currStyle = { backgroundColor: pointColours[3] }
                      }
                    }
                return <TableCell sx={currStyle}>
                    {data.got}
                </TableCell>})}
            </TableRow><TableRow>
                <TableCell>Válaszok</TableCell>
                {props.task.slice(10).map((data, idx)=>{
                return <TableCell>
                    {data.answers.join(", ")}
                </TableCell>})}
            </TableRow>
            </>}
        </Table>
  )
}