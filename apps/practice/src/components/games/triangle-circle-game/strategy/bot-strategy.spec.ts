import { EDGES, TRIANGLES } from '../geometry';
import {
  LINE, CIRCLE,
  generateStartBoard, applyShade, applyCircle,
  isLineWin, isCircleWin, isWinningShade, liveThreats, preThreatEdges
} from '../helpers';
import { smartBotStrategy, randomBotStrategy, makeSmartBotStrategy } from './bot-strategy';
import { playBotTurn } from './spec-helpers';

// Cheap search budget so full-game simulations stay fast in CI.
const fastBot = makeSmartBotStrategy({ depth: 6, budget: 2000 });

const otherEdge = (t: number, notEdge: number) => TRIANGLES[t].edgeIds.find(e => e !== notEdge)!;

describe('line-player bot', () => {
  it('takes an immediate win when a triangle has two shaded edges and no circle', () => {
    const t = 5;
    const [e0, e1, e2] = TRIANGLES[t].edgeIds;
    const board = applyShade(applyShade(generateStartBoard(), e0), e1);
    const played = playBotTurn(board, LINE, smartBotStrategy);
    expect(played.move).toBe('shadeEdge');
    expect(played.arg).toBe(e2);
    expect(isLineWin(played.nextBoard)).toBe(true);
  });

  it('creates a double threat when it can (plays a pre-threat edge)', () => {
    const edge = EDGES.find(e => e.triangleIds.length === 2)!;
    const [t1, t2] = edge.triangleIds;
    let board = generateStartBoard();
    board = applyShade(board, otherEdge(t1, edge.id));
    board = applyShade(board, otherEdge(t2, edge.id));
    // No immediate win available, but shading `edge` makes two live threats.
    expect(isWinningShade(board, edge.id)).toBe(false);
    const played = playBotTurn(board, LINE, smartBotStrategy);
    expect(played.move).toBe('shadeEdge');
    expect(liveThreats(played.nextBoard).length).toBeGreaterThanOrEqual(2);
  });

  it('always plays a legal (still-free) edge', () => {
    const board = applyShade(generateStartBoard(), 0);
    const played = playBotTurn(board, LINE, smartBotStrategy);
    expect(board.edges[played.arg]).toBe(false);
  });
});

describe('circle-player bot', () => {
  it('covers the sole live threat', () => {
    const t = 8;
    const [e0, e1] = TRIANGLES[t].edgeIds;
    const board = applyShade(applyShade(generateStartBoard(), e0), e1);
    const played = playBotTurn(board, CIRCLE, smartBotStrategy);
    expect(played.move).toBe('placeCircle');
    expect(played.arg).toBe(t);
    expect(liveThreats(played.nextBoard)).not.toContain(t);
  });

  it('defuses a pre-threat edge by circling one of its triangles', () => {
    const edge = EDGES.find(e => e.triangleIds.length === 2)!;
    const [t1, t2] = edge.triangleIds;
    let board = generateStartBoard();
    board = applyShade(board, otherEdge(t1, edge.id));
    board = applyShade(board, otherEdge(t2, edge.id));
    expect(liveThreats(board)).toHaveLength(0);
    const played = playBotTurn(board, CIRCLE, smartBotStrategy);
    expect(played.move).toBe('placeCircle');
    expect([t1, t2]).toContain(played.arg);
    expect(preThreatEdges(played.nextBoard)).not.toContain(edge.id);
  });

  it('always circles a still-empty triangle', () => {
    const board = applyCircle(generateStartBoard(), 0);
    const played = playBotTurn(board, CIRCLE, smartBotStrategy);
    expect(board.circles[played.arg]).toBe(false);
  });
});

describe('test bot', () => {
  it('takes an immediate win as the line player even though it otherwise plays randomly', () => {
    const [e0, e1, e2] = TRIANGLES[5].edgeIds;
    const board = applyShade(applyShade(generateStartBoard(), e0), e1);
    const played = playBotTurn(board, LINE, randomBotStrategy);
    expect(played.arg).toBe(e2);
    expect(isLineWin(played.nextBoard)).toBe(true);
  });
});

describe('full playthroughs terminate with a valid winner', () => {
  const simulate = (lineStrategy: typeof smartBotStrategy, circleStrategy: typeof smartBotStrategy) => {
    let board = generateStartBoard();
    let player = LINE;
    for (let turn = 0; turn < 200; turn++) {
      const played = playBotTurn(board, player, player === LINE ? lineStrategy : circleStrategy);
      board = played.nextBoard;
      if (isLineWin(board)) return LINE;
      if (isCircleWin(board)) return CIRCLE;
      player = 1 - player;
    }
    throw new Error('game did not terminate');
  };

  it('heuristic vs heuristic ends cleanly', () => {
    for (let i = 0; i < 5; i++) {
      const winner = simulate(fastBot, fastBot);
      expect([LINE, CIRCLE]).toContain(winner);
    }
  });

  it('random vs random ends cleanly', () => {
    for (let i = 0; i < 20; i++) {
      const winner = simulate(randomBotStrategy, randomBotStrategy);
      expect([LINE, CIRCLE]).toContain(winner);
    }
  });
});
