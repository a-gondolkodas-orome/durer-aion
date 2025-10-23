import { MyGameState, Position } from './game';
import { BoardProps } from 'boardgame.io/react';
import './style.css';

interface MyGameProps extends BoardProps<MyGameState> { };

// Helper function: returns html element of rook
function addRook(cellID : Position, G: any) {
  if (G.rookPosition[0] === cellID[0] && G.rookPosition[1] === cellID[1])
    return <img className="rook" src="bastya.svg" alt="Bábu" />
}

export function MyBoard({ G, ctx, moves }: MyGameProps) {
  const tableMark = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));

  return (
    <div className="board-center">
      <table id="board" className="game-active">
        <tbody>
          {tableMark.map((row, rowNumber) => (<tr key={rowNumber}>
            {row.map((elem, colNumber) => (
              <td
                key={colNumber}
                onClick={() => moves.clickCell([rowNumber, colNumber])
                }>
                {addRook([rowNumber, colNumber], G)}
              </td>
            )
            )}
          </tr>))}
        </tbody>
      </table></div>
  );
}
