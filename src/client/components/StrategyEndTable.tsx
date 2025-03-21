import React from 'react';
import { Button} from '@mui/material';
import { Stack } from '@mui/system';
import { dictionary } from '../text-constants';
import { useRefreshTeamState, useToHome } from '../hooks/user-hooks';

/**
 * Component to display an end game screen with close button, and score
 * @param props {{setShow: React.Dispatch<boolean>, points: number}}
 * @returns End screen
 */
export function StrategyEndTable(props: {allPoints: number, numOfTries: number}) {
  const toHome = useToHome();
  const refreshState = useRefreshTeamState();
  return (
    <Stack sx={{
      display: 'flex',
      width: "750px",
      maxWidth: '100%',
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
          marginTop: '25px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
        <Stack>{dictionary.strategy.endTable.gained}: {props.allPoints}</Stack>
        <Stack>{dictionary.strategy.endTable.tries}: {props.numOfTries}</Stack>
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
        {dictionary.relay.endTable.back}
      </Button>
    </Stack>
  )
}