import { Button, Dialog, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Finished } from "../client/components/teamsates/Finished";
import { Countdown } from "../client/components/Countdown";

export function boardWrapper(board: any, description: any) { // TODO: solve types with BoardProps<MyGameState>
  return ({ G, ctx, moves, log }: any) => {
    const [secondsRemaining, setSecondsRemaining] = useState(G.milisecondsRemaining as number | null); // asked from the server

    useEffect(() => {
      setSecondsRemaining(G.milisecondsRemaining);
    }, [G.milisecondsRemaining]);
    return (
      <>
        <Dialog open={
          !secondsRemaining || secondsRemaining < - 10000 || ctx.gameover === true
        } onClose={() => { window.location.reload(); }}>
          {/*<Finished score={G.points}/>*/}
          {/* TODO: fix this*/}
          This part is peak Personality Disorder. This component is not suppesd to be used, as far as I can tell.
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
              <Countdown
                secondsRemaining={secondsRemaining ? secondsRemaining : null}
                setSecondsRemaining={setSecondsRemaining}
                getServerTimer={moves.getTime} />
            </Stack>
          </Stack>
          <Stack sx={{
            marginTop: '10px',
            fontSize: '24px',
            fontWeight: 'bold',
          }}>
            10 érme
          </Stack>
          <Stack sx={{
            fontSize: '14px',
          }}>
            {description} <br />
            Az "Új próbajáték" gombra kattintva próbajáték indul, ami a pontozásba nem számít bele. Bátran kérjetek próbajátékot, hiszen ezzel tudjátok tesztelni, hogy jól értitek-e a játék működését. Az "Új éles játék" gombra kattintva indul a valódi játék, ami már pontért megy.
          </Stack>
          <Stack sx={{
            width: '100%',
            flexDirection: 'row',
          }}>
            <Stack sx={{
              width: '40%',
              flexDirection: 'column',
              padding: '15px',
            }}>
              { ctx.phase === 'startNewGame' &&
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
                  moves.chooseNewGameType("test");
                }}>
                  Új próbajáték kezdése
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
                  moves.chooseNewGameType("live")
                }}>
                  Új játék kezdése
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
                  moves.chooseRole(0);
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
                  moves.chooseRole(1);
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
                {ctx.phase === 'startNewGame' && G.winner === "0" && <p> Gratulálok, nyertetek! Verjétek meg még egyszer a gépet!</p>}
                {ctx.phase === 'startNewGame' && G.winner === "1" && <p> Sajnos a gép nyert. </p>}
              </Stack>
            </Stack>
            <Stack sx={{
              width: '60%',
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