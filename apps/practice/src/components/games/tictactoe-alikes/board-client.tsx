import { range } from 'lodash';
import { type BoardClientProps, GameBoard } from 'strategy-game-factory';
import { type Board } from './gameplay';

// Shared by anti-tictactoe and tictactoe-doublestart, whose boards are the same
// 3×3 grid of red and blue pieces placed by the same `placePiece` move; the two
// copies of this component were identical apart from indentation. The sibling
// `tictactoe` keeps its own: it has a second phase with a `whitenPiece` move, a
// third piece colour and a hover affordance, and the props needed to cover that
// here would cost more than the copy saves.
export const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const pieceColor = (id: number) => board[id] === 'red' ? 'bg-red-800' : 'bg-blue-800';

  // The grid gap is the border: the container colour shows through it, so every
  // cell needs its own background or the gaps disappear into it.
  return (
    <GameBoard>
      <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-600 gap-1 p-1">
        {range(9).map(id => (
          <button
            key={id}
            disabled={!moves.placePiece.isAllowed(board, id)}
            onClick={() => moves.placePiece(board, id)}
            className="aspect-square p-[25%] bg-surface-elevated"
          >
            {board[id] && (
              <span
                className={`w-full aspect-square block rounded-full ${pieceColor(id)}`}
              ></span>
            )}
          </button>
        ))}
      </div>
    </GameBoard>
  );
};
