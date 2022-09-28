import { MyGameState, Cell } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

interface MyGameProps extends BoardProps<MyGameState> { };

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  const tableMark = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));

  return (
    <div className="board-center">

    </div>
  );
}
