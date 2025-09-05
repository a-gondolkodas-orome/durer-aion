import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import { Countdown } from '../Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from 'game';
import { Dialog } from '@mui/material';
import { useRefreshTeamState, useToHome } from '../../hooks/user-hooks';
import { ExcerciseTask } from '../ExcerciseTask';
import { ExcerciseForm } from '../ExcerciseForm';
import { dictionary } from '../../text-constants';
import { RelayEndTable } from '../RelayEndTable';
import { IS_OFFLINE_MODE } from '../../utils/util';

interface MyGameProps extends BoardProps<MyGameState> { };
export function InProgressRelay({ G, ctx, moves }: MyGameProps) {
  const [msRemaining, setMsRemaining] = useState(G.millisecondsRemaining);
  const [gameover, setGameover] = useState(ctx.gameover);
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();

  useEffect(()=>{
    if (!ctx.gameover) {
      // This function runs only once (on page reload) because it is inside a useEffect.
      // Otherwise, it would run on every render.
      const gameNotStarted = G.numberOfTry === 0;
      if (gameNotStarted) {
        moves.startGame();
      } else {
        moves.getTime();
      }
    }
    setGameover(ctx.gameover)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.gameover]);
  useEffect(() => {
    setMsRemaining(G.millisecondsRemaining);
  }, [G.millisecondsRemaining]);
  const finished = msRemaining < - 5000 || gameover === true
  return (
    <>
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
          finished
        } onClose={async () => { 
          refreshState()
          await toHome();
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
        flexDirection: {
          xs: 'column',
          md: 'row',
        },
        marginTop: "20px",
      }}>
        <Stack sx={{
            textAlign: 'center',
            width: '100%',
            fontSize: 18,
            flexDirection: 'row',
            display: {
              md: 'none'
            },
            paddingLeft: "30px",
            marginBottom: '20px'
          }}>
            <b style={{marginRight: '5px'}}>{dictionary.relay.remainingTime}:</b>
            <Countdown
              msRemaining={msRemaining ?? null}
              setMsRemaining={()=>{}}
              getServerTimer={()=>{}}
              endTime={new Date(G.end)} 
              serverRemainingMs={G.millisecondsRemaining}/>
          </Stack>
        <Stack sx={{
          width: {
            xs: '100%',
            md: "calc(100% - 380px)",
          },
          backgroundColor: "#fff",
          borderRadius: {
            xs: 0,
            md: "25px",
          },
          padding: '30px',
        }}>
          <ExcerciseTask 
            task={G.problemText}
            maxPoints={G.currentProblemMaxPoints}
            serial={G.currentProblem+1}
            pictureUrl={G.url}
          />
        </Stack>
        <Stack sx={{
          width: {
            xs: "0px",
            md: "30px"
          },
          height: {
            xs: "30px",
            md: "0px"
          },
          }} />
        <Stack sx={{
          width: {
            xs: '100%',
            md: "350px",
          },
          maxHeight: "min-content",
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
              // TODO this should be done in repository
              // sendDataRelayStep(teamState, G, ctx, parseInt(input));
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
            {!finished && <Countdown
              msRemaining={msRemaining ?? null}
              setMsRemaining={setMsRemaining}
              getServerTimer={moves.getTime}
              endTime={new Date(G.end)}
              serverRemainingMs={G.millisecondsRemaining} />}
          </Stack>
          {IS_OFFLINE_MODE && 
            <Stack sx={{
              flexDirection: 'row',
              width: '250px',
              fontSize: '10px',
            }}>
            (Az óra csak tájékoztató jellegű. Más eszközökön és böngészőkben más időt fogtok látni, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.)
            </Stack>
          }
        </Stack>
      </Stack>
    </>
  )
}