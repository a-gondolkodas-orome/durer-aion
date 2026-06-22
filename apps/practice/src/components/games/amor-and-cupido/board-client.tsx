import { GameBoard, type BoardClientProps } from '../../game-factory';
import { type Board, EDGES, findWinningTriangle } from './helpers';

// Hexagon coordinates (viewBox 0 0 100 100), first vertex at the top.
const VERTEX_COORDS = Array.from({ length: 6 }, (_, i) => {
  const angle = (-90 + i * 360 / 6) * Math.PI / 180;
  return { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
});

const ownerStroke = (owner: number | null): string => {
  if (owner === 0) return 'stroke-rose-500';
  if (owner === 1) return 'stroke-sky-500';
  return 'stroke-stone-300 dark:stroke-stone-600';
};

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const isMoveAllowed = (edge: number) =>
    ctx.isClientMoveAllowed && board[edge] === null;

  const clickEdge = (edge: number) => {
    if (!isMoveAllowed(edge)) return;
    moves.claimEdge(board, edge);
  };

  const winningEdges =
    ctx.winnerIndex !== null ? findWinningTriangle(board, ctx.winnerIndex) : null;

  const hoverStroke = ctx.currentPlayer === 0 ? 'hover:stroke-rose-500/50' : 'hover:stroke-sky-500/50';

  return (
    <GameBoard>
      <svg viewBox="0 0 100 100" className="aspect-square w-full max-w-md mx-auto">
        {EDGES.map(([a, b], edge) => {
          const from = VERTEX_COORDS[a];
          const to = VERTEX_COORDS[b];
          const owner = board[edge];
          const isWinning = winningEdges?.includes(edge);
          return (
            <g key={edge}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className={ownerStroke(owner)}
                strokeWidth={owner === null ? 0.8 : isWinning ? 3.2 : 2.4}
                strokeLinecap="round"
              />
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className={`stroke-transparent ${
                  isMoveAllowed(edge) ? `cursor-pointer ${hoverStroke}` : ''
                }`}
                strokeWidth={4}
                strokeLinecap="round"
                onClick={() => clickEdge(edge)}
                onKeyUp={event => { if (event.key === 'Enter') clickEdge(edge); }}
                tabIndex={isMoveAllowed(edge) ? 0 : undefined}
                role={isMoveAllowed(edge) ? 'button' : undefined}
                aria-label={
                  isMoveAllowed(edge) ? `Pair person ${a + 1} with person ${b + 1}` : undefined
                }
              />
            </g>
          );
        })}
        {VERTEX_COORDS.map(({ x, y }, person) => (
          <g key={person} className="pointer-events-none">
            <circle
              cx={x} cy={y} r={6}
              className="fill-surface-elevated stroke-stone-700 dark:stroke-stone-200"
              strokeWidth={1}
            />
            <text
              x={x} y={y}
              textAnchor="middle" dominantBaseline="central"
              className="fill-stone-800 dark:fill-stone-100 select-none"
              fontSize={5}
            >
              {person + 1}
            </text>
          </g>
        ))}
      </svg>
    </GameBoard>
  );
};
