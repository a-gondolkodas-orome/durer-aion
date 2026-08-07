import { useTranslation } from '../../../language';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { type Board, ARCHITECT } from './gameplay';

const VERTEX_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// A at the top, clockwise, on a circle of radius `radius` about (50, 50).
const ringCoords = (vertexCount: number, radius: number) =>
  Array.from({ length: vertexCount }, (_, i) => {
    const angle = (-90 + i * (360 / vertexCount)) * (Math.PI / 180);
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };
  });

// The wall's shape follows from how many towers it has, which the board
// carries; the day's walking allowance does not, so it comes in here.
export const makeBoardClient = (kmPerDay: number) =>
  ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const vertexCount = board.towers.length;
  const VERTEX_COORDS = ringCoords(vertexCount, 38);
  const LABEL_COORDS = ringCoords(vertexCount, 47);
  const { t } = useTranslation();
  // Hide towers during role selection (before the game actually begins)
  const gameStarted = ctx.isHumanVsHumanGame || ctx.chosenRoleIndex !== null;

  const isClickable = (v: number) => (ctx.currentPlayer === ARCHITECT
    ? moves.moveArchitect.isAllowed(board, v)
    : moves.destroyTower.isAllowed(board, v));

  const handleVertexClick = (v: number) => {
    if (ctx.currentPlayer === ARCHITECT) {
      moves.moveArchitect(board, v);
    } else {
      moves.destroyTower(board, v);
    }
  };

  const canEndDay = moves.endDay.isAllowed(board);

  return (
    <GameBoard className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 100"
        className="aspect-square w-full max-h-96"
      >
        {/* Wall edges */}
        {Array.from({ length: vertexCount }, (_, i) => {
          const from = VERTEX_COORDS[i];
          const to = VERTEX_COORDS[(i + 1) % vertexCount];
          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              className="stroke-stone-700 dark:stroke-stone-200"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Vertices */}
        {Array.from({ length: vertexCount }, (_, i) => {
          const { x, y } = VERTEX_COORDS[i];
          const label = LABEL_COORDS[i];
          const hasTower = gameStarted && board.towers[i];
          const isArchitect = board.architectPosition === i;
          const clickable = isClickable(i);

          return (
            <g
              key={i}
              onClick={() => handleVertexClick(i)}
              onKeyUp={(e) => { if (e.key === 'Enter') handleVertexClick(i); }}
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? 'button' : undefined}
              aria-label={clickable ? VERTEX_LABELS[i] : undefined}
            >
              {/* Vertex base square — + thick border when tower present */}
              <rect
                x={x - 4.5} y={y - 4.5} width={9} height={9}
                strokeWidth={hasTower ? 1.2 : 0.4}
                className={hasTower
                  ? 'fill-stone-400 dark:fill-stone-300 stroke-stone-600 dark:stroke-stone-700'
                  : 'fill-slate-100 dark:fill-slate-800 stroke-stone-200 dark:stroke-stone-700'
                }
              />

              {/* Architect marker: person emoji */}
              {isArchitect && (
                <text
                  x={x} y={y + 2.2}
                  textAnchor="middle"
                  fontSize="5.5"
                  className="select-none pointer-events-none"
                >
                  🧍
                </text>
              )}

              {/* Vertex label */}
              <text
                x={label.x} y={label.y + 1.2}
                textAnchor="middle"
                fontSize="4"
                fontWeight="bold"
                fill="currentColor"
                className="select-none pointer-events-none"
              >
                {VERTEX_LABELS[i]}
              </text>
            </g>
          );
        })}

      </svg>

      {ctx.phase === 'play' && (
        <p>
          {ctx.currentPlayer === ARCHITECT
            ? t({
              hu: `${board.day}. nap · ${board.kmUsedToday}/${kmPerDay} km`,
              en: `Day ${board.day} · ${board.kmUsedToday}/${kmPerDay} km`
            })
            : t({ hu: `${board.day}. éjszaka`, en: `Night ${board.day}` })
          }
        </p>
      )}

      {/* End Day button */}
      {canEndDay && (
        <button
          onClick={() => moves.endDay(board)}
          className="primary-button w-auto mt-1"
        >
          {t({ hu: 'Befejezem a napot', en: 'End Day' })}
        </button>
      )}
    </GameBoard>
  );
  };
