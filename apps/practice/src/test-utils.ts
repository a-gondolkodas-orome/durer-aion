import type { BotMove, BotStrategy, Ctx, MoveDefinition } from './components/strategy-game-factory';
import { asBotMoves } from './components/strategy-game-factory/engine/bot-turn';

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

// Reads a move's legality the way the engine does — through the move itself —
// so a spec asserting a rule also pins that the rule is still wired to the move
// it governs. A bare predicate imported from `gameplay.ts` keeps passing after
// its `validate:` line is dropped; this does not.
export const moveValidator = <TBoard, TArgs extends unknown[]>(
  move: { validate?: (board: TBoard, meta: { ctx: Ctx }, ...args: TArgs) => boolean },
  ctx: Ctx = makeCtx()
) => (board: TBoard, ...args: TArgs): boolean => move.validate!(board, { ctx }, ...args);

// A bot names its moves rather than playing them, so a spec reads its decision
// straight off the return value. A strategy that named a whole turn returns
// several; the one it would play next is the first.
export const botNextMove = (named: BotMove | BotMove[]): BotMove => asBotMoves(named)[0]!;

export const botNextMoveArgs = (named: BotMove | BotMove[]): any[] =>
  botNextMove(named).args ?? [];

// Ask a strategy for its turn and play its next move through the game's own
// move, as the engine would. Lets a spec step a position forward by one bot
// move without standing up a whole match.
export const playBotMove = <TBoard>(
  strategy: BotStrategy<TBoard>,
  moves: Record<string, MoveDefinition<TBoard>>,
  board: TBoard,
  ctx: Ctx = makeCtx()
): TBoard => {
  const { move, args = [] } = botNextMove(strategy({ board, ctx }));
  return moves[move]!.apply(board, { ctx }, ...args).nextBoard;
};
