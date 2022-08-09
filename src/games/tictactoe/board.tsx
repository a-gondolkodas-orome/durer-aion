import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';

interface MyGameProps extends BoardProps<MyGameState> {};

export function MyBoard({ G, ctx, moves } : MyGameProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplate: 'repeat(3, 3rem) / repeat(3, 3rem)',
        gridGap: '0.3em',
      }}
    >
      {G.cells.map((cell, index) => (
        <button
          key={index}
          onClick={() => moves.clickCell(index)}
          disabled={cell !== null}
        >
          {cell}
        </button>
      ))}
    </div>
    );
}
