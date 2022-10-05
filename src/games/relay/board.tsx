import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import { useRef } from 'react';

interface MyGameProps extends BoardProps<MyGameState> { };

export const MyBoard = ({ G, ctx, moves }: MyGameProps) =>{
  const inputEl = useRef<HTMLInputElement>(null);

  const onClick = () => {
    // read input value
    const inputValue = parseInt(inputEl.current!.value);
    inputEl.current!.value = '';
    moves.submitAnswer(inputValue);
  };

  return (
    <div>
      <div>{G.numberOfProblem+1}. feladat</div>
      <div>{G.problemText}</div>
      <label htmlFor="answer"> Válaszod: </label>
      <input ref={inputEl} id="answer" type="number" min="0" max="9999" v-model="step" className="border-2" />
      <button
            className="cta-button" onClick={() => onClick()}
      >Lépek</button>

    </div>
  );
}