import { EDGES, TRIANGLES, TRIANGLE_COUNT } from '../geometry';
import {
  type Board, LINE,
  generateStartBoard, applyShade, applyCircle,
  isLineWin, isCircleWin, liveThreats, freeTriangles
} from '../helpers';
import { OPENING_EDGE, OPENING_EDGES, isLineTurnWon, marchEdges, winningPairHeatEdges } from './forced-win';
import { makeSmartBotStrategy } from './bot-strategy';
import { playBotTurn } from './spec-helpers';

// The centrepiece: a complete-branching certificate that the LINE player wins
// the side-6 board. Soundness rests on the March Lemma (see forced-win.ts);
// the same check run on side-2/3 geometries fails, as it must — the exact
// solver shows the circle player wins those boards (near-tree free-graphs).

describe('forced-win certificate (line player wins the side-6 board)', () => {
  it('the opening orbit consists of interior edges and contains the certified one', () => {
    expect(OPENING_EDGES).toContain(OPENING_EDGE);
    for (const e of OPENING_EDGES) expect(EDGES[e].triangleIds).toHaveLength(2);
  });

  it('after any symmetric opening, every circle reply is answered: two-hot already, ' +
     'or a second pair-heat exists after which ALL circle replies leave two-hot', () => {
    const empty = generateStartBoard();
    expect(isLineTurnWon(empty)).toBe(false);

    for (const opening of OPENING_EDGES) {
      const afterOpening = applyShade(empty, opening);
      for (let reply = 0; reply < TRIANGLE_COUNT; reply++) {
        const pos = applyCircle(afterOpening, reply);
        if (isLineTurnWon(pos)) continue; // careless reply: march wins at once
        // The only serious replies; a certified second pair-heat must exist.
        expect(winningPairHeatEdges(pos).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('isLineTurnWon (two-hot criterion)', () => {
  it('is false on the empty board and after a boundary shade (one hot only)', () => {
    const empty = generateStartBoard();
    expect(isLineTurnWon(empty)).toBe(false);
    const boundary = EDGES.find(e => e.triangleIds.length === 1)!;
    expect(isLineTurnWon(applyShade(empty, boundary.id))).toBe(false);
  });

  it('is true after one interior shade: both heated triangles stay connected ' +
     'around the removed edge', () => {
    const interior = EDGES[OPENING_EDGE];
    expect(isLineTurnWon(applyShade(generateStartBoard(), interior.id))).toBe(true);
  });

  it('is true for an uncircled triangle with two shaded sides', () => {
    const [e0, e1] = TRIANGLES[5].edgeIds;
    expect(isLineTurnWon(applyShade(applyShade(generateStartBoard(), e0), e1))).toBe(true);
  });
});

describe('marchEdges', () => {
  it('returns the shared free edge of two adjacent hot triangles', () => {
    const edge = EDGES.find(e => e.triangleIds.length === 2)!;
    const [t1, t2] = edge.triangleIds;
    const other = (t: number) => TRIANGLES[t].edgeIds.find(e => e !== edge.id)!;
    let board = generateStartBoard();
    board = applyShade(board, other(t1));
    board = applyShade(board, other(t2));
    expect(marchEdges(board)).toEqual([edge.id]);
  });

  it('starts a forcing chain between two hots separated by a cold triangle', () => {
    // A down triangle B flanked by two up triangles A, C that each own a
    // boundary edge: heat A and C through their boundary edges (heats nothing
    // else), leaving the chain A - B - C with cold interior.
    const hasBoundaryEdge = (t: number) =>
      TRIANGLES[t].edgeIds.some(e => EDGES[e].triangleIds.length === 1);
    const B = TRIANGLES.find(t =>
      t.dir === 'down' &&
      t.edgeIds.filter(e =>
        EDGES[e].triangleIds.some(u => u !== t.id && hasBoundaryEdge(u))
      ).length >= 2
    )!;
    const flank = B.edgeIds
      .map(e => EDGES[e].triangleIds.find(u => u !== B.id))
      .filter((u): u is number => u !== undefined && hasBoundaryEdge(u));
    const [A, C] = flank;
    const boundaryEdge = (t: number) => TRIANGLES[t].edgeIds.find(x => EDGES[x].triangleIds.length === 1)!;

    let board = generateStartBoard();
    board = applyShade(board, boundaryEdge(A));
    board = applyShade(board, boundaryEdge(C));

    const steps = marchEdges(board);
    expect(steps.length).toBeGreaterThan(0);
    // Every candidate chain shade must create a completion threat (the forcing
    // move) — the bot may sample any of them.
    for (const step of steps) {
      expect(liveThreats(applyShade(board, step)).length).toBeGreaterThanOrEqual(1);
    }
  });
});

// End-to-end: the bot as line player beats a paranoid circle defender for every
// possible first reply — the executable form of the certificate.
describe('bot line player wins against adversarial circle defence', () => {
  const bot = makeSmartBotStrategy({ depth: 4, budget: 500 });

  // Cover the threat if any (forced), otherwise pick a reply that avoids an
  // immediately lost (two-hot) position when one exists.
  const paranoidCircleReply = (board: Board): number => {
    const threats = liveThreats(board);
    if (threats.length > 0) return threats[0];
    const free = freeTriangles(board);
    const safe = free.find(t => !isLineTurnWon(applyCircle(board, t)));
    return safe ?? free[0];
  };

  it('wins for every one of the 36 first circle replies', () => {
    for (let reply = 0; reply < TRIANGLE_COUNT; reply++) {
      let board = applyCircle(applyShade(generateStartBoard(), OPENING_EDGE), reply);
      let won = false;
      for (let round = 0; round < 40; round++) {
        board = playBotTurn(board, LINE, bot).nextBoard;
        if (isLineWin(board)) { won = true; break; }
        board = applyCircle(board, paranoidCircleReply(board));
        if (isCircleWin(board)) break;
      }
      expect(won).toBe(true);
    }
  });
});
