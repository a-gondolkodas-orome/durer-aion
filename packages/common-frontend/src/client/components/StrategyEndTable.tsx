import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import { useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';

/**
 * Component to display an end game screen with close button, and score
 * @param props {{setShow: React.Dispatch<boolean>, points: number}}
 * @returns End screen
 */
export function StrategyEndTable(props: {allPoints: number, numOfTries: number}) {
  const theme = useTheme();
  const toHome = useToHome();
  const refreshState = useRefreshTeamState();
  const { t } = useTranslation();
  return (
    <Stack sx={{
      display: 'flex',
      width: "750px",
      maxWidth: '100%',
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
          marginTop: '25px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
        <Stack>{t('strategy.endTable.gained')}: {props.allPoints}</Stack>
        <Stack>{t('strategy.endTable.tries')}: {props.numOfTries}</Stack>
      </Stack>
      <Button sx={{
        width: '300px',
        height: '75px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
        marginTop: '15px',
      }} variant='contained' color='primary' onClick={async ()=>{
        await refreshState();
        await toHome();
        window.location.reload(); 
      }}>
        {t('relay.endTable.back')}
      </Button>
    </Stack>
  )
}