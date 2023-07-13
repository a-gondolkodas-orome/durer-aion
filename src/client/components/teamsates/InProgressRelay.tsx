import { Stack } from '@mui/system';
import { useState } from 'react';
import { Countdown } from '../../../components/Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from '../../../games/relay/game';
import { Dialog } from '@mui/material';
import { useRefreshTeamState, useTeamState } from '../../hooks/user-hooks';
import { ExcerciseTask } from '../ExcerciseTask';
import { ExcerciseForm } from '../ExcerciseForm';
import { Finished } from './Finished';
import { sendDataRelayEnd, sendDataRelayStep } from '../../../common/sendData';
interface MyGameProps extends BoardProps<MyGameState> { };
export function InProgressRelay({ G, ctx, moves }: MyGameProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(G.milisecondsRemaining as number | null);
  const refreshState = useRefreshTeamState();
  const teamState = useTeamState();
  return (
    <>
      <Dialog open={
          !secondsRemaining || secondsRemaining < - 10000 || ctx.gameover === true
        } onClose={() => { window.location.reload(); 
          sendDataRelayEnd(teamState,G,ctx); }}>
          <Finished state={teamState}/>
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
              sendDataRelayStep(teamState,G,ctx)
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