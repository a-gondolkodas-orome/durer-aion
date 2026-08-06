import { type Board, isArchitectStepAllowed, isDestructionAllowed } from './gameplay';

// A fresh day on a regular polygon with `vertexCount` towers, all standing, the
// architect at A(0).
const boardOn = (vertexCount: number) => (over: Partial<Board> = {}): Board => ({
  architectPosition: 0,
  towers: Array(vertexCount).fill(true),
  day: 1,
  kmUsedToday: 0,
  ...over
});

describe('isArchitectStepAllowed', () => {
  // Variant A: an 8-vertex wall, 40 km (four edges) per day.
  describe('on the octagon', () => {
    const octagon = boardOn(8);
    const stepAllowed = (board, target: number) => isArchitectStepAllowed(board, target, 40);

    it('allows a step to either neighbour along the wall', () => {
      expect(stepAllowed(octagon({ architectPosition: 3 }), 2)).toBe(true);
      expect(stepAllowed(octagon({ architectPosition: 3 }), 4)).toBe(true);
    });

    it('allows the step that wraps round between the last and first vertex', () => {
      expect(stepAllowed(octagon({ architectPosition: 0 }), 7)).toBe(true);
      expect(stepAllowed(octagon({ architectPosition: 7 }), 0)).toBe(true);
    });

    it('rejects a jump across the polygon', () => {
      expect(stepAllowed(octagon({ architectPosition: 0 }), 4)).toBe(false);
      expect(stepAllowed(octagon({ architectPosition: 0 }), 2)).toBe(false);
    });

    it('rejects staying put', () => {
      expect(stepAllowed(octagon({ architectPosition: 3 }), 3)).toBe(false);
    });

    it('allows the fourth edge of the day but not a fifth', () => {
      expect(stepAllowed(octagon({ kmUsedToday: 30 }), 1)).toBe(true);
      expect(stepAllowed(octagon({ kmUsedToday: 40 }), 1)).toBe(false);
    });

    it('rejects a vertex that is not on the wall', () => {
      expect(stepAllowed(octagon(), 8)).toBe(false);
      expect(stepAllowed(octagon(), 9)).toBe(false);
      expect(stepAllowed(octagon(), -1)).toBe(false);
    });
  });

  // Variant B: a 10-vertex wall, 50 km (five edges) per day. Neighbours wrap at
  // a different vertex and the day is one edge longer, so the same predicate
  // gives different answers — it reads both off the board and the allowance.
  describe('on the decagon', () => {
    const decagon = boardOn(10);
    const stepAllowed = (board, target: number) => isArchitectStepAllowed(board, target, 50);

    it('wraps round at vertex 9, which is not a neighbour of A on the octagon', () => {
      expect(stepAllowed(decagon({ architectPosition: 0 }), 9)).toBe(true);
    });

    it('allows the fifth edge of the day but not a sixth', () => {
      expect(stepAllowed(decagon({ kmUsedToday: 40 }), 1)).toBe(true);
      expect(stepAllowed(decagon({ kmUsedToday: 50 }), 1)).toBe(false);
    });

    it('rejects a vertex that is not on the wall', () => {
      expect(stepAllowed(decagon(), 10)).toBe(false);
    });
  });
});

describe('isDestructionAllowed', () => {
  const octagon = boardOn(8);

  it('allows knocking down a standing tower', () => {
    expect(isDestructionAllowed(octagon(), 5)).toBe(true);
  });

  it('rejects a vertex with no tower on it', () => {
    const towers = Array(8).fill(true);
    towers[5] = false;
    expect(isDestructionAllowed(octagon({ towers }), 5)).toBe(false);
  });

  it('rejects a vertex that is not on the wall', () => {
    expect(isDestructionAllowed(octagon(), 8)).toBe(false);
    expect(isDestructionAllowed(octagon(), 1.5)).toBe(false);
  });
});
