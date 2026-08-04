import type { BotMove } from '../types';
import type { CoreState } from './store';

// The bot contract: a strategy NAMES the moves it wants — one, or the whole
// turn when the turn is one decision — and its caller plays them out: the React
// shell with a pause between them so the bot appears to think, the headless
// runner (run-match.ts) immediately.
//
// Pacing is therefore the caller's concern, never the strategy's: a bot that
// scheduled its own follow-up move with setTimeout could not run outside a
// browser, which is exactly what an authoritative server would have to do
// (docs/real-competitions-plan.md).
export const asBotMoves = (named: BotMove | BotMove[]): BotMove[] =>
  Array.isArray(named) ? named : [named];

// A move name is a string, so a typo in a strategy only shows up here. Say
// which names existed instead of letting `moves[name]` blow up as undefined.
export const unknownMoveMessage = (name: string, moves: object) =>
  `strategyGameFactory: botStrategy named unknown move '${name}' `
    + `(this game has: ${Object.keys(moves).join(', ')})`;

// Whether the strategy owes more moves: its turn is still open, so a bot that
// named only the first move of a multi-phase turn gets asked for the rest.
export const isBotTurnUnfinished = <TBoard>(
  state: CoreState<TBoard>, botPlayerIndex: number
) => state.phase === 'play' && state.currentPlayer === botPlayerIndex;
