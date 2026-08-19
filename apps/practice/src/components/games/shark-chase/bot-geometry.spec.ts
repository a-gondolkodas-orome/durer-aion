import { makeGeometry } from './bot-geometry';
import { distance } from './gameplay';

// Deterministic pseudo-random submarine layouts, so a failure is reproducible.
const layouts = (cellCount: number, subCount: number, count: number): number[][] => {
  let seed = 12345;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: count }, () => {
    const subs = Array(cellCount).fill(0);
    for (let k = 0; k < subCount; k++) subs[Math.floor(next() * cellCount)] += 1;
    return subs;
  });
};

describe.each([4, 5])('makeGeometry(%i)', size => {
  const cellCount = size * size;
  const cells = Array.from({ length: cellCount }, (_, i) => i);
  const boards = [Array(cellCount).fill(0), ...layouts(cellCount, 3, 40), ...layouts(cellCount, 6, 40)];
  const geo = makeGeometry(size);

  // The lake does not wrap: adjacency has to agree with the shared `distance`
  // the rules use, which is what stops a cell in column 0 counting the cell in
  // column size-1 of the row above as its neighbour.
  it('calls exactly the cells at distance 1 adjacent', () => {
    cells.forEach(pos => {
      expect(geo.getAdjacentCells(pos).slice().sort((a, b) => a - b))
        .toEqual(cells.filter(other => distance(pos, other, size) === 1));
    });
  });

  it('agrees with the rules on distance', () => {
    cells.forEach(a => cells.forEach(b =>
      expect(geo.distanceFromShark(a, b)).toBe(distance(a, b, size))));
  });

  it('finds an adjacent submarine exactly when one is there', () => {
    boards.forEach(submarines => cells.forEach(shark => {
      const board = { submarines, shark, turn: 1, sharkMovesInTurn: 0 };
      const found = geo.findSubmarineNextToShark(board);
      const anyAdjacent = geo.getAdjacentCells(shark).filter(c => submarines[c] >= 1);
      if (anyAdjacent.length === 0) {
        expect(found).toBeUndefined();
      } else {
        expect(anyAdjacent).toContain(found);
      }
    }));
  });

  // A shark turn is up to two steps, so a target is reachable exactly when some
  // route of at most two steps gets there without passing through a submarine.
  const reachableByBruteForce = (submarines: number[], shark: number, id: number): boolean => {
    if (submarines[id] >= 1) return false;
    if (id === shark) return true;
    if (geo.getAdjacentCells(shark).includes(id)) return true;
    return geo.getAdjacentCells(shark)
      .filter(via => submarines[via] < 1)
      .some(via => geo.getAdjacentCells(via).includes(id));
  };

  it('reaches exactly the targets a two-step route can reach', () => {
    boards.forEach(submarines => cells.forEach(shark => cells.forEach(id => {
      expect(geo.isReachableWithoutDeath(submarines, shark, id))
        .toBe(reachableByBruteForce(submarines, shark, id));
    })));
  });

  it('routes every reachable target through a legal, submarine-free halfway cell', () => {
    boards.forEach(submarines => cells.forEach(shark => cells.forEach(id => {
      if (!geo.isReachableWithoutDeath(submarines, shark, id)) return;
      const via = geo.getIntermediateSharkPosition(submarines, shark, id);
      if (via === id) {
        // One step, or standing still.
        expect(distance(shark, id, size)).toBeLessThanOrEqual(1);
        return;
      }
      expect(geo.getAdjacentCells(shark)).toContain(via);
      expect(geo.getAdjacentCells(via)).toContain(id);
      expect(submarines[via]).toBeLessThan(1);
    })));
  });

  it('sizes each safe component by the cells it actually contains', () => {
    boards.forEach(submarines => {
      const sizes = geo.getComponentSizes(submarines);
      const isSafe = (id: number) =>
        submarines[id] < 1 && geo.getAdjacentCells(id).every(c => submarines[c] < 1);

      cells.forEach(cell => {
        if (!isSafe(cell)) {
          expect(sizes[cell]).toBe(0);
          return;
        }
        // Flood fill from this cell and compare with the reported size.
        const seen = new Set([cell]);
        const queue = [cell];
        while (queue.length > 0) {
          for (const next of geo.getAdjacentCells(queue.shift()!)) {
            if (isSafe(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
          }
        }
        expect(sizes[cell]).toBe(seen.size);
      });
    });
  });
});
