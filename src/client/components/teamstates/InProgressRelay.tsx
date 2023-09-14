import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import { Countdown } from '../Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from '../../../games/relay/game';
import { Dialog } from '@mui/material';
import { useRefreshTeamState, useTeamState, useToHome } from '../../hooks/user-hooks';
import { ExcerciseTask } from '../ExcerciseTask';
import { ExcerciseForm } from '../ExcerciseForm';
import { sendDataRelayEnd, sendDataRelayStep } from '../../../common/sendData';
import { dictionary } from '../../text-constants';
import { RelayEndTable } from '../RelayEndTable';
interface MyGameProps extends BoardProps<MyGameState> { };
export function InProgressRelay({ G, ctx, moves }: MyGameProps) {
  const [msRemaining, setMsRemaining] = useState(G.milisecondsRemaining);
  const [gameover, setGameover] = useState(ctx.gameover);
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();

  const teamState = useTeamState();
  useEffect(()=>{
    if (!ctx.gameover) {
      moves.getTime();
    }
    if (G.numberOfTry === 0) {
      moves.startGame();
      console.log("Start Game!");
    }
    setGameover(ctx.gameover)
  }, [ctx.gameover, G.numberOfTry]);
  useEffect(() => {
    setMsRemaining(G.milisecondsRemaining);
  }, [G.milisecondsRemaining]);
  const finished = msRemaining < - 5000 || gameover === true
  return (
    <>
      <Dialog maxWidth={false} open={
          finished
        } onClose={async () => { 
          refreshState()
          await toHome();
          // sendDataRelayEnd(teamState, G, ctx);
          window.location.reload(); 
           }}>
          {<RelayEndTable allPoints={G.points} task={
           // TODO .maxpoints
           [3, 3, 4, 4, 4, 5, 5, 6, 6].map((it, idx)=>({
            max: it,
            got: G.previousPoints[idx] ?? null,
           })
           ) 
          }/>}
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
            previousCorrectness={!finished ? G.correctnessPreviousAnswer : null}
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
            <b style={{marginRight: '5px'}}>{dictionary.relay.remainingTime}:</b>
            <Countdown
              msRemaining={msRemaining ? msRemaining : null}
              setMsRemaining={setMsRemaining}
              getServerTimer={moves.getTime} />
          </Stack>
        </Stack>
      </Stack>
    </>
  )
}