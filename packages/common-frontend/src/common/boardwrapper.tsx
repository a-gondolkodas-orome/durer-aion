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
              md: '18px',
            },
          }}>
            <Stack sx={{ fontWeight: 'bold', marginTop: '10px' }}>
              {t('description')}:
            </Stack>
            {description}
            <Stack sx={{ fontWeight: 'bold', marginTop: '10px' }}>
              {t('instructions')}:
            </Stack>
            <p>{t('instructionDescription')}</p>
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
              padding: '15px',
            }}>
              <Stack
                component="table"
                sx={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  border: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  color: theme.palette.text.primary,
                }}
                >
                <Stack component="tbody">
                  <Stack component="tr" sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                  <Stack
                    component="td"
                    sx={{
                      width: '35%',
                      fontWeight: 700,
                      p: '12px',
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {t('result', { keyPrefix: 'chooser' })}
                  </Stack>
                  <Stack
                    component="td"
                    sx={{
                      p: '12px',
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: {
                        xs: '14px',
                        md: '18px',
                      },
                    }}
                  >
                    {t("realResults", {
                    wins: t("wins", {
                      count: G.numberOfTries - G.numberOfLoss - Number(G.winner === null && G.difficulty === "live"),
                    }),
                    defeats: t("defeats", { count: G.numberOfLoss }),
                    })}
                  </Stack>
                  </Stack>

                  <Stack component="tr">
                  <Stack
                    component="td"
                    sx={{
                      fontWeight: 700,
                      p: '12px',
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {t('guide.actions')}
                  </Stack>
                  <Stack
                    component="td"
                    sx={{
                      p: '12px',
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {ctx.phase === 'startNewGame' && (
                    <Stack sx={{ width: '100%', flexDirection: 'row' }}>
                      <Button sx={{
                        width: '48%',
                        height: '50px',
                        fontSize: { xs: '14px', sm: '16px' },
                        textTransform: 'none',
                        borderRadius: '10px',
                      }} variant='contained' color='primary' onClick={() => moves.chooseNewGameType("test")}>
                      {t('testGameButton')}
                      </Button>
                      <Stack sx={{ width: '4%' }} />
                      <Button sx={{
                        width: '48%',
                        height: '50px',
                        fontSize: { xs: '14px', sm: '16px' },
                        textTransform: 'none',
                        borderRadius: '10px',
                      }} variant='contained' color='primary' onClick={() => moves.chooseNewGameType("live")}>
                      {t('realGameButton')}
                      </Button>
                    </Stack>
                    )}

                    {ctx.phase === 'chooseRole' && (
                    <Stack sx={{ width: '100%', flexDirection: 'row' }}>
                      <Button sx={{
                        width: '48%',
                        height: '50px',
                        fontSize: '16px',
                        textTransform: 'none',
                        borderRadius: '10px',
                      }} variant='contained' color='primary' onClick={() => moves.chooseRole(GUESSER_PLAYER)}>
                      {t('firstPlayer')}
                      </Button>
                      <Stack sx={{ width: '4%' }} />
                      <Button sx={{
                        width: '48%',
                        height: '50px',
                        fontSize: '16px',
                        textTransform: 'none',
                        borderRadius: '10px',
                      }} variant='contained' color='primary' onClick={() => moves.chooseRole(JUDGE_PLAYER)}>
                      {t('secondPlayer')}
                      </Button>
                    </Stack>
                    )}

                    {ctx.phase !== 'startNewGame' && ctx.phase !== 'chooseRole' &&
                    <Stack sx={{ width: '100%', flexDirection: 'row' }}>
                      <Button sx={{
                        width: '100%',
                        height: '50px',
                        fontSize: '16px',
                        textTransform: 'none',
                        borderRadius: '10px',
                      }} variant='contained' color='primary' disabled>
                      {t('guide.play')}
                      </Button>
                    </Stack>
                    }
                  </Stack>
                  </Stack>

                  <Stack component="tr">
                  <Stack
                    component="td"
                    sx={{
                    p: '12px',
                    color: theme.palette.primary.main,
                    fontSize: '16px',
                    fontWeight: 500,
                    }}
                  >
                    {ctx.phase === 'startNewGame' && G.winner === null && t('guide.newGame')}
                    {ctx.phase === 'chooseRole' && t('guide.ifFirstPlayer')}
                    {ctx.phase === 'play' && ctx.currentPlayer === "0" && t('guide.yourTurn')}
                    {ctx.phase === 'play' && ctx.currentPlayer === "1" && t('guide.waitingForServer')}
                    {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "live" && t('guide.realGameWin')}
                    {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "test" && t('guide.testGameWin')}
                    {ctx.phase === 'startNewGame' && G.winner === "1" && t('guide.botWins')}
                    {finished && t('guide.endOfGame')}
                  </Stack>
                  </Stack>
                </Stack>
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
