import { range } from "lodash";
import type { Board } from "./policeman-thief-ab";
import { POLICE, THIEF } from "./helpers";
import { GameBoard, type BoardClientProps } from "../../../strategy-game-factory";

const cubeCoords = [
  { cx: "30%", cy: "30%" },
  { cx: "30%", cy: "70%" },
  { cx: "70%", cy: "30%" },
  { cx: "70%", cy: "70%" },
  { cx: "10%", cy: "10%" },
  { cx: "10%", cy: "90%" },
  { cx: "90%", cy: "10%" },
  { cx: "90%", cy: "90%" }
];

export const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  // Exactly one piece is due to move at any moment; the same move then decides
  // both what a click does and which intersections are offered.
  const activeMove = () => {
    if (ctx.currentPlayer === THIEF) return moves.moveThief;
    return board.firstPolicemanMoved ? moves.moveSecondPoliceman : moves.moveFirstPoliceman;
  };

  const handleCircleClick = (vertex: number) => activeMove()(board, vertex);

  const isClickable = (vertex: number) => activeMove().isAllowed(board, vertex);

  const getColor = (vertex: number) => {
    if (isClickable(vertex)) {
      if (ctx.currentPlayer === THIEF) {
        if (board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
        return "var(--color-red-500)";
      }
      if (ctx.currentPlayer === POLICE) {
        if (board.firstPolicemanMoved) {
          if (board.thief === vertex) return "url(#thief-and-second-policeman)";
          if (board.policemen[0] === vertex) return "url(#2policemen)";
          return "var(--color-green-600)";
        }
        if (board.thief === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#2policemen)";
        return "var(--color-blue-800)";
      }
    }
    if (board.thief === vertex && board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
    if (board.thief === vertex && board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
    if (board.thief === vertex) return "var(--color-red-500)";
    if (board.policemen[0] === vertex && board.policemen[1] === vertex) return "url(#2policemen)";
    if (board.policemen[0] === vertex) return "var(--color-blue-800)";
    if (board.policemen[1] === vertex) return "var(--color-green-600)";
    return "white";
  };

  return (
    <GameBoard>
      <svg className="aspect-square stroke-slate-900 dark:stroke-slate-300 stroke-3">
        <pattern id="2policemen" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="var(--color-blue-800)" stroke="var(--color-blue-800)" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "var(--color-green-600)", strokeWidth: "12" }} />
        </pattern>
        <pattern
          id="thief-and-first-policeman"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12"
        >
          <rect x="0" y="0" fill="var(--color-red-500)" stroke="var(--color-red-500)" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "var(--color-blue-800)", strokeWidth: "12" }} />
        </pattern>
        <pattern
          id="thief-and-second-policeman"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12"
        >
          <rect x="0" y="0" fill="var(--color-red-500)" stroke="var(--color-red-500)" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "var(--color-green-600)", strokeWidth: "12" }} />
        </pattern>
        <rect
          x="30%"
          y="30%"
          width="40%"
          height="40%"
          className="fill-transparent"
        />
        <rect
          x="10%"
          y="10%"
          width="80%"
          height="80%"
          className="fill-transparent"
        />

        <line x1="10%" y1="10%" x2="30%" y2="30%" />
        <line x1="90%" y1="90%" x2="70%" y2="70%" />
        <line x1="10%" y1="90%" x2="30%" y2="70%" />
        <line x1="90%" y1="10%" x2="70%" y2="30%" />

        {range(8).map((vertex) => (
          <circle
            key={vertex}
            cx={cubeCoords[vertex].cx}
            cy={cubeCoords[vertex].cy}
            r="4%"
            fill={getColor(vertex)}
            onClick={() => handleCircleClick(vertex)}
            onKeyUp={(event) => {
              if (event.key === 'Enter') handleCircleClick(vertex);
            }}
            tabIndex={isClickable(vertex) ? 0 : undefined}
            role={isClickable(vertex) ? 'button' : undefined}
            aria-label={isClickable(vertex) ? `Vertex ${vertex + 1}` : undefined}
            className={isClickable(vertex) ? 'opacity-50' : ''}
          />
        ))}
      </svg>
    </GameBoard>
  );
};
