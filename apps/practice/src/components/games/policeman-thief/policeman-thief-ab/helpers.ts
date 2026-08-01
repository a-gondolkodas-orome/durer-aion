export const neighbours = {
  0: [1, 2, 4],
  1: [0, 3, 5],
  2: [0, 3, 6],
  3: [1, 2, 7],
  4: [0, 5, 6],
  5: [1, 4, 7],
  6: [2, 4, 7],
  7: [3, 5, 6]
};

export const VERTEX_COUNT = 8;

export const isVertex = (vertex: number): boolean =>
  Number.isInteger(vertex) && vertex >= 0 && vertex < VERTEX_COUNT;

// Everyone moves along a single road, and everyone must move every round, so
// every move in this game boils down to "is the target an intersection
// adjacent to the one the piece stands on".
export const isNeighbour = (from: number, to: number): boolean =>
  isVertex(from) && isVertex(to) && neighbours[from].includes(to);

// Player 0 chases, player 1 runs. Both indices appear in move legality, in the
// winner handed to endGame and in the board client, so they get names.
export const [POLICE, THIEF] = [0, 1];
