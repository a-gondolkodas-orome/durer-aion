import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useEffect, useRef, useState } from 'react';
import { Countdown } from '../../components/Countdown';

interface MyGameProps extends BoardProps<MyGameState> { }

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  // TODO: use formik
  // create refs to store the text input elements
  const inputK = useRef<HTMLInputElement>(null);
  const inputL = useRef<HTMLInputElement>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(G.milisecondsRemaining as number|null); // asked from the server

  useEffect(() => {
    setSecondsRemaining(G.milisecondsRemaining);
  }, [G.milisecondsRemaining]);

  const onClick = () => {
    // read input value
    const inputValueK = parseInt(inputK.current!.value);
    const inputValueL = parseInt(inputL.current!.value);
    inputK.current!.value = '';
    inputL.current!.value = '';
    moves.changeCoins(inputValueK, inputValueL);
  };

  return (
    <div>
      <div className="flex flex-wrap">
        <div className="p-1 shrink-0 grow basis-8/12">
          <table className="m-2 border-collapse">
            <tbody>
              <tr>
                <th>{G.coins[0]}</th>
                <th>{G.coins[1]}</th>
                <th>{G.coins[2]}</th>
                <th>{G.coins[3]}</th>
                <th>{G.coins[4]}</th>
              </tr>
              <tr>
                <th>{G.coins[5]}</th>
                <th>{G.coins[6]}</th>
                <th>{G.coins[7]}</th>
                <th>{G.coins[8]}</th>
                <th>{G.coins[9]}</th>
              </tr>
            </tbody>
          </table>
          <label> Következő lépés: </label>
          <label htmlFor="stepK"> K: </label>
          <input ref={inputK} id="stepK" type="number" min="1" max="5" v-model="step" className="border-2" />
          <label htmlFor="stepL"> L: </label>
          <input ref={inputL} id="stepL" type="number" min="1" max="5" v-model="step" className="border-2" />
          <button
            className="cta-button" onClick={() => onClick()}
          >Lépek</button>
        </div>
      </div>
      <p>Hátralévő idő: <Countdown secondsRemaining={secondsRemaining} setSecondsRemaining={setSecondsRemaining} getServerTimer={moves.getTime}/></p>
      <div>Hátralevő idő: {G.milisecondsRemaining}</div>
      <button onClick={() => moves.getTime()}>Asd</button>

    </div>
  );
}
