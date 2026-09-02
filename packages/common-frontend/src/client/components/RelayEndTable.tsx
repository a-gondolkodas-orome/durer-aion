import { Button, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { Stack } from '@mui/system';
import { Fragment } from 'react';
import { useLogout, useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const pointColours: string[] = ['#3fc523', '#9beb53', '#d5eb42', '#ee5555'];

const pointCellStyle = (data: { max: number, got: number | null }) =>
  data.got === null
    ? { backgroundColor: '#fff' }
    : { backgroundColor: pointColours[Math.min(data.max - data.got, 3)] };

// The table fits 10 tasks in a row, longer task lists continue in new rows
const chunkTasks = <T,>(tasks: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < tasks.length; i += 10) {
    chunks.push(tasks.slice(i, i + 10));
  }
  return chunks;
};

/**
 * Component to display an end game screen with close button, and score
 * @param props selectRound: the close button leads back to the round selector
 * (by logging out) instead of reloading into the competition home page
 * @returns End screen
 */
export function RelayEndTable(props: { allPoints: number, task: { max: number, got: number | null }[], selectRound?: boolean }) {
  const theme = useTheme();
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  const logout = useLogout();
  const { t } = useTranslation();
  // Named so the handlers below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    if (props.selectRound) {
      // Logging out leads back to the round selector, and it also clears
      // the saved match so the round can be replayed later
      logout();
    } else {
      window.location.reload();
    }
  };

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
      }}>{t('relay.endTable.all')}</Stack>
        <Stack sx={{
          display: 'flex',
          flexFlow: 'column',
          alignItems: 'center',
        }}>
        <Table sx={{
        marginTop: '20px',
        marginLeft: '10px',
        borderCollapse: 'collapse',
        fontSize: '18px',
        '& td': {
            borderStyle: 'solid',
            borderColor: '#000',
            borderWidth: '1px',
            textAlign: 'center',
            padding: '5px',
            minWidth: '40px',
            [theme.breakpoints.down(800)]: {
                minWidth: '0px',
                padding: '0px',
            }
        },
        [theme.breakpoints.down(1200)]: {
            width: '100%',
            marginLeft: '0px',
        },
        [theme.breakpoints.down(800)]: {
            fontSize: '11px',
        }
    }}>
            <TableBody>
            {chunkTasks(props.task).map((chunk, chunkIdx) => <Fragment key={chunkIdx}>
              <TableRow>
                <TableCell>{t('relay.endTable.task')}</TableCell>
                {chunk.map((_data, idx) => <TableCell key={idx}>
                    {chunkIdx * 10 + idx + 1}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('relay.endTable.point')}</TableCell>
                {chunk.map((data, idx) => <TableCell key={idx} sx={pointCellStyle(data)}>
                    {data.got}
                </TableCell>)}
            </TableRow>
            </Fragment>)}
            </TableBody>
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
            <Stack key={attempt} sx={{ display: 'flex' }}>
              <Stack sx={{ backgroundColor: colour }}></Stack>
              <span>{attempt === 3 ? t('relay.endTable.wrong') : t('relay.endTable.try', { count: attempt + 1 })}</span>
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
            {t('relay.endTable.all')}: {props.allPoints} <br/>
            {!props.selectRound && t('relay.endTable.reminder')}
        </Stack>
      <Button sx={{
        width: '300px',
        height: '55px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={() => void backToHome()}>
        {props.selectRound ? t('relay.endTable.selectOtherRound') : t('relay.endTable.back')}
      </Button>
    </Stack>
  )
}

export function RelayEndTableData(props: { allPoints: number, task: { max: number, got: number | null, answers: number[] }[] }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
        <Table sx={{
        marginTop: '20px',
        marginLeft: '10px',
        borderCollapse: 'collapse',
        fontSize: '18px',
        '& td': {
            borderStyle: 'solid',
            borderColor: '#000',
            borderWidth: '1px',
            textAlign: 'center',
            padding: '5px',
            minWidth: '40px',
            [theme.breakpoints.down(800)]: {
                minWidth: '0px',
                padding: '0px',
            }
        },
        [theme.breakpoints.down(1200)]: {
            width: '100%',
            marginLeft: '0px',
        },
        [theme.breakpoints.down(800)]: {
            fontSize: '11px',
        }
    }}>
            <TableBody>
            {chunkTasks(props.task).map((chunk, chunkIdx) => <Fragment key={chunkIdx}>
              <TableRow>
                <TableCell>{t('relay.endTable.task')}</TableCell>
                {chunk.map((_data, idx) => <TableCell key={idx}>
                    {chunkIdx * 10 + idx + 1}.
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>{t('relay.endTable.point')}</TableCell>
                {chunk.map((data, idx) => <TableCell key={idx} sx={pointCellStyle(data)}>
                    {data.got}
                </TableCell>)}
            </TableRow>
            <TableRow>
                <TableCell>Válaszok</TableCell>
                {chunk.map((data, idx) => <TableCell key={idx}>
                    {data.answers.join(", ")}
                </TableCell>)}
            </TableRow>
            </Fragment>)}
            </TableBody>
        </Table>
  )
}
