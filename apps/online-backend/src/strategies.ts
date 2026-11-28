import type { MyGameState, RelaySetupData } from 'game';
import type { StrategyGameKey } from 'game/strategy';
import { StrategyWrappers } from 'game/bot';
import type { State } from 'boardgame.io';
import { relayStrategy } from 'game/relay-judge';
import { RELAY_GAME_NAME, strategyGameName } from 'schemas';

/** The relay's judge, over the problems in its match's setup data. */
function relayJudge(state: State<MyGameState>, botID: string, setupData: unknown) {
  const judge = (setupData as Partial<RelaySetupData> | undefined)?.judge;
  if (judge === undefined) {
    throw new Error('This relay match has no problems in its setup data (started before #797).');
  }
  return relayStrategy(judge)(state, botID);
}

/** A strategy as a host calls it, whichever game's it is. */
export type HostedStrategy = (state: State, botID: string, setupData?: unknown) => [unknown, string];

/** The strategy of each game the server hosts, by the game's name: where both
 *  `hostedGames` and the bot worker look a game's bot up, so the game a match
 *  is played as and the bot that plays it cannot drift apart. */
export function hostedStrategies(): Record<string, HostedStrategy> {
  const strategies: Record<string, HostedStrategy> = { [RELAY_GAME_NAME]: relayJudge };
  for (const gameId of Object.keys(StrategyWrappers) as StrategyGameKey[]) {
    strategies[strategyGameName(gameId)] = StrategyWrappers[gameId]();
  }
  return strategies;
}
