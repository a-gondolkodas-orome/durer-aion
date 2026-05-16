import { isP2WinningPosition, randomBotStrategy, aiBotStrategy } from './strategy';

const active = (value) => ({ value, state: 'active' });
const consumed = (value) => ({ value, state: 'consumed' });

const makeBoard = (level0Values, target, { sortedInitial } = {}) => {
  const sorted = sortedInitial ?? [...level0Values].sort((a, b) => b - a);
  return {
    levels: [
      level0Values.map(active),
      Array(4).fill(null),
      Array(2).fill(null),
      Array(1).fill(null)
    ],
    target,
    sortedInitial: sorted
  };
};

const makeMoveCapture = () => {
  const captured = [];
  return {
    moves: { combineTwo: (_board, arg) => { captured.push(arg); } },
    captured
  };
};

describe('isP2WinningPosition', () => {
  it('returns true when extremes < k and inner sum >= k', () => {
    // [9,8,7,6,5,4,2,2]: extremes=9+8+2+2=21, inner=7+6+5+4=22
    const s = [9, 8, 7, 6, 5, 4, 2, 2];
    expect(isP2WinningPosition(s, 22)).toBe(true);
    expect(isP2WinningPosition(s, 21)).toBe(false); // k <= extremes
    expect(isP2WinningPosition(s, 23)).toBe(false); // k > inner
  });

  it('returns false when extremes >= k', () => {
    const s = [10, 9, 6, 5, 4, 3, 2, 2]; // extremes=23, inner=18
    expect(isP2WinningPosition(s, 20)).toBe(false);
  });

  it('returns false when inner sum < k', () => {
    const s = [8, 7, 6, 5, 4, 4, 3, 3]; // extremes=21, inner=22
    expect(isP2WinningPosition(s, 25)).toBe(false);
  });
});

describe('randomBotStrategy', () => {
  it('takes winning pair on level 0 when available', () => {
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 15);
    const { moves: mockMoves, captured } = makeMoveCapture();
    randomBotStrategy({ board, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(0);
    const vals = captured[0].indices.map((i) => board.levels[0][i].value);
    expect(vals[0] + vals[1]).toBeGreaterThanOrEqual(15);
  });

  it('takes winning pair on a higher level when available', () => {
    const board = makeBoard([3, 3, 3, 3, 3, 3, 3, 3], 100);
    board.levels[1][0] = active(60);
    board.levels[1][1] = active(50);
    const { moves: mockMoves, captured } = makeMoveCapture();
    randomBotStrategy({ board, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(1);
  });

  it('ignores consumed slots when checking for a win', () => {
    // 10 is consumed, so 9+3=12 < 15: no win available, bot picks any pair
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 15);
    board.levels[0][0] = consumed(10);
    const { moves: mockMoves, captured } = makeMoveCapture();
    randomBotStrategy({ board, moves: mockMoves });
    const vals = captured[0].indices.map((i) => board.levels[0][i].value);
    expect(vals[0] + vals[1]).toBeLessThan(15);
  });

  it('makes a valid move when no winning pair exists', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 20);
    const { moves: mockMoves, captured } = makeMoveCapture();
    randomBotStrategy({ board, moves: mockMoves });
    expect(captured).toHaveLength(1);
    expect(captured[0].indices).toHaveLength(2);
  });
});

describe('aiBotStrategy', () => {
  it('takes an immediate winning move when available', () => {
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 15);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 0 }, moves: mockMoves });
    expect(captured).toHaveLength(1);
    const vals = captured[0].indices.map((i) => board.levels[0][i].value);
    expect(vals[0] + vals[1]).toBeGreaterThanOrEqual(15);
  });

  it('P1 in a winning position combines largest pair from level 0', () => {
    // [8,7,6,5,4,4,3,3]: extremes=21, inner=19, k=23 → P1 wins (inner < k)
    const board = makeBoard([8, 7, 6, 5, 4, 4, 3, 3], 23);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 0 }, moves: mockMoves });
    expect(captured).toHaveLength(1);
    const vals = captured[0].indices.map((i) => board.levels[0][i].value);
    expect(Math.max(...vals)).toBe(8);
  });

  it('P1 in a winning position prefers level 1 over level 0', () => {
    const board = makeBoard([8, 7, 6, 5, 4, 4, 3, 3], 23);
    board.levels[1][0] = active(15);
    board.levels[1][1] = active(12);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 0 }, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(1);
  });

  it('P2 in a winning position combines smallest pair from level 0', () => {
    // [9,8,7,6,5,4,2,2]: extremes=21, inner=22, k=22 → P2 wins
    const board = makeBoard([9, 8, 7, 6, 5, 4, 2, 2], 22);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 1 }, moves: mockMoves });
    expect(captured).toHaveLength(1);
    const vals = captured[0].indices.map((i) => board.levels[0][i].value);
    expect(Math.max(...vals)).toBe(2);
  });

  it('P2 in a winning position prefers level 1 over level 0', () => {
    const board = makeBoard([9, 8, 7, 6, 5, 4, 2, 2], 22);
    board.levels[1][0] = active(11);
    board.levels[1][1] = active(10);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 1 }, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(1);
  });

  it('immediate win on a higher level takes priority over strategy', () => {
    // P1-winning board, but level 1 already has a winning pair
    const board = makeBoard([8, 7, 6, 5, 4, 4, 3, 3], 23);
    board.levels[1][0] = active(15);
    board.levels[1][1] = active(10);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 0 }, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(1);
    const vals = captured[0].indices.map((i) => board.levels[1][i].value);
    expect(vals[0] + vals[1]).toBeGreaterThanOrEqual(23);
  });

  it('losing bot falls back to lowest available level', () => {
    // P2-winning board, but current player is P1 (losing) → fallback loop picks level 0
    const board = makeBoard([9, 8, 7, 6, 5, 4, 2, 2], 22);
    const { moves: mockMoves, captured } = makeMoveCapture();
    aiBotStrategy({ board, ctx: { currentPlayer: 0 }, moves: mockMoves });
    expect(captured[0].levelIdx).toBe(0);
  });
});
