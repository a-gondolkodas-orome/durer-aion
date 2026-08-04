import { range } from "lodash";
import { GameBoard, type BoardClientProps } from "../../strategy-game-factory";
import { type Board, FIELD_COUNT, OPPOSITE_PAIRS } from "./gameplay";

type TurnState = { first: number } | null

// Six fields evenly spaced on a circle, index 0 at the top going clockwise.
const coords: { cx: number; cy: number }[] = range(FIELD_COUNT).map((i) => {
  const angle = (-90 + i * 60) * (Math.PI / 180);
  return {
    cx: 50 + 36 * Math.cos(angle),
    cy: 50 + 36 * Math.sin(angle)
  };
});

export const BoardClient = ({ board, ctx, setTurnState, moves }: BoardClientProps<Board>) => {
  const turnState = ctx.turnState as TurnState;
  const first = turnState?.first ?? null;

  const isClickable = (node: number) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (first === null) return board[node] > 0;
    // A field is selected: allow clicking it again to deselect, or any field
    // that would complete a legal move.
    return node === first || moves.removeFromTwo.isAllowed(board, [first, node]);
  };

  const handleClick = (node: number) => {
    if (!isClickable(node)) return;
    if (first === null) {
      setTurnState({ first: node });
    } else if (node === first) {
      setTurnState(null);
    } else {
      moves.removeFromTwo(board, [first, node]);
      setTurnState(null);
    }
  };

  const nodeFill = (node: number) => {
    if (node === first) return "fill-blue-500";
    if (isClickable(node)) {
      return "fill-slate-50 dark:fill-slate-600 hocus:fill-blue-200 dark:hocus:fill-blue-500";
    }

    return "fill-slate-200 dark:fill-slate-800";
  };

  return (
    <GameBoard>
      <svg className="aspect-square max-w-md w-full">
        {/* the circle the fields sit on */}
        <circle
          cx="50%" cy="50%" r="36%"
          className="fill-none stroke-slate-300 dark:stroke-slate-600"
          strokeWidth="1.5"
        />

        {/* the three opposite (forbidden) pairs, drawn as faint dashed diameters */}
        {OPPOSITE_PAIRS.map(([a, b]) => (
          <line
            key={`opp-${a}-${b}`}
            x1={`${coords[a].cx}%`} y1={`${coords[a].cy}%`}
            x2={`${coords[b].cx}%`} y2={`${coords[b].cy}%`}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        ))}

        {range(FIELD_COUNT).map((node) => {
          const clickable = isClickable(node);
          return (
            <g
              key={node}
              onClick={() => handleClick(node)}
              onKeyUp={(event) => { if (event.key === "Enter") handleClick(node); }}
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? "button" : undefined}
              aria-label={clickable ? `Field ${node + 1}, ${board[node]} discs` : undefined}
              className={clickable ? "cursor-pointer" : ""}
            >
              <circle
                cx={`${coords[node].cx}%`} cy={`${coords[node].cy}%`} r="11%"
                strokeWidth="2"
                className={`
                  ${nodeFill(node)}
                  ${node === first ? "stroke-blue-700" : "stroke-slate-400 dark:stroke-slate-500"}
                `}
              />
              <text
                x={`${coords[node].cx}%`} y={`${coords[node].cy}%`}
                textAnchor="middle" dominantBaseline="central" stroke="none"
                className={`
                  text-3xl font-bold select-none pointer-events-none
                  ${node === first ? "fill-white" : "fill-slate-900 dark:fill-slate-100"}
                `}
              >
                {board[node]}
              </text>
            </g>
          );
        })}
      </svg>
    </GameBoard>
  );
};
