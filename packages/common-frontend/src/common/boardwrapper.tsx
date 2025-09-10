import { Button, Dialog, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Countdown } from "../client/components/Countdown";
import { StrategyEndTable } from "../client/components/StrategyEndTable";
import { useRefreshTeamState, useToHome } from "../client/hooks/user-hooks";
import { useClientRepo } from "../client/api-repository-interface";
import { GUESSER_PLAYER, JUDGE_PLAYER } from "game";

export function boardWrapper(board: any, description: any) { //<please> TODO: solve types with BoardProps<MyGameState>
  return ({ G, ctx, moves, log }: any) => {
    const [msRemaining, setMsRemaining] = useState(G.millisecondsRemaining as number); // asked from the server
    const [gameover, setGameover] = useState(ctx.gameover);
    const toHome = useToHome();
    const refreshState = useRefreshTeamState();
    const isOffline = useClientRepo().version === "OFFLINE";
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
          backgroundColor: '#FFF',
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
              Stratégiás játék
            </Stack>
            <Stack sx={{ width: '100%' }} />
            <Stack sx={{
              flexDirection: 'row',
              width: '262px'
            }}>
              <b style={{ marginRight: '5px', width: '135px' }}>Hátralevő idő:</b>
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
          ("Az óra csak tájékoztató jellegű. Ha lefrissítitek az oldalt, akkor az óra újraindul, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.")
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
            <strong>Tudnivalók: </strong>Az "Új próbajáték" gombra kattintva próbajáték indul, ami a pontozásba nem számít bele. Bátran kérjetek próbajátékot, hiszen ezzel tudjátok tesztelni, hogy jól értitek-e a játék működését. Az "Új éles játék" gombra kattintva indul a valódi játék, ami már pontért megy.

          </Stack>

          <Stack sx={{
            marginTop: '20px',
            fontSize: {
              xs: '14px',
              md: '24px',
            },
            // fontWeight: 'bold',
          }}>
            Éles játékok eddigi eredményei: {G.numberOfTries-G.numberOfLoss-Number(G.winner===null && G.difficulty==="live")} győzelem, {G.numberOfLoss} vereség
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
                    Új próbajáték kezdése
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
                    Új éles játék kezdése
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
                    Kezdő leszek
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
                    Második leszek
                  </Button>
                </Stack>}
              <Stack sx={{
                width: '100%',
                display: 'block',
                borderRadius: '20px',
                backgroundColor: '#93F272',
                borderColor: '#2DAD3A',
                borderWidth: '2px',
                textAlign: 'center',
                padding: '15px',
                fontSize: '14px',
                borderStyle: 'solid',
              }}>
                {ctx.phase === 'startNewGame' && G.winner === null && <p> Kezdj új játékot! </p>}
                {ctx.phase === 'chooseRole' && <p> Válaszd ki, hogy első vagy második játékos akarsz-e lenni. </p>}
                {ctx.phase === 'play' && ctx.currentPlayer === "0" && <p> Most Te jössz! </p>}
                {ctx.phase === 'play' && ctx.currentPlayer === "1" && <p> Várakozás a szerverre... </p>}
                {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "live" && <p> Gratulálok, nyertetek! Verjétek meg még egyszer a gépet!</p>}
                {ctx.phase === 'startNewGame' && G.winner === "0" && G.difficulty === "test" && <p> Gratulálok, a próbajátékban nyertetek!</p>}
                {ctx.phase === 'startNewGame' && G.winner === "1" && <p> Sajnos a gép nyert. </p>}
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
