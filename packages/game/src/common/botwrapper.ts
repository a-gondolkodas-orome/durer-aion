import { State } from 'boardgame.io';
import { Bot } from 'boardgame.io/ai';

/// A strategy names the bot's next move: its arguments and its name. The bot is
/// asked again while the turn is still its own, so a turn of several moves is
/// named one move at a time, each from the state the move before it made — and
/// a strategy may be asked halfway through its own turn, by any host. A
/// strategy that plays at random picks the move itself.
///
/// `setupData` is the match's setup data, which only the server has and hands
/// on; in the browser, `Local` calls a bot without it.
export type BotStrategy<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData?: unknown) => [T_Move, string];

/// A bot that is also handed the match's setup data, which boardgame.io keeps
/// in the match's metadata, out of every client's reach: the relay's judge
/// reads its problems and answers from there.
export type MatchBot = Bot & {
  play(state: State, playerID: string, setupData?: unknown): ReturnType<Bot['play']>;
};

/// How long one call of a strategy may take before the server warns, in
/// milliseconds; the live bots take a few milliseconds at worst (#116). The
/// server's hard limit is a deadline twenty times this (bot_pool.ts).
export const STRATEGY_BUDGET_MS = 100;

/// What `play` reports beside the move: how long the strategy took, for the
/// server to hold against the budget, the 400 ms pause left out.
export interface BotPlayMetadata {
  strategyMs: number;
}

/// A strategy run somewhere else — on the server, in a worker thread — as its
/// host reports it: the move it named, and how long it took to name it.
export interface StrategyAnswer<T_Move> {
  move: [T_Move, string];
  strategyMs: number;
}

/// Asks a strategy run elsewhere for the bot's next move. A failed strategy,
/// or one its host gave up on, is a rejection.
export type StrategyAsker<T_SpecificGameState, T_Move> =
  (state: State<T_SpecificGameState>, botID: string, setupData?: unknown) => Promise<StrategyAnswer<T_Move>>;

/// The class both wrappers return. Spelled out because a declaration file
/// cannot name the class itself: it inherits Bot's private members.
export type MatchBotClass = new (...args: ConstructorParameters<typeof Bot>) => MatchBot;

/// Wraps a strategy run elsewhere into a boardgame.io Bot class: what the
/// server plays its bots through, each strategy in a worker (bot_pool.ts).
export function askingBotWrapper<T_SpecificGameState, T_Move>(
  ask: StrategyAsker<T_SpecificGameState, T_Move>,
): MatchBotClass {
  class _Bot extends Bot {
    // waits 400 ms for UX
    async wait(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    async play(state: State<T_SpecificGameState>, playerID: string, setupData?: unknown): ReturnType<Bot['play']> {
      await this.wait();
      const { move: [move, moveName], strategyMs } = await ask(state, playerID, setupData);
      const metadata: BotPlayMetadata = { strategyMs };
      return { action: { type: 'MAKE_MOVE', payload: { type: moveName, args: move, playerID } }, metadata };
    }
  }
  return _Bot;
}

/// Wraps a strategy into a boardgame.io Bot class that runs it in-process:
/// the browser's, and the suites'.
export function botWrapper<T_SpecificGameState, T_Move>(
  botstrategy: BotStrategy<T_SpecificGameState, T_Move>,
): MatchBotClass {
  return askingBotWrapper<T_SpecificGameState, T_Move>(async (state, botID, setupData) => runStrategy(botstrategy, state, botID, setupData));
}

/// Calls a strategy and times it, for whichever host runs it.
export function runStrategy<T_SpecificGameState, T_Move>(
  strategy: BotStrategy<T_SpecificGameState, T_Move>,
  state: State<T_SpecificGameState>,
  botID: string,
  setupData?: unknown,
): StrategyAnswer<T_Move> {
  const started = Date.now();
  const move = strategy(state, botID, setupData);
  return { move, strategyMs: Date.now() - started };
}
