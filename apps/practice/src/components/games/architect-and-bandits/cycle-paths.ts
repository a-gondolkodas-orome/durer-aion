// Walking the wall is walking a cycle, and both variants' bots did it with the
// same five helpers written twice, 8 swapped for 10 throughout. Only the number
// of vertices ever differed.
export const makeCyclePaths = (vertexCount: number) => {
  const directedPath = (from: number, to: number, step: number): number[] => {
    const path: number[] = [];
    let cur = from;
    while (cur !== to) {
      cur = (cur + step + vertexCount) % vertexCount;
      path.push(cur);
    }
    return path;
  };

  const clockwiseDistance = (from: number, to: number): number =>
    (to - from + vertexCount) % vertexCount;

  const cycleDistance = (a: number, b: number): number =>
    Math.min(clockwiseDistance(a, b), clockwiseDistance(b, a));

  const shortestPathTo = (from: number, to: number): number[] => {
    if (from === to) return [];
    return directedPath(from, to, clockwiseDistance(from, to) <= clockwiseDistance(to, from) ? 1 : -1);
  };

  // Fewest steps to visit every target from `pos`. Tries all k+1 arc splits: j
  // targets covered going clockwise, the rest counterclockwise. Going both ways
  // means doubling back, hence the 2× on whichever arc is walked first.
  const minPathToVisitAll = (pos: number, targets: number[]): number => {
    if (targets.length === 0) return 0;
    const cwDists = targets.map(v => clockwiseDistance(pos, v)).sort((a, b) => a - b);
    const k = cwDists.length;
    let best = Infinity;
    for (let j = 0; j <= k; j++) {
      const cwReach = j > 0 ? cwDists[j - 1] : 0;
      const ccwReach = j < k ? vertexCount - cwDists[j] : 0;
      const cost = cwReach === 0 ? ccwReach
        : ccwReach === 0 ? cwReach
          : Math.min(2 * cwReach + ccwReach, cwReach + 2 * ccwReach);
      best = Math.min(best, cost);
    }
    return best;
  };

  return {
    directedPath,
    shortestPathTo,
    cycleDistance,
    minPathToVisitAll,
    clockwisePath: (from: number, to: number) => directedPath(from, to, 1),
    counterclockwisePath: (from: number, to: number) => directedPath(from, to, -1)
  };
};
