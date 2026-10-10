import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import { Countdown } from '../Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from 'game';
import { Dialog } from '@mui/material';
import { useRefreshTeamState, useToHome } from '../../hooks/user-hooks';
import { ExerciseTask } from '../ExerciseTask';
import { ExerciseForm } from '../ExerciseForm';
import { RelayEndTable } from '../RelayEndTable';
import { RelayProgressTable } from '../ResultTables';
import { relayProblemRows } from '../relay-results';
import { useClientRepo } from '../../api-repository-interface';
import { useTheme } from '@mui/material/styles';
import { alpha } from "@mui/system/colorManipulator"
import { useTranslation } from 'react-i18next';

type MyGameProps = BoardProps<MyGameState>;

// selectRoundOnEnd is an extra prop for relay-practise: a logout button
// leading back to the round selector
export function InProgressRelay({ G, ctx, moves, selectRoundOnEnd }: MyGameProps & {
  selectRoundOnEnd?: boolean,
}) {
  const [msRemaining, setMsRemaining] = useState(G.millisecondsRemaining);
  const [gameover, setGameover] = useState(ctx.gameover);
  const clientRepo = useClientRepo();
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  const theme = useTheme();
  const { t } = useTranslation();
  // Named so the handler below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    window.location.reload();
  };

  useEffect(() => {
    if (!ctx.gameover) {
      // This function runs only once (on page reload) because it is inside a useEffect.
      // Otherwise, it would run on every render.
      const gameNotStarted = G.numberOfTry === 0;
      if (gameNotStarted) {
        void clientRepo.startRelayGame(moves);
      } else {
        void clientRepo.syncRelayTime(moves);
      }
    }
    setGameover(ctx.gameover)
  }, [ctx.gameover]);
  useEffect(() => {
    setMsRemaining(G.millisecondsRemaining);
  }, [G.millisecondsRemaining]);
  const finished = msRemaining < - 5000 || gameover === true
  const isOffline = clientRepo.version === "OFFLINE";
  // Until the judge's firstProblem move, the state holds no problem to show
  // and the form has no move to submit to.
  if (G.numberOfTry === 0 && !finished) {
    return <div>{t('general.loading')}</div>;
  }
  return (
    <>
      <Dialog
        maxWidth={false}
        slotProps={{ paper: {
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
            backgroundColor: theme.palette.background.paper,
          }
        } }}
        open={
          finished
        } onClose={() => void backToHome()}>
          <RelayEndTable allPoints={G.points} selectRound={selectRoundOnEnd} problems={relayProblemRows(G)}/>
        </Dialog>
      <Stack sx={{
        width: "100%",
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
            <b style={{ marginRight: '5px' }}>{t('general.remainingTime')}:</b>
            <Countdown
              msRemaining={msRemaining ?? null}
              setMsRemaining={() => undefined}
              getServerTimer={() => undefined}
              endTime={new Date(G.end)}
              serverRemainingMs={G.millisecondsRemaining}/>
          </Stack>
        <Stack sx={{
          width: {
            xs: '100%',
            md: "calc(100% - 380px)",
          },
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
          borderRadius: {
            xs: 0,
            md: "25px",
          },
          padding: '30px',
        }}>
          <ExerciseTask
            task={G.problemText}
            availablePoints={G.currentProblemAvailablePoints}
            serial={G.currentProblem + 1}
            taskCount={G.maxPointsList.length}
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
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
          borderRadius: "25px",
          padding: '30px',
        }}>
          <ExerciseForm
            previousTries={G.previousAnswers[G.currentProblem].map(it => it.answer)}
            previousCorrectness={!finished ? G.correctnessPreviousAnswer : null}
            attempt={(G.currentProblem + 1) * 3 + G.numberOfTry}
            onSubmit={(input: number) => clientRepo.submitRelayAnswer(input, moves)}
          />
          <Stack sx={{
            marginTop: "15px",
            textAlign: 'center',
            width: '100%',
            fontSize: 18,
            flexDirection: 'row',
          }}>
            <b style={{ marginRight: '5px' }}>{t('general.remainingTime')}:</b>
            {!finished && <Countdown
              msRemaining={msRemaining ?? null}
              setMsRemaining={setMsRemaining}
              getServerTimer={() => void clientRepo.syncRelayTime(moves)}
              endTime={new Date(G.end)}
              serverRemainingMs={G.millisecondsRemaining} />}
          </Stack>
          { isOffline &&
            <Stack sx={{
              flexDirection: 'row',
              width: '250px',
              fontSize: '10px',
            }}>
            ({t('general.warning.timeNotReal')})
            </Stack>
          }
          <Stack sx={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e6e6e6',
            gap: '8px',
          }}>
            <RelayProgressTable problems={relayProblemRows(G)} current={G.currentProblem}/>
            <Stack sx={{ fontSize: '13px', color: '#666' }}>
              {t('relay.progress', { points: t('general.points', { count: G.points }) })}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  )
}
