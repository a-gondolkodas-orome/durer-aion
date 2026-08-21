// Exact solver for Recolouring discs.
//
// Counts of a colour only ever increase on that colour's own turn, and (as the
// official solution notes) every red disc always stays left of every blue disc,
// so the reachable state space is tiny for the board sizes we ship. We solve the
// game exactly by retrograde analysis.
//
// The game is a race: red tries to force a red-majority position, blue tries to
// force a blue-majority position; if neither can, the game runs to the 200-ply
// cap and blue wins. So "red wins" is exactly "red can force reaching a
// red-majority position" — a reachability (attractor) game. We compute red's
// attractor (positions red can force to a red win) and, symmetrically, blue's,
// together with a rank = the minimum number of plies needed to force the win.
// The bot uses these ranks to make guaranteed progress toward its own majority.

import {
  type Cell,
  RED,
  BLUE,
  applyMove,
  encode,
  legalMoves,
  majorityWinner,
  startCells
} from './gameplay';

// A node is a position plus whose turn it is: "<encoded cells>:<player>".
type NodeKey = string;

const nodeKey = (cells: Cell[], player: number): NodeKey => `${encode(cells)}:${player}`;

interface Graph {
  // For every non-terminal node, the child node keys reachable in one ply.
  children: Map<NodeKey, NodeKey[]>;
  parents: Map<NodeKey, NodeKey[]>;
  // Whose turn it is at a node (needed after decoding a key).
  playerAt: Map<NodeKey, number>;
  // The player who has already won at a terminal node (0/1), or null otherwise.
  terminalWinner: Map<NodeKey, number | null>;
}

const buildGraph = (n: number): Graph => {
  const children = new Map<NodeKey, NodeKey[]>();
  const parents = new Map<NodeKey, NodeKey[]>();
  const playerAt = new Map<NodeKey, number>();
  const terminalWinner = new Map<NodeKey, number | null>();
  const cellsOf = new Map<NodeKey, Cell[]>();

  const start = startCells(n);
  const startKey = nodeKey(start, RED);
  cellsOf.set(startKey, start);
  playerAt.set(startKey, RED);

  const queue: NodeKey[] = [startKey];
  while (queue.length) {
    const key = queue.shift()!;
    if (children.has(key) || terminalWinner.has(key)) continue;
    const cells = cellsOf.get(key)!;
    const player = playerAt.get(key)!;

    const winner = majorityWinner(cells);
    if (winner !== null) {
      terminalWinner.set(key, winner);
      continue;
    }

    const childKeys: NodeKey[] = [];
    const nextPlayer = 1 - player;
    for (const move of legalMoves(cells, player)) {
      const childCells = applyMove(cells, player, move);
      const childKey = nodeKey(childCells, nextPlayer);
      childKeys.push(childKey);
      if (!cellsOf.has(childKey)) {
        cellsOf.set(childKey, childCells);
        playerAt.set(childKey, nextPlayer);
        queue.push(childKey);
      }
      (parents.get(childKey) ?? parents.set(childKey, []).get(childKey)!).push(key);
    }
    children.set(key, childKeys);
  }

  return { children, parents, playerAt, terminalWinner };
};

// Retrograde attractor: rank[node] = minimum plies for `controller` to force
// reaching a position where they already hold the majority. Nodes absent from
// the returned map are ones the controller cannot force.
//
// controller-to-move nodes are OR nodes (one good child suffices); opponent
// nodes are AND nodes (every child must already be forced). Because an AND node
// is only finalised when its last — hence highest-rank — child is settled, and
// an OR node when its first — hence lowest-rank — child is settled, processing
// the frontier in non-decreasing rank order (a plain FIFO, since every push has
// rank = popped rank + 1) yields exact min/max ranks.
const computeAttractor = (graph: Graph, controller: number): Map<NodeKey, number> => {
  const { children, parents, playerAt, terminalWinner } = graph;
  const rank = new Map<NodeKey, number>();
  const remaining = new Map<NodeKey, number>(); // undecided children left for AND nodes
  const queue: NodeKey[] = [];

  for (const [key, winner] of terminalWinner) {
    if (winner === controller) {
      rank.set(key, 0);
      queue.push(key);
    }
  }

  while (queue.length) {
    const child = queue.shift()!;
    const childRank = rank.get(child)!;
    for (const parent of parents.get(child) ?? []) {
      if (rank.has(parent)) continue;
      if (playerAt.get(parent) === controller) {
        // OR node: first settled child gives the minimum rank.
        rank.set(parent, childRank + 1);
        queue.push(parent);
      } else {
        // AND node: settle only once every child is forced.
        const left = (remaining.get(parent) ?? children.get(parent)!.length) - 1;
        remaining.set(parent, left);
        if (left === 0) {
          rank.set(parent, childRank + 1); // childRank is the max among children here
          queue.push(parent);
        }
      }
    }
  }

  return rank;
};

export interface Solved {
  n: number;
  redRank: Map<NodeKey, number>;
  blueRank: Map<NodeKey, number>;
  // Winner under optimal play at a node: red iff the node is in red's attractor,
  // otherwise blue (blue wins both by forcing a blue majority and by stalling).
  winnerAt: (cells: Cell[], player: number) => number;
  rankAt: (cells: Cell[], player: number, forPlayer: number) => number;
}

const cache = new Map<number, Solved>();

export const solveForN = (n: number): Solved => {
  const cached = cache.get(n);
  if (cached) return cached;

  const graph = buildGraph(n);
  const redRank = computeAttractor(graph, RED);
  const blueRank = computeAttractor(graph, BLUE);

  const solved: Solved = {
    n,
    redRank,
    blueRank,
    winnerAt: (cells, player) => (redRank.has(nodeKey(cells, player)) ? RED : BLUE),
    rankAt: (cells, player, forPlayer) => {
      const map = forPlayer === RED ? redRank : blueRank;
      return map.get(nodeKey(cells, player)) ?? Infinity;
    }
  };
  cache.set(n, solved);
  return solved;
};
