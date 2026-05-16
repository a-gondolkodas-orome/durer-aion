import { moves } from './number-pyramid';

const active = (value) => ({ value, state: 'active' });

const makeBoard = (level0Values, target) => ({
  levels: [
    level0Values.map(active),
    Array(4).fill(null),
    Array(2).fill(null),
    Array(1).fill(null)
  ],
  target,
  sortedInitial: [...level0Values].sort((a, b) => b - a)
});

const mockEvents = () => {
  const calls = { endTurn: 0, endGame: null };
  return {
    events: {
      endTurn: () => { calls.endTurn++; },
      endGame: ({ winnerIndex }) => { calls.endGame = winnerIndex; },
      setTurnState: () => {}
    },
    calls
  };
};

describe('moves.combineTwo', () => {
  it('places combined value on next level', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { events } = mockEvents();
    const { nextBoard } = moves.combineTwo(
      board, { ctx: { currentPlayer: 0 }, events }, { levelIdx: 0, indices: [0, 1] }
    );
    const level1Active = nextBoard.levels[1].find((s) => s?.state === 'active');
    expect(level1Active.value).toBe(9);
  });

  it('marks both combined slots as consumed', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { events } = mockEvents();
    const { nextBoard } = moves.combineTwo(
      board, { ctx: { currentPlayer: 0 }, events }, { levelIdx: 0, indices: [0, 1] }
    );
    expect(nextBoard.levels[0][0].state).toBe('consumed');
    expect(nextBoard.levels[0][1].state).toBe('consumed');
  });

  it('calls endTurn when combined value is below k', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { events, calls } = mockEvents();
    moves.combineTwo(board, { ctx: { currentPlayer: 0 }, events }, { levelIdx: 0, indices: [0, 1] });
    expect(calls.endTurn).toBe(1);
    expect(calls.endGame).toBeNull();
  });

  it('calls endGame with current player when combined value reaches k', () => {
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 15);
    const { events, calls } = mockEvents();
    moves.combineTwo(board, { ctx: { currentPlayer: 1 }, events }, { levelIdx: 0, indices: [0, 1] });
    expect(calls.endGame).toBe(1);
    expect(calls.endTurn).toBe(0);
  });

  it('does not mutate the original board', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { events } = mockEvents();
    moves.combineTwo(board, { ctx: { currentPlayer: 0 }, events }, { levelIdx: 0, indices: [0, 1] });
    expect(board.levels[0][0].state).toBe('active');
  });
});
