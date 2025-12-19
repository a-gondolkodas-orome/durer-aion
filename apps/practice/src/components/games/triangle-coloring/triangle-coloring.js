import React from 'react';
import { strategyGameFactory, dummyEvents } from '../strategy-game';
import { range, cloneDeep, sample, shuffle } from 'lodash';
import { gameList } from '../gameList';

const FORBIDDEN = 2;
// triangles
//          0
//       1  2  3
//    4  5  6  7  8
// 9 10 11 12 13 14 15

// vertices
//       0
//      1 2
//    3  4  5
//   6  7  8  9
// 10 11 12 13 14

// x, y, z: 3 "axis" showing parallel lines to triangle sides
const vertices = [
  { id: 0, x: 0, y: 4, z: 4, cx: "50", cy: "12.5" },
  { id: 1, x: 1, y: 3, z: 4, cx: "41.625", cy: "27.5" },
  { id: 2, x: 1, y: 4, z: 3, cx: "58.375", cy: "27.5" },
  { id: 3, x: 2, y: 2, z: 4, cx: "33.25", cy: "42.5" },
  { id: 4, x: 2, y: 3, z: 3, cx: "50", cy: "42.5" },
  { id: 5, x: 2, y: 4, z: 2, cx: "66.75", cy: "42.5" },
  { id: 6, x: 3, y: 1, z: 4, cx: "25", cy: "57.5" },
  { id: 7, x: 3, y: 2, z: 3, cx: "41.625", cy: "57.5" },
  { id: 8, x: 3, y: 3, z: 2, cx: "58.375", cy: "57.5" },
  { id: 9, x: 3, y: 4, z: 1, cx: "75", cy: "57.5" },
  { id: 10, x: 4, y: 0, z: 4, cx: "16.5", cy: "73" },
  { id: 11, x: 4, y: 1, z: 3, cx: "33.25", cy: "73" },
  { id: 12, x: 4, y: 2, z: 2, cx: "50", cy: "73" },
  { id: 13, x: 4, y: 3, z: 1, cx: "66.75", cy: "73" },
  { id: 14, x: 4, y: 4, z: 0, cx: "83.5", cy: "73" }
];

const triangles = [
  { id: 0, v: [0, 1, 2], neighbors: [2] },
  { id: 1, v: [1, 3, 4], neighbors: [2, 5] },
  { id: 2, v: [1, 2, 4], neighbors: [0, 1, 3] },
  { id: 3, v: [2, 4, 5], neighbors: [2, 7] },
  { id: 4, v: [3, 6, 7], neighbors: [5, 10] },
  { id: 5, v: [3, 4, 7], neighbors: [1, 4, 6] },
  { id: 6, v: [4, 7, 8], neighbors: [5, 7, 12] },
  { id: 7, v: [4, 5, 8], neighbors: [3, 6, 8] },
  { id: 8, v: [5, 8, 9], neighbors: [7, 14] },
  { id: 9, v: [6, 10, 11], neighbors: [10] },
  { id: 10, v: [6, 7, 11], neighbors: [4, 9, 11] },
  { id: 11, v: [7, 11, 12], neighbors: [10, 12] },
  { id: 12, v: [7, 8, 12], neighbors: [6, 11, 13] },
  { id: 13, v: [8, 12, 13], neighbors: [12, 14] },
  { id: 14, v: [8, 9, 13], neighbors: [8, 13, 15] },
  { id: 15, v: [9, 13, 14], neighbors: [14] }
];

const BoardClient = ({ board, ctx, moves }) => {
  const getTrianglePoints = i => {
    const v = triangles[i].v;
    const [v0, v1, v2] = [vertices[v[0]], vertices[v[1]], vertices[v[2]]];
    return `${v0.cx},${v0.cy} ${v1.cx},${v1.cy} ${v2.cx},${v2.cy}`
  }

  const colorTriangle = i => {
    if (!ctx.shouldRoleSelectorMoveNext) return;
    if (board[i] !== null) return;
    moves.colorTriangle(board, i);
  }

  const isForbidden = i => board[i] === FORBIDDEN;

  const getColor = i => {
    if (board[i] === 'colored') return 'fill-blue-600';
    if (isForbidden(i)) return 'fill-slate-400';
    return 'fill-transparent';
  };

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg className="aspect-square" viewBox="0 0 100 100">
        {range(16).map(i => (
          <polygon
            key={i}
            points={getTrianglePoints(i)}
            className={`
              ${getColor(i)} ${isForbidden(i) ? 'cursor-not-allowed' : ''}
            `}
            stroke="black" strokeWidth="0.5"
            onClick={() => colorTriangle(i)}
            onKeyUp={(event) => {
              if (event.key === 'Enter') colorTriangle(i);
            }}
            tabIndex={ctx.shouldRoleSelectorMoveNext ? 0 : 'none'}
          ></polygon>
        ))}
      </svg>
    </section>
  );
};

const moves = {
  colorTriangle: (board, { events }, id) => {
    const nextBoard = cloneDeep(board);
    nextBoard[id] = 'colored';
    triangles[id].neighbors.forEach(n => {
      nextBoard[n] = FORBIDDEN;
    });
    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const getAllowedMoves = board => range(16).filter(i => board[i] === null);

const aiBotStrategy = ({ board, moves }) => {
  const optimalMove = getOptimalAiMove(board);
  moves.colorTriangle(board, optimalMove);
};

const getOptimalAiMove = board => {
  const allowedMoves = getAllowedMoves(board);
  const optimalPlace = shuffle(allowedMoves).find(i => {
    const { nextBoard } = moves.colorTriangle(board, { events: dummyEvents }, i);
    return isWinningState(nextBoard, false);
  });

  if (optimalPlace !== undefined) {
    return optimalPlace;
  }
  return sample(allowedMoves);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIPlayer) => {
  const allowedPlacesForOther = getAllowedMoves(board);
  if (allowedPlacesForOther.length === 0) {
    return true;
  }

  const optimalPlaceForOther = allowedPlacesForOther.find(i => {
    const { nextBoard } = moves.colorTriangle(board, { events: dummyEvents }, i);
    return isWinningState(nextBoard, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

const rule = <>
  Két játékos felváltva satíroz be az ábrán egy-egy kis háromszöget.
Nem szabad olyan háromszöget satírozni, amivel oldalszomszédos
már be van satírozva. Az veszít, aki nem tud satírozni.
</>;

export const TriangleColoring = strategyGameFactory({
  rule,
  metadata: gameList.TriangleColoring,
  BoardClient,
  getPlayerStepDescription: () => 'Kattints egy kis háromszögre.',
  generateStartBoard: () => Array(16).fill(null),
  aiBotStrategy,
  moves
});
