import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

type MyGameProps = BoardProps<MyGameState>;

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  void G;
  void ctx;
  void moves;

  return (
    <div id="jatek">
    </div>
  );
}
