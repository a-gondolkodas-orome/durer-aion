import { range } from 'lodash';
import { POLICE, VERTEX_COUNT, coords, edges, type Board } from './gameplay';
import { GameBoard, type BoardClientProps } from '../../../strategy-game-factory';
import { useTranslation } from '../../../../language';

const COP_COLORS = ['var(--color-blue-800)', 'var(--color-green-600)', 'var(--color-amber-500)'];
const THIEF_COLOR = 'var(--color-red-500)';

type Piece = { color: string; isThief: boolean; isActive: boolean };

const vertexLabel = (v: number) => (v < 5 ? `O${v}` : v < 10 ? `M${v - 5}` : `I${v - 10}`);

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const { phase } = board;

  // Exactly one move is on offer at any moment; it decides both what a click
  // does and which vertices are highlighted.
  const activeMove = () => {
    if (phase === 'placingCops') return moves.placeCop;
    if (phase === 'placingThief') return moves.placeThief;
    return ctx.currentPlayer === POLICE ? moves.moveCop : moves.moveThief;
  };

  const isClickable = (vertex: number) => activeMove().isAllowed(board, vertex);

  const handleClick = (vertex: number) => activeMove()(board, vertex);

  // Collect the pieces standing on each vertex so shared vertices can be shown
  // as a small cluster rather than overlapping discs.
  const piecesByVertex: Piece[][] = range(VERTEX_COUNT).map(() => []);
  board.policemen.forEach((vertex, i) => {
    const isActive = phase === 'chasing' && ctx.currentPlayer === POLICE
      && ctx.isClientMoveAllowed && i === board.copCursor;
    piecesByVertex[vertex].push({ color: COP_COLORS[i], isThief: false, isActive });
  });
  if (board.thief !== null) {
    piecesByVertex[board.thief].push({ color: THIEF_COLOR, isThief: true, isActive: false });
  }

  const clusterOffset = (index: number, count: number) => {
    if (count === 1) return { dx: 0, dy: 0 };
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return { dx: 2.4 * Math.cos(angle), dy: 2.4 * Math.sin(angle) };
  };

  return (
    <GameBoard className="flex flex-col items-center">
      {ctx.phase === 'roleSelection' && (
        <p className="mb-2 text-center font-semibold">
          {t({
            hu: `Ebben a játékban ${board.copCount} rendőr van.`,
            en: `This game has ${board.copCount} policemen.`
          })}
        </p>
      )}
      <svg viewBox="0 0 100 100" className="w-full aspect-square touch-none select-none">
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={coords[a].x} y1={coords[a].y} x2={coords[b].x} y2={coords[b].y}
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth={0.7}
          />
        ))}

        {range(VERTEX_COUNT).map((vertex) => {
          const clickable = isClickable(vertex);
          const { x, y } = coords[vertex];
          const pieces = piecesByVertex[vertex];
          return (
            <g key={vertex}>
              {clickable && (
                <circle cx={x} cy={y} r={4.8} className="fill-yellow-300 dark:fill-yellow-400" opacity={0.45} />
              )}
              <circle
                cx={x} cy={y} r={2.3}
                className="fill-slate-200 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-500"
                strokeWidth={0.4}
              />
              {pieces.map((piece, i) => {
                const { dx, dy } = clusterOffset(i, pieces.length);
                return (
                  <circle
                    key={i}
                    cx={x + dx} cy={y + dy} r={2.9}
                    fill={piece.color}
                    className="stroke-slate-900 dark:stroke-slate-100"
                    strokeWidth={piece.isActive ? 0.9 : 0.5}
                    strokeDasharray={piece.isActive ? '1.2 0.9' : undefined}
                  />
                );
              })}
              {/* transparent hit area on top so clicks land even over pieces */}
              <circle
                cx={x} cy={y} r={5}
                fill="transparent"
                onClick={() => handleClick(vertex)}
                onKeyUp={(event) => { if (event.key === 'Enter') handleClick(vertex); }}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? 'button' : undefined}
                aria-label={clickable ? `${vertexLabel(vertex)}` : undefined}
                className={clickable ? 'cursor-pointer' : ''}
              />
            </g>
          );
        })}
      </svg>
    </GameBoard>
  );
};
