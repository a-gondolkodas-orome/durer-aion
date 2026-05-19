import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

type MyGameProps = BoardProps<MyGameState>;

export function MyBoard({ G }: MyGameProps) {

  return (
    <div id="jatek">
      {G.points}
    </div>
  );
}
