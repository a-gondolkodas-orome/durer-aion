import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useRef } from 'react';

interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  // TODO: use formik
  // create a ref to store the text input element
  const inputEl = useRef<HTMLInputElement>(null);

  const onClick = () => {
    // read input value
    const inputValue = parseInt(inputEl.current!.value);
    inputEl.current!.value = '';
    moves.clickCell(inputValue);
  };

  const arrayToString = (numbers: number[]) => {
    return numbers.map((n) => n.toString()).join(', ');
  }

  return (
    <div>
      <div className="flex flex-wrap">
      <div id="allapot">
        A Ti számaitok: {arrayToString(G.playerNumbers)}<br/>
        Gép számai: {arrayToString(G.enemyNumbers)}<br/>
        Maradék számok: {arrayToString(G.remainingNumbers)}
      </div>

        <label htmlFor="step"> Következő lépés: </label>
        <input ref={inputEl} id="step" type="number" min="1" max="9" v-model="step" className="border-2" />
        <button
          className="cta-button" onClick={() => onClick()}
        >Lépek</button>
        {ctx.gameover && <div id="loser">{ctx.gameover.loser}. játékos vesztett.</div>}
      </div>
    </div>
  );
}
