import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

interface MyGameProps extends BoardProps<MyGameState> { };

export function MyBoard({ G, ctx, moves }: MyGameProps) {

  return (
    <div id="jatek">
    </div>
  );
}
