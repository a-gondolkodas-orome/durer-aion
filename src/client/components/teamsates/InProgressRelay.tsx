import { Stack } from '@mui/system';
import React, { useState } from 'react';
import { Countdown } from '../../../components/Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from '../../../games/relay/game';
import { Button, Dialog } from '@mui/material';
import { useRefreshTeamState } from '../../hooks/user-hooks';
import { ExcerciseTask } from '../ExcerciseTask';
import { ExcerciseForm } from '../ExcerciseForm';
interface MyGameProps extends BoardProps<MyGameState> { };
export function InProgressRelay({ G, ctx, moves }: MyGameProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(G.milisecondsRemaining as number | null);
  const refreshState = useRefreshTeamState();
  return (
    <>
      <Dialog open={
        !secondsRemaining || secondsRemaining < - 10000
      } onClose={() => { refreshState() }}>
        <Stack sx={{
          width: '350px',
          textAlign: 'center',
          padding: '40px',
          fontSize: '18px',
          fontWeight: 'bold',
        }}>
          <Stack>Lejárt az idő</Stack>
          <Button sx={{
            width: '170px',
            height: '60px',
            marginTop: '40px',
            fontSize: '24px',
            alignSelf: 'center',
            textTransform: 'none',
          }} variant='contained' color='primary' onClick={() => {
            refreshState()
          }}>
            Tovább
          </Button>
        </Stack>
      </Dialog>
      <Stack sx={{
        with: "100%",
        display: 'flex',
        flexDirection: 'row',
        marginTop: "20px",
      }}>
        <Stack sx={{
          width: "calc(100% - 380px)",
          backgroundColor: "#fff",
          borderRadius: "25px",
          padding: '30px',
        }}>
          <ExcerciseTask 
            task={G.problemText}
            maxPoints={G.currentProblemMaxPoints}
            serial={G.currentProblem+1}
            pictureUrl={G.url}
          />
        </Stack>
        <Stack sx={{ width: "30px" }} />
        <Stack sx={{
          width: "350px",
          maxHeight: "300px",
          backgroundColor: "#fff",
          borderRadius: "25px",
          padding: '30px',
        }}>
          <ExcerciseForm 
            previousTries={G.previousAnswers[G.currentProblem].map(it=>it.answer)} 
            previousCorrectness={G.correctnessPreviousAnswer}
            attempt={(G.currentProblem+1)*3+G.numberOfTry}
            onSubmit={(input) => {
              moves.submitAnswer(parseInt(input))
            }}
          />
          <Stack sx={{
            marginTop: "15px",
            textAlign: 'center',
            width: '100%',
            fontSize: 18,
            flexDirection: 'row',
          }}>
            <b style={{marginRight: '5px'}}>Hátralevő idő:</b>
            <Countdown
              secondsRemaining={secondsRemaining ? secondsRemaining : null}
              setSecondsRemaining={setSecondsRemaining}
              getServerTimer={moves.getTime} />
          </Stack>
        </Stack>
      </Stack>
    </>
  )
}