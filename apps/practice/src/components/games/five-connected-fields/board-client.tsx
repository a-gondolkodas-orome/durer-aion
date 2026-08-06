import { range } from 'lodash';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { type Board, side1, side2 } from './gameplay';

// A deliberately non-obvious drawing of the K(2,3) graph: the two hub fields
// (side 1) sit at the diagonal corners, the three side-2 fields at top-right,
// centre and bottom-left. Every hub is joined to every side-2 field, which
// yields the symmetric "house" shape without revealing the bipartite split.
const coords: Record<number, { cx: string; cy: string }> = {
  0: { cx: '28%', cy: '22%' }, // A (hub, top-left)
  1: { cx: '82%', cy: '74%' }, // B (hub, bottom-right)
  2: { cx: '77%', cy: '22%' }, // C (top-right)
  3: { cx: '52%', cy: '52%' }, // D (centre)
  4: { cx: '18%', cy: '74%' }  // E (bottom-left)
};

const edges = side1.flatMap((a) => side2.map((b) => [a, b] as const));

export const BoardClient = ({ board, moves }: BoardClientProps<Board>) => {
  const isClickable = (node: number) => moves.placeCoin.isAllowed(board, node);

  return (
    <GameBoard>
      <svg className="aspect-square stroke-slate-900 dark:stroke-slate-300 stroke-2">
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={coords[a].cx}
            y1={coords[a].cy}
            x2={coords[b].cx}
            y2={coords[b].cy}
          />
        ))}

        {range(5).map((node) => (
          <g
            key={node}
            onClick={() => moves.placeCoin(board, node)}
            onKeyUp={(event) => {
              if (event.key === 'Enter') moves.placeCoin(board, node);
            }}
            tabIndex={isClickable(node) ? 0 : undefined}
            role={isClickable(node) ? 'button' : undefined}
            aria-label={isClickable(node) ? `Field ${node + 1}, ${board[node]} coins` : undefined}
            className={isClickable(node) ? 'cursor-pointer' : ''}
          >
            <circle
              cx={coords[node].cx}
              cy={coords[node].cy}
              r="11%"
              className={
                isClickable(node)
                  ? 'fill-slate-50 dark:fill-slate-500 hocus:fill-blue-200 dark:hocus:fill-blue-600'
                  : 'fill-slate-300 dark:fill-slate-800'
              }
            />
            <text
              x={coords[node].cx}
              y={coords[node].cy}
              textAnchor="middle"
              dominantBaseline="central"
              stroke="none"
              className="text-3xl font-bold fill-slate-900 dark:fill-slate-100 select-none pointer-events-none"
            >
              {board[node]}
            </text>
          </g>
        ))}
      </svg>
    </GameBoard>
  );
};
