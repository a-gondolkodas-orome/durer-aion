import { Stack } from '@mui/system';
import { useEffect, useState } from 'react';
import { Countdown } from '../Countdown';
import { BoardProps } from 'boardgame.io/react';
import { GUESSER_PLAYER, MyGameState, relayProblemResults } from 'game';
import { useBackToHome, useLogout } from '../../hooks/user-hooks';
import { ExerciseTask } from '../ExerciseTask';
import { ExerciseForm } from '../ExerciseForm';
import { RelayEndTable } from '../RelayEndTable';
import { RelayProgressTable } from '../ResultTables';
import { EndDialog } from '../EndCard';
import { useClientRepo } from '../../client-repo-context';
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
  const logout = useLogout();
  // Closing the dialog leaves the way its button does.
  const backToHome = useBackToHome(selectRoundOnEnd ? logout : undefined);
  const theme = useTheme();
  const { t } = useTranslation();
  // A guess hands the turn to the judge until it rules; any move of the team's
  // in that gap is out of turn and boardgame.io rejects it. The client applies
  // a move at once but leaves the turn change to the server, so G.answer, set
  // by the guess and cleared by the ruling, is what covers the round trip.
  const awaitingJudge = G.answer !== null || ctx.currentPlayer !== GUESSER_PLAYER;
  // Near the end the clock is synced once a second, so a sync skipped there while
  // the judge has the turn is made up for by the next one. The sync on load is
  // not retried: loaded during the judge's turn, the clock runs on the server
  // time it last had until that end-of-round polling.
  const syncTime = () => {
    if (!awaitingJudge) {
      void clientRepo.syncRelayTime(moves);
    }
  };

  useEffect(() => {
    if (!ctx.gameover) {
      // This function runs only once (on page reload) because it is inside a useEffect.
      // Otherwise, it would run on every render.
      const gameNotStarted = G.numberOfTry === 0;
      if (gameNotStarted) {
        void clientRepo.startRelayGame(moves);
      } else {
        syncTime();
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
  const problems = relayProblemResults(G);
  return (
    <>
      <EndDialog open={finished} onClose={backToHome}>
        <RelayEndTable allPoints={G.points} selectRound={selectRoundOnEnd} problems={problems}/>
      </EndDialog>
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
            awaitingJudge={awaitingJudge}
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
              getServerTimer={syncTime}
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
            <RelayProgressTable problems={problems} current={G.currentProblem}/>
            <Stack sx={{ fontSize: '13px', color: '#666' }}>
              {t('relay.progress', { points: t('general.points', { count: G.points }) })}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </>
  )
}
