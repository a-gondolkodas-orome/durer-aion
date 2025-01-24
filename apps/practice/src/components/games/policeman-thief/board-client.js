import React, { Fragment } from "react";
import { range } from "lodash";
import { neighbours } from "./helpers";

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

export const BoardClient = ({ board, ctx, moves }) => {
  const handleCircleClick = (vertex) => {
    if (!isClickable(vertex)) return;
    if (ctx.chosenRoleIndex === 1) {
      moves.moveThief(board, vertex);
      return;
    }
    if (board.firstPolicemanMoved) {
      moves.moveSecondPoliceman(board, vertex);
      return;
    }
    moves.moveFirstPoliceman(board, vertex);
  };

  const isClickable = (vertex) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (ctx.chosenRoleIndex === 1) {
      return neighbours[board.thief].includes(vertex);
    }
    if (board.firstPolicemanMoved) {
      return neighbours[board.policemen[1]].includes(vertex)
    }
    return neighbours[board.policemen[0]].includes(vertex)
  }

  const getColor = (vertex) => {
    if (isClickable(vertex)) {
      if (ctx.chosenRoleIndex === 1) {
        if (board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
        return "red";
      }
      if (ctx.chosenRoleIndex === 0) {
        if (board.firstPolicemanMoved) {
          if (board.thief === vertex) return "url(#thief-and-second-policeman)";
          if (board.policemen[0] === vertex) return "url(#2policemen)";
          return "forestgreen";
        }
        if (board.thief === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#2policemen)";
        return "navy";
      }
    }
    if (board.thief === vertex && board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
    if (board.thief === vertex && board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
    if (board.thief === vertex) return "red";
    if (board.policemen[0] === vertex && board.policemen[1] === vertex) return "url(#2policemen)";
    if (board.policemen[0] === vertex) return "navy";
    if (board.policemen[1] === vertex) return "forestgreen";
    return "white";
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg className="aspect-square stroke-black stroke-[3]">
        <pattern id="2policemen" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="navy" stroke="navy" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "forestgreen", strokeWidth: "12" }} />
        </pattern>
        <pattern id="thief-and-first-policeman" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="red" stroke="red" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "navy", strokeWidth: "12" }} />
        </pattern>
        <pattern id="thief-and-second-policeman" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="red" stroke="red" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "forestgreen", strokeWidth: "12" }} />
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
          <Fragment key={vertex}>
            <circle
              cx={cubeCoords[vertex].cx}
              cy={cubeCoords[vertex].cy}
              r="4%"
              fill={getColor(vertex)}
              onClick={() => handleCircleClick(vertex)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') handleCircleClick(vertex);
              }}
              tabIndex={isClickable(vertex) ? 0 : 'none'}
              className={isClickable(vertex) ? 'opacity-50' : ''}
            />
          </Fragment>
        ))}
      </svg>
    </section>
  );
};
