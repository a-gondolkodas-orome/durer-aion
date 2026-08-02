import type { Ctx } from './components/strategy-game-factory';

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
