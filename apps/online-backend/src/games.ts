import { RelayWrapper, gameWrapper } from 'game';
import type { RelaySetupData } from 'game';
import { MyGameWrappers as strategyGameWrappers } from 'game/strategy';
import type { StrategyGameKey } from 'game/strategy';
import { judgeProblems } from 'game/relay-judge';
import { RELAY_GAME_NAME, strategyGameName } from 'schemas';
import type { Language, ProblemSource, RelayConfig } from 'schemas';
import { hostedStrategies } from './strategies';

/** Each game the server hosts beside the strategy that plays its bot, looked
 *  up by the game's name as the bot worker looks it up (strategies.ts). None
 *  belongs to a competition (docs/ARCHITECTURE.md § *The two kinds of match*). */
export function hostedGames() {
  const strategies = hostedStrategies();
  const games = [
    { ...RelayWrapper(), name: RELAY_GAME_NAME },
    ...(Object.keys(strategyGameWrappers) as StrategyGameKey[]).map(hostedStrategyGame),
  ];
  return games.map(game => {
    const strategy = strategies[game.name];
    if (strategy === undefined) throw new Error(`The game ${JSON.stringify(game.name)} has no strategy to play its bot.`);
    return { game, strategy };
  });
}

// Generic over the game, so that its rules are one game's.
function hostedStrategyGame<K extends StrategyGameKey>(gameId: K) {
  return { ...gameWrapper(strategyGameWrappers[gameId]()), name: strategyGameName(gameId) };
}

/** A relay match's setup: the duration, and the problems with their answers
 *  and points, read from the source now. A problem the source does not have
 *  fails the team's start. */
export async function relaySetup(
  relay: RelayConfig,
  languages: readonly Language[],
  problems: ProblemSource,
): Promise<RelaySetupData> {
  const found = await problems.getProblems(relay.problems.map(({ problemId }) => problemId));
  return { durationMinutes: relay.durationMinutes, judge: judgeProblems(relay, languages, found) };
}
