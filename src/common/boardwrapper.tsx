import { Stack } from '@mui/system';
import {Button} from '@mui/material'

export function boardWrapper(board: any, description: any) { // TODO: solve types with BoardProps<MyGameState>
  return ({ G, ctx, moves, log }: any) => {
    return (
      <div>
        <p>{description}</p>
        <p>Az "Új próbajáték" gombra kattintva próbajáték indul, ami a pontozásba nem számít bele. Bátran kérjetek próbajátékot, hiszen ezzel tudjátok tesztelni, hogy jól értitek-e a játék működését. Az "Új éles játék" gombra kattintva indul a valódi játék, ami már pontért megy.</p>
        {ctx.phase === 'startNewGame' && G.winner === null && (
          <Stack direction="row" spacing={2}>
            <Button variant="contained"
              onClick={() => moves.chooseNewGameType("test")}
            >Új próbajáték kezdése</Button>
            <Button variant="contained"
              onClick={() => moves.chooseNewGameType("live")}
            >Új játék kezdése</Button>
          </Stack>)}
          {ctx.phase === 'chooseRole' &&
          <Stack direction="row" spacing={2}>
            <Button variant="contained"
              onClick={() => moves.chooseRole(0)}
            >Kezdő leszek</Button>
            <Button variant="contained"
              onClick={() => moves.chooseRole(1)}
            >Második leszek</Button>
          </Stack>}
        {ctx.phase === 'startNewGame' && G.winner === null && <p> Kezdj új játékot! </p>}
        {ctx.phase === 'chooseRole' && <p> Válaszd ki, hogy első vagy második játékos akarsz-e lenni. </p>}
        {ctx.phase === 'play' && ctx.currentPlayer === "0" && <p> Most Te jössz! </p>}
        {ctx.phase === 'play' && ctx.currentPlayer === "1" && <p> Várakozás a szerverre... </p>}
        {ctx.phase === 'startNewGame' && G.winner === "0" && <p> Gratulálok, nyertetek! Verjétek meg még egyszer a gépet!</p>}
        {ctx.phase === 'startNewGame' && G.winner === "1" && <p> Sajnos a gép nyert. </p>}
        {ctx.gameover === true && G.points > 0 && <p> Gratulálok, kétszer egymást után megvertétek a gépet. {G.points} pontot értetek el ezen a fordulón. </p>}
        {ctx.gameover === true && G.points === 0 && <p> Sajnos lejárt az időtök! :( </p>}
        {board({ G, ctx, moves })}
      </div>
    );
  };
};