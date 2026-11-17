import type { State } from 'boardgame.io';
import { startingPositionMove, type GameStateMixin } from '../../../common/types';
import { OPENING_RANGE, possibleMoves, startingPosition, TAKES } from './game';
import type { MyGameState } from './game';

type GameState = State<MyGameState & GameStateMixin>;
type StrategyResult = [[number] | [MyGameState], string];

/// Whether the player to move wins from a pile of this size, with perfect play.
export function wins(pile: number): boolean {
  const outcomes = [false];
  for (let size = 1; size <= pile; size++) {
    outcomes.push(TAKES.some(take => take <= size && !outcomes[size - take]));
  }
  return outcomes[pile];
}

// The same outcomes by the pile's remainder mod 7, which they repeat with; the
// suite checks it against `wins`. A real bot needs no table here. This one is
// the marker README § Creating a new game greps the live client's bundle for:
// a key no other file has, which shows up there only if a bot leaked into it.
export const OUTCOME_BY_REMAINDER: Readonly<Record<string, boolean>> = {
  'sablon-maradek-0': false,
  'sablon-maradek-1': true,
  'sablon-maradek-2': false,
  'sablon-maradek-3': true,
  'sablon-maradek-4': true,
  'sablon-maradek-5': true,
  'sablon-maradek-6': true,
};

function winsFromTable(pile: number): boolean {
  return OUTCOME_BY_REMAINDER[`sablon-maradek-${pile % 7}`];
}

export function randomStrategy(state: GameState): StrategyResult {
  const moves = possibleMoves(state.G, state.ctx);
  if (moves.length === 0) throw new Error('No legal move in sablon');
  const { move, args } = moves[Math.floor(Math.random() * moves.length)];
  return [args, move];
}

/// A take that leaves a lost pile if there is one, else any.
export function winningStrategy(state: GameState): StrategyResult {
  const winning = possibleMoves(state.G, state.ctx).find(({ args: [count] }) => !winsFromTable(state.G.pile - count));
  return winning === undefined ? randomStrategy(state) : [winning.args, winning.move];
}

export function randomOpening(): MyGameState {
  const { min, max } = OPENING_RANGE;
  return startingPosition(min + Math.floor(Math.random() * (max - min + 1)));
}

export function strategyWrapper() {
  return (state: GameState, _botID: string): StrategyResult => {
    if (state.ctx.phase === 'startNewGame') return startingPositionMove<MyGameState>(randomOpening());
    return state.G.difficulty === 'test' ? randomStrategy(state) : winningStrategy(state);
  };
}
