import { cloneDeep, every, range, some } from 'lodash';
import type { MoveOutcome } from 'strategy-game-factory';

export type Board = string[]

export const startBoard: Board = Array(8).fill('');
export const isColored = (board: Board, i: number) => board[i] !== '';

// The logic-side palette; `nodeColors` in cube-coloring.tsx adds the styling.
export const colors = ['red', 'blue', 'yellow'];

export const isAllowedStep = (board: Board, vertex: number, color: string | null) => {
  if (!color || !colors.includes(color)) return false;
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

const isGameEnd = (board: Board) => {
  const canUseColor = (color: string) => some(range(0, 8), v => isAllowedStep(board, v, color));
  return every(colors, color => !canUseColor(color));
};

export const moves = {
  colorVertex: {
    validate: (board: Board, _, { vertex, color }: { vertex: number; color: string | null }) =>
      isAllowedStep(board, vertex, color),
    apply: (board: Board, _, { vertex, color }: { vertex: number; color: string }): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[vertex] = color;
      if (isGameEnd(nextBoard)) {
        // The first player wants every vertex coloured; the second wants the
        // colouring to get stuck before that.
        const winnerIndex = every(range(0, 8), v => isColored(nextBoard, v)) ? 0 : 1;
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
