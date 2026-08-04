import { range } from "lodash";
import { GameBoard, type BoardClientProps } from "../../strategy-game-factory";
import { type Board, hubs, others } from "./gameplay";

// Drawing of the graph (K4 minus the C-D edge) as a rhomboid: the two hub fields
// sit at left and right (joined by the horizontal diagonal, and each joined to
// both degree-2 fields), the two degree-2 fields at top and bottom. The wider
// horizontal diagonal keeps it a rhomboid rather than a square. The four sides
// are the A-C, A-D, B-C, B-D lines; the missing C-D edge is the undrawn vertical
// diagonal, matching the competition figure.
const coords: Record<number, { cx: string; cy: string }> = {
  0: { cx: "14%", cy: "50%" }, // A (hub, left)
  1: { cx: "86%", cy: "50%" }, // B (hub, right)
  2: { cx: "50%", cy: "25%" }, // C (top)
  3: { cx: "50%", cy: "75%" }  // D (bottom)
};

const edges = [
  ...hubs.flatMap((h) => others.map((o) => [h, o] as const)),
  [hubs[0], hubs[1]] as const
];

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

        {range(4).map((node) => (
          <g
            key={node}
            onClick={() => moves.placeCoin(board, node)}
            onKeyUp={(event) => {
              if (event.key === "Enter") moves.placeCoin(board, node);
            }}
            tabIndex={isClickable(node) ? 0 : undefined}
            role={isClickable(node) ? "button" : undefined}
            aria-label={isClickable(node) ? `Field ${node + 1}, ${board[node]} coins` : undefined}
            className={isClickable(node) ? "cursor-pointer" : ""}
          >
            <circle
              cx={coords[node].cx}
              cy={coords[node].cy}
              r="11%"
              className={
                isClickable(node)
                  ? "fill-slate-50 dark:fill-slate-500 hocus:fill-blue-200 dark:hocus:fill-blue-600"
                  : "fill-slate-300 dark:fill-slate-800"
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
