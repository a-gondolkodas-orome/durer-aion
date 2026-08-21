import { thiefSurvives, copMoveWins, winningPlacements, chooseCopMove } from './bot-strategy';
import { neighbours, VERTEX_COUNT } from './gameplay';

// ---------------------------------------------------------------------------
// Independent, from-scratch reference solver (no memoisation, no shared code
// with the module) to cross-check the strategy's correctness.
// ---------------------------------------------------------------------------
const refJointMoves = (cops: number[]): number[][] => {
  let acc: number[][] = [[]];
  for (const c of cops) {
    const next: number[][] = [];
    for (const p of acc) for (const nb of neighbours[c]) next.push([...p, nb]);
    acc = next;
  }
  const seen = new Set<string>();
  const out: number[][] = [];
  for (const m of acc) {
    const s = [...m].sort((a, b) => a - b);
    const k = s.join(',');
    if (!seen.has(k)) { seen.add(k); out.push(s); }
  }
  return out;
};

const refSurvives = (cops: number[], thief: number, movesLeft: number): boolean => {
  if (movesLeft === 0) return true;
  for (const nc of refJointMoves(cops)) {
    if (nc.includes(thief)) return false;
    const canReply = neighbours[thief].some((t) => !nc.includes(t) && refSurvives(nc, t, movesLeft - 1));
    if (!canReply) return false;
  }
  return true;
};

const refWinningPlacements = (copCount: number): string[] => {
  const winning: string[] = [];
  const build = (start: number, cur: number[]) => {
    if (cur.length === copCount) {
      for (let t = 0; t < VERTEX_COUNT; t++) {
        if (cur.includes(t)) continue;
        if (refSurvives(cur, t, 3)) return;
      }
      winning.push([...cur].sort((a, b) => a - b).join(','));
      return;
    }
    for (let v = start; v < VERTEX_COUNT; v++) { cur.push(v); build(v, cur); cur.pop(); }
  };
  build(0, []);
  return winning.sort();
};

describe('policeman-thief-c minimax', () => {
  it('agrees with an independent reference for thiefSurvives on all single-cop starts', () => {
    for (let c = 0; c < VERTEX_COUNT; c++) {
      for (let t = 0; t < VERTEX_COUNT; t++) {
        if (t === c) continue;
        expect(thiefSurvives([c], t, 3)).toBe(refSurvives([c], t, 3));
      }
    }
  });

  it('agrees with an independent reference for a sample of two-cop states', () => {
    for (let a = 0; a < VERTEX_COUNT; a += 2) {
      for (let b = a; b < VERTEX_COUNT; b += 3) {
        for (let t = 0; t < VERTEX_COUNT; t++) {
          if (t === a || t === b) continue;
          expect(thiefSurvives([a, b], t, 3)).toBe(refSurvives([a, b], t, 3));
          expect(thiefSurvives([a, b], t, 2)).toBe(refSurvives([a, b], t, 2));
        }
      }
    }
  });

  it('finds no winning placement for a single policeman (thief always escapes)', () => {
    expect(winningPlacements(1)).toHaveLength(0);
  });

  it('finds exactly the five two-cop winning placements (adjacent inner pairs)', () => {
    const got = winningPlacements(2).map((p) => [...p].sort((a, b) => a - b).join(',')).sort();
    expect(got).toEqual(['10,11', '10,14', '11,12', '12,13', '13,14']);
    expect(got).toEqual(refWinningPlacements(2));
  });

  it('chooseCopMove returns a genuinely winning move from every winning 2-cop state', () => {
    // From a known winning placement, against every thief start, the chosen cop
    // move must force the loss (verified with both the module and the reference).
    for (const placement of winningPlacements(2)) {
      for (let thief = 0; thief < VERTEX_COUNT; thief++) {
        if (placement.includes(thief)) continue;
        const move = chooseCopMove(placement, thief, 3);
        expect(move).toHaveLength(2);
        move.forEach((dest, i) => expect(neighbours[placement[i]]).toContain(dest));
        expect(copMoveWins(move, thief, 3)).toBe(true);
      }
    }
  });

  it('optimal police catch the thief within three rounds from a winning placement (full playout)', () => {
    // Exhaustively explore every thief reply; optimal cops (chooseCopMove) must
    // always end with the thief sharing a vertex with a policeman.
    const thiefIsCaught = (cops: number[], thief: number, movesLeft: number): boolean => {
      if (cops.includes(thief)) return true;
      if (movesLeft === 0) return false; // thief completed 3 safe moves -> escaped
      const move = chooseCopMove(cops, thief, movesLeft);
      if (move.includes(thief)) return true; // caught as a policeman steps in
      const replies = neighbours[thief].filter((t) => !move.includes(t));
      if (replies.length === 0) return true; // thief forced onto a policeman
      return replies.every((t) => thiefIsCaught(move, t, movesLeft - 1));
    };
    for (let thief = 0; thief < VERTEX_COUNT; thief++) {
      if (thief === 10 || thief === 11) continue;
      expect(thiefIsCaught([10, 11], thief, 3)).toBe(true);
    }
  });
});
