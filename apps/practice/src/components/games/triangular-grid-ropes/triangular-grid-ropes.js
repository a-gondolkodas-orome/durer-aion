import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { every, range, last, uniqWith, isEqual, sample } from 'lodash';

//    0
//   1 2
//  3 4 5
// 6 7 8 9

// x, y, z: 3 "axis" showing parallel lines to triangle sides
const vertices = [
  { id: 0, x: 0, y: 3, z: 3, cx: "50%", cy: "12.5%" },
  { id: 1, x: 1, y: 2, z: 3, cx: "41.625%", cy: "27.5%" },
  { id: 2, x: 1, y: 3, z: 2, cx: "58.375%", cy: "27.5%" },
  { id: 3, x: 2, y: 1, z: 3, cx: "33.25%", cy: "42.5%" },
  { id: 4, x: 2, y: 2, z: 2, cx: "50%", cy: "42.5%" },
  { id: 5, x: 2, y: 3, z: 1, cx: "66.75%", cy: "42.5%" },
  { id: 6, x: 3, y: 0, z: 3, cx: "25%", cy: "57.5%" },
  { id: 7, x: 3, y: 1, z: 2, cx: "41.625%", cy: "57.5%" },
  { id: 8, x: 3, y: 2, z: 1, cx: "58.375%", cy: "57.5%" },
  { id: 9, x: 3, y: 3, z: 0, cx: "75%", cy: "57.5%" }
];

const mirrorNodes = {
  'x': [0, 2, 1, 5, 4, 3, 9, 8, 7, 6],
  'y': [9, 8, 5, 7, 4, 2, 6, 3, 1, 0],
  'z': [6, 3, 7, 1, 4, 8, 0, 2, 5, 9]
};

const superSets = {
  '0-1': [[0, 3], [0, 6]],
  '0-3': [[0, 6]],
  '1-3': [[0, 3], [1, 6], [0, 6]],
  '1-6': [[0, 6]],
  '3-6': [[1, 6], [0, 6]],
  '0-2': [[0, 5], [0, 9]],
  '0-5': [[0, 9]],
  '2-5': [[0, 5], [2, 9], [0, 9]],
  '2-9': [[0, 9]],
  '5-9': [[2, 9], [0, 9]],
  '6-7': [[6, 8], [6, 9]],
  '6-8': [[6, 9]],
  '7-8': [[7, 9], [6, 8], [6, 9]],
  '7-9': [[6, 9]],
  '8-9': [[7, 9], [6, 9]],
  '3-4': [[3, 5]],
  '4-5': [[3, 5]],
  '1-4': [[1, 8]],
  '4-8': [[1, 8]],
  '2-4': [[2, 7]],
  '4-7': [[2, 7]]
};

const edgeDirection = (nodeA, nodeB) => {
  const vertexA = vertices[nodeA];
  const vertexB = vertices[nodeB];
  if (vertexA.x === vertexB.x) return 'x';
  if (vertexA.y === vertexB.y) return 'y';
  if (vertexA.z === vertexB.z) return 'z';
  return null;
};

const isParallel = (nodeA, nodeB) => {
  return edgeDirection(nodeA, nodeB) !== null;
};

const isPartOfExistingRope = (board, { from, to }) => {
  return board.some(e => {
    const middlePoints = getMiddlePoints(e);
    const edgePoints = [...middlePoints, e.from, e.to];
    return edgePoints.includes(from) && edgePoints.includes(to);
  });
};

const getMiddlePoints = ({ from, to }) => {
  const dir = edgeDirection(from, to);
  if (dir === null) return [];
  return range(10).filter(id => {
    return vertices[from][dir] === vertices[id][dir] && (
      (from > id && id > to) ||
      (from < id && id < to)
    );
  });
};

const getNodesWithRope = board => {
  return range(10).filter(id => {
    return board.some(e => {
      const isEndpoint = e.from === id || e.to === id;
      const isMiddlePoint = getMiddlePoints(e).includes(id);
      return isEndpoint || isMiddlePoint;
    });
  });
};

const isAllowed = (board, { from, to }) => {
  if (!isParallel(from, to)) return false;
  if (isPartOfExistingRope(board, { from, to })) return false;
  const middlePoints = getMiddlePoints({ from, to });
  const nodesWithRope = getNodesWithRope(board);
  return every(middlePoints, p => !nodesWithRope.includes(p));
};

const getAllowedMoves = board => {
  const moves = [];
  range(10).map(from => {
    range(10).map(to => {
      if (isAllowed(board, { from, to }) && from !== to) {
        moves.push(getAllowedSuperset(board, { from, to }));
      }
    });
  });
  return uniqWith(moves, isEqual);
};

const isGameEnd = board => {
  const allowedMoves = getAllowedMoves(board);
  return allowedMoves.length === 0;
};

const getAllowedSuperset = (board, { from, to }) => {
  if (from === null || to === null || from === to) return null;
  if (!isAllowed(board, { from, to })) return { from, to };
  const edgeSupsersets = superSets[`${from}-${to}`] || superSets[`${to}-${from}`] || [];
  const allowedSupersets = edgeSupsersets.filter(e => isAllowed(board, { from: e[0], to: e[1] }));
  if (allowedSupersets.length > 0) {
    const e = last(allowedSupersets);
    return { from: e[0], to: e[1] };
  }
  return { from, to };
};

const GameBoard = ({ board, ctx }) => {
  const [firstNode, setFirstNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const connectNode = node => {
    if (!ctx.shouldPlayerMoveNext) return;
    if (firstNode === null) {
      setFirstNode(node);
    } else if (node === firstNode) {
      setFirstNode(null);
    } else {
      if (!isAllowed(board, { from: firstNode, to: node })) return;
      const newBoard = [...board];
      newBoard.push(getAllowedSuperset(board, { from: firstNode, to: node }));
      ctx.endPlayerTurn({ newBoard, isGameEnd: isGameEnd(newBoard), winnerIndex: null });
      setFirstNode(null);
    }
  };

  const isCandidateAllowed = (
    firstNode !== null && hoveredNode !== null &&
    isAllowed(board, { from: firstNode, to: hoveredNode })
  );

  const candidateEdge = getAllowedSuperset(board, { from: firstNode, to: hoveredNode });
  const candidateFromV = candidateEdge ? vertices[candidateEdge.from] : null;
  const candidateToV = candidateEdge ? vertices[candidateEdge.to] : null;

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
  <svg className="aspect-square">

    {/* edges */}
    {board.map(({ from, to }, idx) => (
      <line
        key={`${from}-${to}`}
        x1={vertices[from].cx} y1={vertices[from].cy}
        x2={vertices[to].cx} y2={vertices[to].cy}
        stroke={idx % 2 === ctx.playerIndex ? 'blue' : 'green'}
        strokeWidth="4"
      />
    ))}

    {/* candidate next edge */}
    {firstNode !== null && hoveredNode !== null && firstNode !== hoveredNode && (
      <line
      x1={candidateFromV.cx} y1={candidateFromV.cy}
      x2={candidateToV.cx} y2={candidateToV.cy}
      stroke={isCandidateAllowed ? 'blue' : 'red'}
      strokeWidth="2" strokeDasharray="4"
      />
    )}

    {/* grid nodes */}
    {vertices.map(vertex => (
      <circle
        key={vertex.id}
        cx={vertex.cx} cy={vertex.cy} r="2%" fill="black"
        className={`
          ${vertex.id === firstNode ? 'fill-blue-500' : ''}
          ${firstNode !== null && vertex.id === hoveredNode && firstNode !== hoveredNode && !isCandidateAllowed ? 'fill-red-400 cursor-not-allowed' : ''}
        `}
        onClick={() => connectNode(vertex.id)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') connectNode(vertex.id);
        }}
        tabIndex={ctx.shouldPlayerMoveNext ? 0 : 'none'}
        onFocus={() => setHoveredNode(vertex.id)}
        onBlur={() => setHoveredNode(null)}
        onMouseOver={() => setHoveredNode(vertex.id)}
        onMouseOut={() => setHoveredNode(null)}
      />
    ))}
  </svg>
  </section>
  );
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const newBoard = [...board];
  const allowedMoves = getAllowedMoves(board);
  if (playerIndex === 1) {
    if (board.length === 0) {
      const goodFirstMove = sample([{ from: 3, to: 5 }, { from: 1, to: 8 }, { from: 2, to: 7 }]);
      newBoard.push(goodFirstMove);
    } else {
      const symDir = edgeDirection(board[0].from, board[0].to);
      const lastMove = last(board);
      if (edgeDirection(lastMove.from, lastMove.to) === symDir) {
        newBoard.push(allowedMoves.filter(e => edgeDirection(e.from, e.to) === symDir)[0]);
      } else {
        const mirrorOfLastMove = { from: mirrorNodes[symDir][lastMove.from], to: mirrorNodes[symDir][lastMove.to] };
        if (!isAllowed(board, mirrorOfLastMove)) {
          console.error('Unexpected state, falling back');
          newBoard.push(sample(allowedMoves));
        } else {
          newBoard.push(mirrorOfLastMove);
        }
      }
    }
  } else {
    newBoard.push(sample(allowedMoves));
  }
  return { newBoard, isGameEnd: isGameEnd(newBoard), winnerIndex: null };
};

const rule = <>
  Egy indiánrezervátumban 10 totemoszlopot állítottak fel a bal oldali ábrán látható háromszögrács szerint.
  Csendes Patak és Vörös Tűz a következő játékot szokták itt játszani: felváltva feszítenek ki köteleket két-két oszlop
  között, és minden kötél kifeszítésénél figyelnek arra, hogy a kifeszített kötél párhuzamos legyen a nagy háromszög
  egyik oldalával, illetve a kötél nem haladhat el olyan oszlop mellett, amelyet már egy másik kötél érint.
  Ezenkívül ha a jelenleg kifeszített kötél helyett annak egy egyenes vonalú meghosszabbítása is kifeszíthető
  a fenti feltételek mellett, akkor azt kell kifeszíteniük. Az veszít, amelyikőjük már nem tud a
  szabályoknak megfelelően több kötelet kifeszíteni.

  Te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '10 totemoszlop',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints két oszlopra, amik között kötelet szeretnél kifeszíteni.',
    generateNewBoard: () => [],
    getGameStateAfterAiTurn
  }
});

export const TriangularGridRopes = () => {
  const [board, setBoard] = useState([]);

  return <Game board={board} setBoard={setBoard} />;
};
