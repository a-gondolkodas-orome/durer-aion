import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { cloneDeep, random } from 'lodash';
// Modified Petersen graph: the standard Petersen graph (outer 5-cycle, inner
// pentagram, 5 spokes) with each of the 5 outer edges subdivided by an extra
// node. 15 vertices in total:
//   O0..O4  (0..4)   original outer pentagon corners
//   M0..M4  (5..9)   Mi subdivides the outer edge Oi--O(i+1)
//   I0..I4  (10..14) inner pentagram; Ii ~ I(i+2) and I(i-2), spoke Oi--Ii
export const neighbours: Record<number, number[]> = {
  0: [9, 5, 10],
  1: [5, 6, 11],
  2: [6, 7, 12],
  3: [7, 8, 13],
  4: [8, 9, 14],
  5: [0, 1],
  6: [1, 2],
  7: [2, 3],
  8: [3, 4],
  9: [4, 0],
  10: [0, 12, 13],
  11: [1, 13, 14],
  12: [2, 14, 10],
  13: [3, 10, 11],
  14: [4, 11, 12]
};

export const VERTEX_COUNT = 15;

// SVG coordinates in a 0..100 viewBox (canonical symmetric Petersen embedding).
export const coords: { x: number; y: number }[] = [
  { x: 50.0, y: 8.0 },  // O0
  { x: 89.9, y: 37.0 }, // O1
  { x: 74.7, y: 84.0 }, // O2
  { x: 25.3, y: 84.0 }, // O3
  { x: 10.1, y: 37.0 }, // O4
  { x: 70.0, y: 22.5 }, // M0
  { x: 82.3, y: 60.5 }, // M1
  { x: 50.0, y: 84.0 }, // M2
  { x: 17.7, y: 60.5 }, // M3
  { x: 30.0, y: 22.5 }, // M4
  { x: 50.0, y: 33.0 }, // I0
  { x: 66.2, y: 44.7 }, // I1
  { x: 60.0, y: 63.8 }, // I2
  { x: 40.0, y: 63.8 }, // I3
  { x: 33.8, y: 44.7 }  // I4
];

// Unique undirected edges, derived once from the adjacency list.
export const edges: [number, number][] = (() => {
  const seen = new Set<string>();
  const list: [number, number][] = [];
  for (let v = 0; v < VERTEX_COUNT; v++) {
    for (const u of neighbours[v]) {
      const key = v < u ? `${v}-${u}` : `${u}-${v}`;
      if (!seen.has(key)) { seen.add(key); list.push([v, u]); }
    }
  }
  return list;
})();

// All-pairs shortest-path distances (BFS), computed once. Used only by bot
// heuristics for pressuring/evading in already-decided positions.
export const dist: number[][] = (() => {
  const d: number[][] = [];
  for (let s = 0; s < VERTEX_COUNT; s++) {
    const row = new Array(VERTEX_COUNT).fill(Infinity);
    row[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift()!;
      for (const u of neighbours[v]) {
        if (row[u] === Infinity) { row[u] = row[v] + 1; queue.push(u); }
      }
    }
    d.push(row);
  }
  return d;
})();

export const minDistToSet = (vertex: number, set: number[]): number =>
  Math.min(...set.map((c) => dist[vertex][c]));

export const isVertex = (vertex: number): boolean =>
  Number.isInteger(vertex) && vertex >= 0 && vertex < VERTEX_COUNT;

// Once the chase is on, everyone moves along a single edge, so every move
// reduces to "is the target adjacent to where the piece stands".
export const isNeighbour = (from: number, to: number): boolean =>
  isVertex(from) && isVertex(to) && neighbours[from].includes(to);

// Player 0 chases, player 1 runs. Both indices appear in move legality, in the
// `gameEnd` winner a move returns and in the board client, so they get names.
export const [POLICE, THIEF] = [0, 1];

export type Phase = 'placingCops' | 'placingThief' | 'chasing';

export type Board = {
  copCount: number
  phase: Phase
  policemen: number[]   // grows during placingCops; length === copCount afterwards
  thief: number | null  // null until placed
  thiefMoveCount: number // completed thief moves; thief wins on reaching 3
  copCursor: number     // index of the cop that moves next in a chasing cop-turn
};

// Most games use 2 policemen — the tight, genuinely hard case. A small share
// deal out 3 instead, where the police win much more easily.
const THREE_COP_PERCENT = 20;

export const pickCopCount = (): number => (random(1, 100) <= THREE_COP_PERCENT ? 3 : 2);

export const generateStartBoard = (): Board => ({
  copCount: pickCopCount(),
  phase: 'placingCops',
  policemen: [],
  thief: null,
  thiefMoveCount: 0,
  copCursor: 0
});

// `phase` and `copCursor` record how far the setup and the current police round
// have got, so every validator is a pure function of the board. The
// currentPlayer checks in the chasing moves say *which* piece may move — during
// a round the police and the thief both have a legal-looking step available,
// and only one of them is theirs to make.
export const moves = {
  // Police placement: one click per policeman; police may share a vertex.
  placeCop: {
    validate: (board: Board, _, vertex: number) =>
      board.phase === 'placingCops' && isVertex(vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen.push(vertex);
      // Every policeman is placed within one turn; the turn ends with the last.
      if (nextBoard.policemen.length === nextBoard.copCount) {
        nextBoard.phase = 'placingThief';
        return { nextBoard, isTurnEnd: true };
      }
      return { nextBoard };
    }
  },
  // Thief picks a starting vertex; it may not be one already holding a policeman.
  placeThief: {
    validate: (board: Board, _, vertex: number) =>
      board.phase === 'placingThief' && isVertex(vertex) && !board.policemen.includes(vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.thief = vertex;
      nextBoard.phase = 'chasing';
      nextBoard.copCursor = 0;
      return { nextBoard, isTurnEnd: true };
    }
  },
  // Chasing: move the current policeman along one edge. Catching the thief
  // (landing on its vertex) ends the game immediately for the police.
  moveCop: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      board.phase === 'chasing' && ctx.currentPlayer === POLICE
        && isNeighbour(board.policemen[board.copCursor], vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.policemen[nextBoard.copCursor] = vertex;
      nextBoard.copCursor += 1;
      if (vertex === nextBoard.thief) {
        return { nextBoard, gameEnd: { winnerIndex: POLICE } };
      }
      // Each policeman moves in turn; the turn ends once the cursor wraps.
      if (nextBoard.copCursor === nextBoard.copCount) {
        nextBoard.copCursor = 0;
        return { nextBoard, isTurnEnd: true };
      }
      return { nextBoard };
    }
  },
  // Chasing: move the thief along one edge. Stepping onto a policeman loses;
  // completing a third move without being caught wins.
  moveThief: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      board.phase === 'chasing' && ctx.currentPlayer === THIEF
        && isNeighbour(board.thief!, vertex),
    apply: (board: Board, _, vertex: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.thief = vertex;
      nextBoard.thiefMoveCount += 1;
      if (nextBoard.policemen.includes(vertex)) {
        return { nextBoard, gameEnd: { winnerIndex: POLICE } };
      }
      if (nextBoard.thiefMoveCount === 3) {
        return { nextBoard, gameEnd: { winnerIndex: THIEF } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
