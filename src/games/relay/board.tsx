import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useEffect, useRef, useState } from 'react';
import { Countdown } from '../../components/Countdown';

interface MyGameProps extends BoardProps<MyGameState> { };

export const MyBoard = ({ G, ctx, moves }: MyGameProps) =>{
  const [secondsRemaining, setSecondsRemaining] = useState(G.milisecondsRemaining as number|null); // asked from the server

  useEffect(() => {
    setSecondsRemaining(G.milisecondsRemaining);
  }, [G.milisecondsRemaining]);

  const inputEl = useRef<HTMLInputElement>(null);

  const onClick = () => {
    // read input value
    const inputValue = parseInt(inputEl.current!.value);
    inputEl.current!.value = '';
    moves.submitAnswer(inputValue);
  };

  return (
    <div>
      <div>{G.currentProblem+1}. feladat ({G.numberOfTry}. próba - {G.currentProblemMaxPoints} pont)</div>
      <div>{G.problemText}</div>
      <label htmlFor="answer"> Válaszod: </label>
      <input ref={inputEl} id="answer" type="number" min="0" max="9999" v-model="step" className="border-2" />
      <button
            className="cta-button" onClick={() => onClick()}
            >Lépek</button>
      <div>Korábbi válaszok: {G.previousAnswers[G.currentProblem].join(", ")}</div>
      <div>Jelenlegi összpontszám: {G.points}</div>
      <p>Hátralévő idő: <Countdown secondsRemaining={secondsRemaining} setSecondsRemaining={setSecondsRemaining} getServerTimer={moves.getTime}/></p>
      <div>Hátralevő idő: {G.milisecondsRemaining}</div>
      <button onClick={() => moves.getTime()}>Asd</button>
    </div>
  );
}