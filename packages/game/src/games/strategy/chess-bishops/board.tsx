import { MyGameState } from './game';
import { BoardProps } from 'boardgame.io/react';

type MyGameProps = BoardProps<MyGameState>;

export function MyBoard({ G, moves }: MyGameProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplate: 'repeat(8, 3rem) / repeat(8, 3rem)',
        gridGap: '0.3em',
      }}
    >
      {G.board.map((cell, index) => (
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
