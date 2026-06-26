import { vi } from 'vitest';
import type { Events } from './components/game-factory';

// Mock `events` for testing move functions. Each handler is a spy, so tests can
// assert e.g. `expect(events.endGame).toHaveBeenCalledWith(1)`. For production
// code that needs no-op events (e.g. bot lookahead), use `dummyEvents` instead.
export const makeEvents = (overrides: Partial<Events> = {}): Events => ({
  endTurn: vi.fn(),
  endGame: vi.fn(),
  setTurnState: vi.fn(),
  ...overrides
});
