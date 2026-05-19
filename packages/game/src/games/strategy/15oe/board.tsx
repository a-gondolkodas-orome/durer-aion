import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

type MyGameProps = BoardProps<MyGameState>;

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  if (G || !ctx || !moves) {
    console.error('Not specified game conditions.');
  }

  return (
    <div id="jatek">
    </div>
  );
}
