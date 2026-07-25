import type { Ctx, Events } from './components/strategy-game-factory';

// Mock `events` for testing move functions. Each handler is a spy, so tests can
// assert e.g. `expect(events.endGame).toHaveBeenCalledWith(1)`. For production
// code that needs no-op events (e.g. bot lookahead), use `dummyEvents` instead.
export const makeEvents = (overrides: Partial<Events> = {}): Events => ({
  endTurn: vi.fn(),
  endGame: vi.fn(),
  setTurnState: vi.fn(),
  ...overrides
});

// Mock `ctx` for testing move functions and bot strategies.
export const makeCtx = (overrides: Partial<Ctx> = {}): Ctx => ({
  phase: 'roleSelection',
  isHumanVsHumanGame: false,
  resolvedPlayerNames: ['Player 1', 'Player 2'],
  currentPlayer: null,
  isClientMoveAllowed: false,
  winnerIndex: null,
  chosenRoleIndex: null,
  turnState: null,
  moveCount: 0,
  ...overrides
});
