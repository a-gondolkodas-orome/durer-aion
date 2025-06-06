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
    moves.increaseNumber(inputValue);
  };

  return (
    <div>
      <div className="flex flex-wrap">
        <div className="p-1 shrink-0 grow basis-8/12">
          <table className="m-2 border-collapse">
            <tbody>
              <tr>
                <th>Szám</th>
                <th>Cél</th>
                <th>Tiltott lépés</th>
              </tr>
              <tr>
                <td className="text-center h-36 w-36 border-4 text-8xl">{G.current}</td>
                <td className="text-center h-36 w-36 border-4 text-8xl">{G.target}</td>
                <td className="text-center h-36 w-36 border-4 text-8xl">{G.restricted || "-"}</td>
              </tr>
            </tbody>
          </table>
          <label htmlFor="step"> Következő lépés: </label>
          <input ref={inputEl} id="step" type="number" min="1" max="12" v-model="step" className="border-2" />
          <button
            className="cta-button" onClick={() => onClick()}
          >Lépek</button>
        </div>
        {ctx.gameover && <div id="loser">{ctx.gameover.loser}. játékos vesztett.</div>}
      </div>
    </div>
  );
}
