import { range } from 'lodash';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { COORDS, LINES } from './board-data';
import { type Board } from './gameplay';

// Map the 0..6 grid coordinates onto a 0..100 viewBox with a margin.
const px = (v: number) => 8 + (v / 6) * 84;
const pos = COORDS.map(([x, y]) => ({ cx: px(x), cy: px(y) }));

// Each line is three collinear adjacent nodes; draw its two segments. Every
// adjacency belongs to exactly one line, so this renders the whole board.
const segments = LINES.flatMap(([a, b, c]) => [[a, b], [b, c]] as const);

export const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isClickable = (node: number) => moves.placePiece.isAllowed(board, node);

  const handleClick = (node: number) => {
    if (!isClickable(node)) return;
    moves.placePiece(board, node);
  };

  const discClass = (cell: Board[number]) => {
    if (cell === 'red') return 'fill-red-700';
    if (cell === 'blue') return 'fill-blue-700';
    return '';
  };

  return (
    <GameBoard>
      <svg viewBox="0 0 100 100" className="aspect-square">
        {segments.map(([a, b], i) => (
          <line
            key={i}
            x1={pos[a].cx}
            y1={pos[a].cy}
            x2={pos[b].cx}
            y2={pos[b].cy}
            className="stroke-slate-900 dark:stroke-slate-300"
            strokeWidth={1.2}
          />
        ))}

        {range(COORDS.length).map((node) => (
          <g
            key={node}
            onClick={() => handleClick(node)}
            onKeyUp={(event) => {
              if (event.key === 'Enter') handleClick(node);
            }}
            tabIndex={isClickable(node) ? 0 : undefined}
            role={isClickable(node) ? 'button' : undefined}
            aria-label={isClickable(node) ? `Empty cell ${node + 1}` : undefined}
            className={isClickable(node) ? 'cursor-pointer' : ''}
          >
            <circle
              cx={pos[node].cx}
              cy={pos[node].cy}
              r={4.2}
              className={`stroke-slate-900 dark:stroke-slate-300 ${
                board[node] !== null
                  ? discClass(board[node])
                  : isClickable(node)
                    ? 'fill-slate-50 dark:fill-slate-500 hocus:fill-blue-200 dark:hocus:fill-blue-600'
                    : 'fill-slate-100 dark:fill-slate-700'
              }`}
              strokeWidth={1}
            />
          </g>
        ))}
      </svg>
    </GameBoard>
  );
};
