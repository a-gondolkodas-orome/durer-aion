import type { Board } from './gameplay';

// The parts of both shark bots that only ever depended on the side of the lake.
// The two copies were the same code with 4/16 swapped for 5/25 throughout,
// including a hand-unrolled BFS that repeated the four neighbour tests eight
// times; `size` replaces every one of those literals.
//
// What stays in each bot is the part that is genuinely per-variant: the
// researchers' scripted opening, the location-preference rings, and 5×5's
// precomputed exception table.
export const makeGeometry = (size: number) => {
  const cellCount = size * size;

  // Side-adjacent cells, in the order +row, −row, +col, −col. Callers depend on
  // that order: `findSubmarineNextToShark` returns the first hit.
  const getAdjacentCells = (pos: number): number[] => {
    const cells: number[] = [];
    if (pos + size < cellCount) cells.push(pos + size);
    if (pos - size >= 0) cells.push(pos - size);
    if (pos + 1 < cellCount && pos % size !== size - 1) cells.push(pos + 1);
    if (pos - 1 >= 0 && pos % size !== 0) cells.push(pos - 1);
    return cells;
  };

  const findSubmarineNextToShark = (board: Board): number | undefined =>
    getAdjacentCells(board.shark).find(cell => board.submarines[cell] >= 1);

  const distanceFromShark = (shark: number, id: number): number =>
    Math.abs((shark % size) - (id % size)) +
    Math.abs(Math.floor(shark / size) - Math.floor(id / size));

  // The four two-step directions, as offsets from the shark: straight left and
  // right (±2), straight up and down (±2·size), and the four diagonals
  // (±(size ± 1)). Each names the one or two cells a route through it must pass.
  const [up, down, left, right] = [-size, size, -1, 1];
  const diagonals = [
    { offset: up + left, vias: [up, left] },
    { offset: down + left, vias: [down, left] },
    { offset: down + right, vias: [down, right] },
    { offset: up + right, vias: [up, right] }
  ];
  const straights = [
    { offset: 2 * left, via: left },
    { offset: 2 * right, via: right },
    { offset: 2 * down, via: down },
    { offset: 2 * up, via: up }
  ];

  // Can the shark reach `id` this turn without swimming through a submarine? A
  // straight two-step is blocked by a submarine on the single cell between; a
  // diagonal only when both ways round are blocked.
  const isReachableWithoutDeath = (submarines: number[], shark: number, id: number): boolean => {
    if (distanceFromShark(shark, id) > 2) return false;
    if (submarines[id] >= 1) return false;
    if (distanceFromShark(shark, id) === 2) {
      for (const { offset, via } of straights) {
        if (id === shark + offset && submarines[shark + via] >= 1) return false;
      }
      for (const { offset, vias } of diagonals) {
        if (id === shark + offset && vias.every(via => submarines[shark + via] >= 1)) return false;
      }
    }
    return true;
  };

  // The halfway cell of the route to `id`: for a diagonal, whichever way round
  // is not blocked, defaulting to the vertical leg.
  const getIntermediateSharkPosition = (submarines: number[], shark: number, id: number): number => {
    for (const { offset, via } of straights) {
      if (id === shark + offset) return shark + via;
    }
    for (const { offset, vias } of diagonals) {
      if (id !== shark + offset) continue;
      const [vertical, horizontal] = vias;
      if (submarines[shark + vertical] >= 1) return shark + horizontal;
      if (submarines[shark + horizontal] >= 1) return shark + vertical;
      return shark + vertical;
    }
    return id;
  };

  // For each cell, the size of its connected component among the cells that no
  // submarine occupies or borders. Cells that are next to a submarine keep 0.
  const getComponentSizes = (submarines: number[]): number[] => {
    const isNextToSubmarine = (id: number): boolean =>
      submarines[id] >= 1 || getAdjacentCells(id).some(cell => submarines[cell] >= 1);

    const componentSizes = Array(cellCount).fill(0);
    const seen = Array(cellCount).fill(false);

    for (let start = 0; start < cellCount; start++) {
      if (seen[start] || isNextToSubmarine(start)) continue;

      const component: number[] = [];
      const queue = [start];
      seen[start] = true;
      while (queue.length > 0) {
        const cell = queue.shift()!;
        component.push(cell);
        for (const next of getAdjacentCells(cell)) {
          if (!seen[next] && !isNextToSubmarine(next)) {
            seen[next] = true;
            queue.push(next);
          }
        }
      }
      for (const cell of component) componentSizes[cell] = component.length;
    }
    return componentSizes;
  };

  return {
    getAdjacentCells,
    findSubmarineNextToShark,
    distanceFromShark,
    isReachableWithoutDeath,
    getIntermediateSharkPosition,
    getComponentSizes
  };
};
