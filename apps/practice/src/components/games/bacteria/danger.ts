import { type Board, topRowIdx, wideWidth, rowWidth, spreadChildren, inBoard } from "./helpers";

// "Lettered" (dangerous) cells ---------------------------------------------
// A cell is lettered if a single bacterium placed there (after the defender's
// move) lets the attacker force a win. Computed by downward induction:
//  - top row: a goal, or horizontally adjacent to a goal (one shift wins)
//  - lower rows: both spread children exist and are lettered (repeated doubling
//    keeps a copy climbing on lettered cells until it reaches a goal)
//  - the single jump exception: a wide-row edge two rows below an edge goal,
//    where doubling would spill a copy off the board, so the attacker jumps.
export const computeLettered = (board: Board): boolean[][] => {
  const top = topRowIdx(board);
  const w = wideWidth(board);
  const lettered = board.bacteria.map(row => row.map(() => false));

  for (let row = top; row >= 0; row--) {
    for (let col = 0; col < rowWidth(board, row); col++) {
      if (row === top) {
        lettered[row][col] =
          board.goals.includes(col) ||
          board.goals.includes(col - 1) ||
          board.goals.includes(col + 1);
        continue;
      }
      const children = spreadChildren(board, row, col);
      const spreadDanger =
        children.length === 2 && children.every(([r, c]) => lettered[r][c]);
      const jumpDanger =
        row === top - 2 &&
        (col === 0 || col === w - 1) &&
        board.goals.includes(col);
      lettered[row][col] = spreadDanger || jumpDanger;
    }
  }
  return lettered;
};

// "Free" cells the defender can safely shepherd a bacterium into: any
// non-lettered top-row cell, plus the edges of wide rows (a bacterium there
// can never profitably double, so it is harmless / removable).
export const computeSinks = (board: Board, lettered: boolean[][]): boolean[][] => {
  const top = topRowIdx(board);
  const w = wideWidth(board);
  const sinks = board.bacteria.map(row => row.map(() => false));

  for (let col = 0; col < w; col++) {
    if (!lettered[top][col]) sinks[top][col] = true;
  }
  for (let row = 0; row < top; row += 2) {
    for (const col of [0, w - 1]) {
      if (inBoard(board, row, col) && !lettered[row][col]) sinks[row][col] = true;
    }
  }
  return sinks;
};

// Max-flow deficiency -------------------------------------------------------
// The game value: the attacker wins iff the bacteria CANNOT be routed to
// distinct free cells via vertex-disjoint upward paths avoiding lettered
// cells. deficiency = (#bacteria) - (max routable) >= 1  <=>  attacker wins.
//
// Each cell has vertex capacity 1 (the cellIn->cellOut edge below), enforcing
// the vertex-disjoint requirement. A consequence is that a cell holding 2+
// bacteria can route only one of them onward, so on such "stacked" positions
// deficiency may over-estimate the attacker. This does not affect real play:
// every start board (both variants) places one bacterium per distinct column,
// and the bot's full-game simulations remain optimal (see bot-strategy.spec).
// A capacity of (bacteria on cell) would change the theory and is deliberately
// avoided.
export const deficiency = (
  board: Board,
  lettered = computeLettered(board),
  sinks = computeSinks(board, lettered)
): number => {
  const rows = board.bacteria.length;
  const w = wideWidth(board);
  const cellIn = (r: number, c: number) => (r * w + c) * 2;
  const cellOut = (r: number, c: number) => (r * w + c) * 2 + 1;
  const S = rows * w * 2;
  const T = rows * w * 2 + 1;
  const N = rows * w * 2 + 2;

  const graph: number[][] = Array.from({ length: N }, () => []);
  const edges: { to: number; cap: number; flow: number }[] = [];
  const addEdge = (u: number, v: number, cap: number) => {
    graph[u].push(edges.length);
    edges.push({ to: v, cap, flow: 0 });
    graph[v].push(edges.length);
    edges.push({ to: u, cap: 0, flow: 0 });
  };

  let totalBacteria = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rowWidth(board, r); c++) {
      addEdge(cellIn(r, c), cellOut(r, c), 1);
      if (!lettered[r][c]) {
        for (const [cr, cc] of spreadChildren(board, r, c)) {
          if (!lettered[cr][cc]) addEdge(cellOut(r, c), cellIn(cr, cc), 1);
        }
      }
      if (sinks[r][c]) addEdge(cellOut(r, c), T, 1);
      const count = board.bacteria[r][c];
      if (count > 0) {
        totalBacteria += count;
        addEdge(S, cellIn(r, c), count);
      }
    }
  }

  // Edmonds-Karp.
  let flow = 0;
  while (true) {
    const parentEdge = new Array<number>(N).fill(-1);
    parentEdge[S] = -2;
    const queue = [S];
    while (queue.length) {
      const u = queue.shift()!;
      for (const id of graph[u]) {
        const e = edges[id];
        if (parentEdge[e.to] === -1 && e.cap - e.flow > 0) {
          parentEdge[e.to] = id;
          queue.push(e.to);
        }
      }
    }
    if (parentEdge[T] === -1) break;
    let node = T;
    while (node !== S) {
      const id = parentEdge[node];
      edges[id].flow += 1;
      edges[id ^ 1].flow -= 1;
      node = edges[id ^ 1].to;
    }
    flow += 1;
  }

  return totalBacteria - flow;
};
