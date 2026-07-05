import { every, range, last, uniqWith, isEqual } from 'lodash';

// 15 totem poles: same game as `triangular-grid-ropes` (10 poles) but on a
// side-4 triangular grid (5 rows, 15 nodes) instead of side-3 (10 nodes).
//
//         0
//        1 2
//       3 4 5
//      6 7 8 9
//    10 11 12 13 14
//
// The geometry and lookup tables are derived from the side length N so we do
// not have to hand-maintain large tables for the bigger board.

const N = 4; // side length; number of poles = (N + 1)(N + 2) / 2
const nodeCount = ((N + 1) * (N + 2)) / 2;

// x, y, z: 3 "axis" coordinates, one per family of lines parallel to a
// triangle side. x is the row (0 at the top). Every node satisfies
// x + y + z = 2N.
type Vertex = { id: number, x: number, y: number, z: number, cx: string, cy: string };

// Layout: an equilateral triangle. The svg is square, so the vertical step is
// sqrt(3)/2 of the horizontal step to keep the triangle equilateral.
const dx = 20;
const dy = (dx * Math.sqrt(3)) / 2;
const topY = 10;
const pct = (n: number) => `${Math.round(n * 1000) / 1000}%`;

export const vertices: Vertex[] = (() => {
  const result: Vertex[] = [];
  let id = 0;
  for (let x = 0; x <= N; x++) {
    for (let p = 0; p <= x; p++) {
      result.push({
        id,
        x,
        y: N - x + p,
        z: N - p,
        cx: pct(50 + (p - x / 2) * dx),
        cy: pct(topY + x * dy)
      });
      id++;
    }
  }
  return result;
})();

export type Edge = { from: number, to: number }
export type Board = Edge[]

export type Direction = 'x' | 'y' | 'z';

export const edgeDirection = ({ from, to }: Edge): Direction | null => {
  const vertexA = vertices[from];
  const vertexB = vertices[to];
  if (vertexA.x === vertexB.x) return 'x';
  if (vertexA.y === vertexB.y) return 'y';
  if (vertexA.z === vertexB.z) return 'z';
  return null;
};

const isParallel = (edge: Edge) => edgeDirection(edge) !== null;

const getMiddlePoints = ({ from, to }: Edge) => {
  const dir = edgeDirection({ from, to });
  if (dir === null) return [];
  return range(nodeCount).filter(id => {
    return vertices[from][dir] === vertices[id][dir] && (
      (from > id && id > to) ||
      (from < id && id < to)
    );
  });
};

const isPartOfExistingRope = (board: Board, { from, to }: Edge) => {
  return board.some(e => {
    const middlePoints = getMiddlePoints(e);
    const edgePoints = [...middlePoints, e.from, e.to];
    return edgePoints.includes(from) && edgePoints.includes(to);
  });
};

const getNodesWithRope = (board: Board) => {
  return range(nodeCount).filter(id => {
    return board.some(e => {
      const isEndpoint = e.from === id || e.to === id;
      const isMiddlePoint = getMiddlePoints(e).includes(id);
      return isEndpoint || isMiddlePoint;
    });
  });
};

export const isAllowed = (board: Board, { from, to }: Edge) => {
  if (from === to) return false;
  if (!isParallel({ from, to })) return false;
  if (isPartOfExistingRope(board, { from, to })) return false;
  const middlePoints = getMiddlePoints({ from, to });
  const nodesWithRope = getNodesWithRope(board);
  return every(middlePoints, p => !nodesWithRope.includes(p));
};

// Maximal collinear runs of nodes, one per line of each direction family.
const lines: number[][] = (() => {
  const result: number[][] = [];
  for (const dir of ['x', 'y', 'z'] as Direction[]) {
    const byCoord: Record<number, number[]> = {};
    vertices.forEach(v => {
      (byCoord[v[dir]] ||= []).push(v.id);
    });
    Object.values(byCoord).forEach(ids => {
      if (ids.length >= 2) result.push([...ids].sort((a, b) => a - b));
    });
  }
  return result;
})();

// For every collinear segment, its strictly-containing super-segments on the
// same line, ordered by length ascending so `last` gives the longest one.
const superSets: Record<string, number[][]> = (() => {
  const result: Record<string, number[][]> = {};
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      for (let j = i + 1; j < line.length; j++) {
        const supers: number[][] = [];
        for (let a = 0; a <= i; a++) {
          for (let b = j; b < line.length; b++) {
            if (a === i && b === j) continue;
            supers.push([line[a], line[b], b - a]);
          }
        }
        supers.sort((u, v) => u[2] - v[2]);
        result[`${line[i]}-${line[j]}`] = supers.map(s => [s[0], s[1]]);
      }
    }
  }
  return result;
})();

export const getAllowedSuperset = (board: Board, { from, to }: { from: number | null, to: number | null }) => {
  if (from == null || to == null || from === to) return null;
  if (!isAllowed(board, { from, to })) return { from, to };
  const edgeSupsersets = superSets[`${from}-${to}`] || superSets[`${to}-${from}`] || [];
  const allowedSupersets = edgeSupsersets.filter(e => isAllowed(board, { from: e[0], to: e[1] }));
  if (allowedSupersets.length > 0) {
    const e = last(allowedSupersets)!;
    return { from: e[0], to: e[1] };
  }
  return { from, to };
};

export const getAllowedMoves = (board: Board) => {
  const moves: Edge[] = [];
  range(nodeCount).map(from => {
    range(from).map(to => {
      if (isAllowed(board, { from, to }) && from !== to) {
        moves.push(getAllowedSuperset(board, { from, to })!);
      }
    });
  });
  return uniqWith(moves, (a, b) => isEqual(a, b) || isEqual(a, { from: b.to, to: b.from }));
};

export const isGameEnd = (board: Board) => {
  return getAllowedMoves(board).length === 0;
};

// The bot's trivial-move handling and optimal search live in solver.ts, which
// works over bitmask primitives for speed on the bigger board.
