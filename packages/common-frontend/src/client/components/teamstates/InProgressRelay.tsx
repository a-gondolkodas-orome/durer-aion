import { Stack } from '@mui/system';
import { useEffect, useMemo, useState } from 'react';
import { Countdown } from '../Countdown';
import { BoardProps } from 'boardgame.io/react';
import { MyGameState } from 'game';
import { Dialog } from '@mui/material';
import { useRefreshTeamState, useToHome } from '../../hooks/user-hooks';
import { ExerciseTask } from '../ExerciseTask';
import { ExerciseForm } from '../ExerciseForm';
import { RelayEndTable } from '../RelayEndTable';
import { useClientRepo } from '../../api-repository-interface';
import { asRelayMoves } from '../../match-moves';
import { useSnackbar } from 'notistack';
import { useTheme } from '@mui/material/styles';
import { alpha } from "@mui/system/colorManipulator"
import { useTranslation } from 'react-i18next';

type MyGameProps = BoardProps<MyGameState>;

// Max points of the tasks in the yearly online competition's relay round
const DEFAULT_MAX_POINTS = [3, 3, 4, 4, 4, 5, 5, 6, 6];

// maxPointsList and selectRoundOnEnd are extra props for relay-practise:
// the max points of the loaded problem set (so the end table can show all
// of its tasks), and a logout button leading back to the round selector
export function InProgressRelay({ G, ctx, moves, isMultiplayer, isConnected, maxPointsList, selectRoundOnEnd }: MyGameProps & {
  maxPointsList?: number[],
  selectRoundOnEnd?: boolean,
}) {
  const [msRemaining, setMsRemaining] = useState(G.millisecondsRemaining);
  const [gameover, setGameover] = useState(ctx.gameover);
  const clientRepo = useClientRepo();
  const { enqueueSnackbar } = useSnackbar();
  // Narrowed once per `moves` object rather than per render: boardgame.io
  // rebuilds it only when the client does.
  const relayMoves = useMemo(() => asRelayMoves(moves), [moves]);
  const connection = useMemo(() => ({ isMultiplayer, isConnected }), [isMultiplayer, isConnected]);
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
        // Losing this one leaves the team on a match that never starts, so it
        // is the other dispatch worth reporting; see ExerciseForm for the
        // answer's own handling.
        void clientRepo.startRelayGame(relayMoves, connection)
          .catch((e: unknown) => {
            enqueueSnackbar(e instanceof Error ? e.message : t('error.unexpected'), { variant: 'error' });
          });
      } else {
        void clientRepo.syncMatchTime(relayMoves);
      }
    }
    setGameover(ctx.gameover)
  }, [ctx.gameover]);
  useEffect(() => {
    setMsRemaining(G.millisecondsRemaining);
  }, [G.millisecondsRemaining]);
  const finished = msRemaining < - 5000 || gameover === true
  const isOffline = clientRepo.version === "OFFLINE";
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
          {<RelayEndTable allPoints={G.points} selectRound={selectRoundOnEnd} task={
           (maxPointsList ?? DEFAULT_MAX_POINTS).map((it, idx) => ({
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
            maxPoints={G.currentProblemMaxPoints}
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
            onSubmit={(input: number) => clientRepo.submitRelayAnswer(input, relayMoves, connection)}
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
              getServerTimer={() => void clientRepo.syncMatchTime(relayMoves)}
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
        </Stack>
      </Stack>
    </>
  )
}
