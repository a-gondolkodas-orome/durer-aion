import { useEffect, useState } from 'react';
import { useTranslation } from '../../../language';
import { GameBoard, type BoardClientProps } from '../../strategy-game-factory';
import { BOARD_OUTLINE, EDGES, TRIANGLES, type Edge } from './geometry';
import { type Board } from './gameplay';

// Two very different interactions share one board: on the line player's turn the
// edges are clickable, on the circle player's turn the triangles are. Only the
// active layer receives pointer/keyboard events, so a click near an edge never
// gets swallowed by a triangle (or vice versa).
// Shaded (and hover-previewed) edges are drawn slightly shorter than the
// lattice edge, so their round caps leave the lattice nodes visible.
const EDGE_INSET = 0.1;
const insetEdge = (edge: Edge) => ({
  x1: edge.x1 + (edge.x2 - edge.x1) * EDGE_INSET,
  y1: edge.y1 + (edge.y2 - edge.y1) * EDGE_INSET,
  x2: edge.x2 - (edge.x2 - edge.x1) * EDGE_INSET,
  y2: edge.y2 - (edge.y2 - edge.y1) * EDGE_INSET
});

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const { t } = useTranslation();
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  useEffect(() => {
    setHoveredEdge(null);
  }, [ctx.moveCount]);

  const triangleClickable = (t: number) => moves.placeCircle.isAllowed(board, t);

  const triangleClass = (t: number) => {
    if (board.circles[t]) return 'fill-slate-900/5 dark:fill-white/5';
    if (triangleClickable(t)) {
      return 'fill-transparent hocus:fill-blue-100 dark:hocus:fill-blue-900/50 cursor-pointer outline-none';
    }
    return 'fill-transparent';
  };

  const hovered = hoveredEdge !== null && !board.edges[hoveredEdge]
    ? insetEdge(EDGES[hoveredEdge])
    : null;

  return (
    <GameBoard>
      <svg className="aspect-square w-full" viewBox="0 0 100 100">
        {/* Triangles: fills + circle-player clicks */}
        <g>
          {TRIANGLES.map(tri => (
            <polygon
              key={`tri-${tri.id}`}
              points={tri.points}
              className={triangleClass(tri.id)}
              onClick={() => moves.placeCircle(board, tri.id)}
              onKeyUp={event => { if (event.key === 'Enter') moves.placeCircle(board, tri.id); }}
              tabIndex={triangleClickable(tri.id) ? 0 : undefined}
              role={triangleClickable(tri.id) ? 'button' : undefined}
              aria-label={triangleClickable(tri.id)
                ? t({ hu: `${tri.id + 1}. háromszög — tegyél bele kört`, en: `Triangle ${tri.id + 1} — drop a circle` })
                : undefined}
            />
          ))}
        </g>

        {/* Circles already placed */}
        <g className="pointer-events-none">
          {TRIANGLES.filter(tri => board.circles[tri.id]).map(tri => (
            <circle
              key={`circle-${tri.id}`}
              cx={tri.cx}
              cy={tri.cy}
              r={2.4}
              className="fill-none stroke-blue-700 dark:stroke-blue-400"
              strokeWidth="0.9"
            />
          ))}
        </g>

        {/* Thin grid lines for free edges */}
        <g className="pointer-events-none">
          {EDGES.filter(edge => !board.edges[edge.id]).map(edge => (
            <line
              key={`edge-${edge.id}`}
              x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
              className="stroke-slate-300 dark:stroke-slate-600"
              strokeWidth="0.4"
            />
          ))}
        </g>

        {/* Board outline */}
        <polygon
          points={BOARD_OUTLINE}
          className="fill-none stroke-slate-500 dark:stroke-slate-400 pointer-events-none"
          strokeWidth="0.5"
        />

        {/* Shaded edges last, so they cover the grid lines and the outline.
            The inset keeps their round caps clear of the board corners, so
            boundary shades can run at full width without clipping. */}
        <g className="pointer-events-none">
          {hovered && (
            <line
              x1={hovered.x1} y1={hovered.y1}
              x2={hovered.x2} y2={hovered.y2}
              strokeLinecap="round"
              className="stroke-red-300 dark:stroke-red-700"
              strokeWidth="1.2"
            />
          )}
          {EDGES.filter(edge => board.edges[edge.id]).map(edge => {
            const seg = insetEdge(edge);
            return (
              <line
                key={`shaded-${edge.id}`}
                x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                strokeLinecap="round"
                className="stroke-red-500"
                strokeWidth="1.2"
              />
            );
          })}
        </g>

        {/* Invisible wide hit targets for edges — only on the line player's turn,
            where the move's own validator is what makes the list non-empty. */}
        <g>
          {EDGES.filter(edge => moves.shadeEdge.isAllowed(board, edge.id)).map(edge => (
            <line
              key={`hit-${edge.id}`}
              x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
              stroke="transparent"
              strokeWidth="4"
              strokeLinecap="round"
              className="cursor-pointer outline-none"
              onClick={() => moves.shadeEdge(board, edge.id)}
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              onFocus={() => setHoveredEdge(edge.id)}
              onBlur={() => setHoveredEdge(null)}
              onKeyUp={event => { if (event.key === 'Enter') moves.shadeEdge(board, edge.id); }}
              tabIndex={0}
              role="button"
              aria-label={t({ hu: `${edge.id + 1}. él — satírozd be`, en: `Edge ${edge.id + 1} — shade it` })}
            />
          ))}
        </g>
      </svg>
    </GameBoard>
  );
};
