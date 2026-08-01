import { every } from 'lodash';

export type Board = string[]

export const generateStartBoard = (): Board => Array(8).fill('');
export const isColored = (board: Board, i: number) => board[i] !== '';

// The logic-side palette; `nodeColors` in cube-coloring.tsx adds the styling.
export const colors = ['red', 'blue', 'yellow'];

export const isAllowedStep = (board: Board, vertex, color) => {
  if (!colors.includes(color)) return false;
  if (isColored(board, vertex)) return false;
  return every(neighbours[vertex], i => (!isColored(board, i)) || board[i] !== color);
};

// Nodes 0-3 are the front face, nodes 4-7 the back face; node i on the front
// connects to node i+4 on the back. Each edge is a pair of node ids; this is
// the single source of truth for both the drawn skeleton and the adjacency used
// by the colouring rules.
export const edges: [number, number][] = [
  // front face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  // back face
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  // 4 edges connecting front and back face
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
  // main diagonal
  [2, 4]
];

export const neighbours: Record<number, number[]> = edges.reduce((acc, [a, b]) => {
  (acc[a] ||= []).push(b);
  (acc[b] ||= []).push(a);
  return acc;
}, {} as Record<number, number[]>);
