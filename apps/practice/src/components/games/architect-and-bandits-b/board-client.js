import React from 'react';
import { useTranslation } from '../../language/translate';

const VERTEX_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Regular decagon: A at top, clockwise. Center (50,50), radius 38.
const VERTEX_COORDS = Array.from({ length: 10 }, (_, i) => {
  const angle = (-90 + i * 36) * (Math.PI / 180);
  return {
    x: 50 + 38 * Math.cos(angle),
    y: 50 + 38 * Math.sin(angle)
  };
});

// Outward offset for labels
const LABEL_COORDS = Array.from({ length: 10 }, (_, i) => {
  const angle = (-90 + i * 36) * (Math.PI / 180);
  return {
    x: 50 + 47 * Math.cos(angle),
    y: 50 + 47 * Math.sin(angle)
  };
});

export const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();
  const gameStarted = ctx.isHumanVsHumanGame || ctx.chosenRoleIndex !== null;

  const isAdjacentToArchitect = (v) =>
    (v - board.architectPosition + 10) % 10 === 1 ||
    (board.architectPosition - v + 10) % 10 === 1;

  const isClickable = (v) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (ctx.currentPlayer === 0) {
      return board.kmUsedToday < 50 && isAdjacentToArchitect(v);
    }
    return board.towers[v];
  };

  const handleVertexClick = (v) => {
    if (!isClickable(v)) return;
    if (ctx.currentPlayer === 0) {
      moves.moveArchitect(board, v);
    } else {
      moves.destroyTower(board, v);
    }
  };

  const canEndDay = ctx.isClientMoveAllowed && ctx.currentPlayer === 0;

  return (
    <section className="p-2 shrink-0 grow basis-2/3 flex flex-col items-center">
      <svg
        viewBox="0 -3 100 110"
        className="aspect-square w-full max-h-96"
      >
        {/* Decagon edges */}
        {Array.from({ length: 10 }, (_, i) => {
          const from = VERTEX_COORDS[i];
          const to = VERTEX_COORDS[(i + 1) % 10];
          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke="#888" strokeWidth="0.6"
            />
          );
        })}

        {/* Vertices */}
        {Array.from({ length: 10 }, (_, i) => {
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
              style={{ cursor: clickable ? 'pointer' : 'default' }}
              role={clickable ? 'button' : undefined}
              aria-label={clickable ? VERTEX_LABELS[i] : undefined}
            >
              <rect
                x={x - 4.5} y={y - 4.5} width={9} height={9}
                fill={hasTower ? '#c2b280' : '#f3f4f6'}
                stroke={hasTower ? '#374151' : '#6b7280'}
                strokeWidth={hasTower ? 1.2 : 0.5}
              />

              {isArchitect && (
                <text
                  x={x} y={y + 2.2}
                  textAnchor="middle"
                  fontSize="5.5"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  🧍
                </text>
              )}

              <text
                x={label.x} y={label.y + 1.2}
                textAnchor="middle"
                fontSize="4"
                fontWeight="bold"
                fill="#111"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {VERTEX_LABELS[i]}
              </text>
            </g>
          );
        })}

        {ctx.phase === 'play' &&
          <text x="50" y="104" textAnchor="middle" fontSize="3.5" fill="#374151">
            {ctx.currentPlayer === 0
              ? t({
                hu: `${board.day}. nap · ${board.kmUsedToday}/50 km`,
                en: `Day ${board.day} · ${board.kmUsedToday}/50 km`
              })
              : t({ hu: `${board.day}. éjszaka`, en: `Night ${board.day}` })}
          </text>
        }
      </svg>

      {canEndDay && (
        <button
          onClick={() => moves.endDay(board)}
          className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium"
        >
          {t({ hu: 'Befejezem a napot', en: 'End Day' })}
        </button>
      )}
    </section>
  );
};
