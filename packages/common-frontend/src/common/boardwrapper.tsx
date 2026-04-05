import { Button, Dialog, Stack, alpha } from "@mui/material";
import { useEffect, useState } from "react";
import { Countdown } from "../client/components/Countdown";
import { StrategyEndTable } from "../client/components/StrategyEndTable";
import { useRefreshTeamState, useToHome } from "../client/hooks/user-hooks";
import { useClientRepo } from "../client/api-repository-interface";
import { GUESSER_PLAYER, JUDGE_PLAYER } from "game";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

export function boardWrapper(board: any, description: any) { //<please> TODO: solve types with BoardProps<MyGameState>
  return ({ G, ctx, moves, log }: any) => {
    const [msRemaining, setMsRemaining] = useState(G.millisecondsRemaining as number); // asked from the server
    const [gameover, setGameover] = useState(ctx.gameover);
    const toHome = useToHome();
    const refreshState = useRefreshTeamState();
    const isOffline = useClientRepo().version === "OFFLINE";
    const theme = useTheme();
    const { t } = useTranslation(undefined, { keyPrefix: 'strategy' });

    useEffect(() => {
      if (!ctx.gameover) {
        moves.getTime();
      }
      setGameover(ctx.gameover)
    }, [ctx.gameover, moves]);
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
              backgroundColor: theme.palette.background.paper,
            }
          }}
          open={
            finished
          } onClose={async () => {
            await refreshState();
            await toHome();
            window.location.reload();
          }}>
          <StrategyEndTable allPoints={G.points} numOfTries={G.numberOfTries} />
        </Dialog>
        <Stack sx={{
          padding: '20px',
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
          borderRadius: "25px",
          display: 'flex',
        }}>
          <Stack sx={{
            flexDirection: 'row',
            fontSize: '20px',
            fontWeight: 'bold',
            width: '100%',
          }}>
            <Stack sx={{
              width: '225px',
            }}>
              {t('name')}
            </Stack>
            <Stack sx={{ flex: 1 }} />
            <Stack sx={{
              flexDirection: 'row',
              marginRight: '10px'
            }}>
              <b style={{ marginRight: '5px' }}>{t('remainingTime', { keyPrefix: 'general' })}:</b>
              {!finished && <Countdown
                msRemaining={msRemaining ?? null}
                setMsRemaining={setMsRemaining}
                getServerTimer={moves.getTime}
                endTime={new Date(G.end)}
                serverRemainingMs={G.millisecondsRemaining} />}
            </Stack>
          </Stack>
          { isOffline && 
          <Stack sx={{
            flexDirection: 'row',
            width: '250px',
            fontSize: '10px',
            marginLeft: 'auto',
          }}>
          {t('timeNotReal', { keyPrefix: 'warnings' })}
          </Stack>}
          <Stack sx={{
            marginTop: '10px',
            fontSize: {
              xs: '14px',
              md: '24px',
            },
            // fontWeight: 'bold',
          }}>
            {description}
            <strong>{t('instructions')}</strong>{t('instructionDescription')}
          </Stack>

          <Stack sx={{
            marginTop: '20px',
            fontSize: {
              xs: '14px',
              md: '24px',
            },
            // fontWeight: 'bold',
          }}>
            {t('realResults', { gamesLost: G.numberOfLoss, gamesWon: G.numberOfTries-G.numberOfLoss-Number(G.winner===null && G.difficulty==="live")})}
          </Stack>

          <Stack sx={{
            width: '100%',
            flexDirection: {
              xs: 'column',
              md: 'row',
            }
          }}>
            <Stack sx={{
              width: {
                xs: '100%',
                md: '40%',
              },
              flexDirection: 'column',
              padding: '15px',
            }}>
              {ctx.phase === 'startNewGame' &&
                <Stack sx={{
                  width: '100%',
                  flexDirection: 'row',
                  marginBottom: '20px',
                }}>
                  <Button sx={{
                    width: '45%',
                    height: '60px',
                    fontSize: {
                      xs: '14px',
                      sm: '18px',
                    },
                    alignSelf: 'center',
                    textTransform: 'none',
                    borderRadius: '10px',
                  }} variant='contained' color='primary' onClick={() => {
                    moves.chooseNewGameType("test");
                  }}>
                    {t('testGameButton')}
                  </Button>
                  <Stack sx={{ width: '10%' }} />
                  <Button sx={{
                    width: '45%',
                    height: '60px',
                    fontSize: {
                      xs: '14px',
                      sm: '18px',
                    },
                    alignSelf: 'center',
                    textTransform: 'none',
                    borderRadius: '10px',
                  }} variant='contained' color='primary' onClick={() => {
                    moves.chooseNewGameType("live")
                  }}>
                    {t('realGameButton')}
                  </Button>
                </Stack>
              }
              {ctx.phase === 'chooseRole' &&
                <Stack sx={{
                  width: '100%',
                  flexDirection: 'row',
                  marginBottom: '20px',
                }}>
                  <Button sx={{
                    width: '45%',
                    height: '60px',
                    fontSize: '18px',
                    alignSelf: 'center',
                    textTransform: 'none',
                    borderRadius: '10px',
                  }} variant='contained' color='primary' onClick={() => {
                    moves.chooseRole(GUESSER_PLAYER);
                  }}>
                    {t('firstPlayer')}
                  </Button>
                  <Stack sx={{ width: '10%' }} />
                  <Button sx={{
                    width: '45%',
                    height: '60px',
                    fontSize: '18px',
                    alignSelf: 'center',
                    textTransform: 'none',
                    borderRadius: '10px',
                  }} variant='contained' color='primary' onClick={() => {
                    moves.chooseRole(JUDGE_PLAYER);
                  }}>
                    {t('secondPlayer')}
                  </Button>
                </Stack>}
              <Stack sx={{
                width: '100%',
                display: 'block',
                borderRadius: '20px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                borderWidth: '2px',
                textAlign: 'center',
                padding: '15px',
                fontSize: '14px',
                borderStyle: 'solid',
              }}>
                {ctx.phase === 'startNewGame' && G.winner === null && <p> {t('guide.newGame')} </p>}
                {ctx.phase === 'chooseRole' && <p> {t('guide.ifFirstPlayer')} </p>}
                {ctx.phase === 'play' && ctx.currentPlayer === "0" && <p> {t('guide.yourTurn')} </p>}
                {ctx.phase === 'play' && ctx.currentPlayer === "1" && <p> {t('guide.waitingForServer')} </p>}
                {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "live" && <p> {t('guide.realGameWin')} </p>}
                {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "test" && <p> {t('guide.testGameWin')}</p>}
                {ctx.phase === 'startNewGame' && G.winner === "1" && <p> {t('guide.botWins')} </p>}
                {finished && <p> {t('guide.endOfGame')} </p>}
              </Stack>
            </Stack>
            <Stack sx={{
              width: {
                xs: '100%',
                md: '60%',
              },
              flexDirection: 'row',
              padding: '15px',
            }}>
              {board({ G, ctx, moves })}
            </Stack>
          </Stack>
        </Stack>
      </>
    );
  };
};
