import { every, range, last, uniqWith, isEqual } from 'lodash';

//    0
//   1 2
//  3 4 5
// 6 7 8 9

// x, y, z: 3 "axis" showing parallel lines to triangle sides
export const vertices = [
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

export const isAllowed = (board, { from, to }) => {
  if (!isParallel({ from, to })) return false;
  if (isPartOfExistingRope(board, { from, to })) return false;
  const middlePoints = getMiddlePoints({ from, to });
  const nodesWithRope = getNodesWithRope(board);
  return every(middlePoints, p => !nodesWithRope.includes(p));
};

export const isGameEnd = board => {
  const allowedMoves = getAllowedMoves(board);
  return allowedMoves.length === 0;
};

export const getAllowedSuperset = (board, { from, to }) => {
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

const oneLengthEdges = [
  '0-1', '1-3', '3-6', '2-4', '4-7', '5-8',
  '0-2', '2-5', '5-9', '1-4', '4-8', '3-7',
  '6-7', '7-8', '8-9', '3-4', '4-5', '1-2'
];

export const mirrorNodes = {
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

export const edgeDirection = ({ from, to }) => {
  const vertexA = vertices[from];
  const vertexB = vertices[to];
  if (vertexA.x === vertexB.x) return 'x';
  if (vertexA.y === vertexB.y) return 'y';
  if (vertexA.z === vertexB.z) return 'z';
  return null;
};

const isParallel = (edge) => {
  return edgeDirection(edge) !== null;
};

const isPartOfExistingRope = (board, { from, to }) => {
  return board.some(e => {
    const middlePoints = getMiddlePoints(e);
    const edgePoints = [...middlePoints, e.from, e.to];
    return edgePoints.includes(from) && edgePoints.includes(to);
  });
};

const getMiddlePoints = ({ from, to }) => {
  const dir = edgeDirection({ from, to });
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

export const getAllowedMoves = board => {
  const moves = [];
  range(10).map(from => {
    range(from).map(to => {
      if (isAllowed(board, { from, to }) && from !== to) {
        moves.push(getAllowedSuperset(board, { from, to }));
      }
    });
  });
  return uniqWith(moves, (a, b) => isEqual(a, b) || isEqual(a, { from: b.to, to: b.from }));
};

export const getTrivialMoves = (board) => {
  const allowedMoves = getAllowedMoves(board);
  const trivialMoves = allowedMoves.filter(e =>
    oneLengthEdges.includes(`${e.from}-${e.to}`) || oneLengthEdges.includes(`${e.to}-${e.from}`)
  ).filter(e => {
    const nodesWithRope = getNodesWithRope(board);
    const bothCovered = nodesWithRope.includes(e.from) && nodesWithRope.includes(e.to);
    const fromCornerToCovered = [0, 6, 9].includes(e.from) && nodesWithRope.includes(e.to);
    const fromCoveredToCorner = nodesWithRope.includes(e.from) && [0, 6, 9].includes(e.to);
    return bothCovered || fromCornerToCovered || fromCoveredToCorner;
  });
  return trivialMoves;
};
