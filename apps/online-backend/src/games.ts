import { MyGameWrappers as strategyGameWrappers, RelayWrapper, gameWrapper } from 'game';
import type { StrategyGameKey } from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import type { Registry } from 'problem-bank';
import { judgeProblems, relayStrategy } from 'relay-bot';
import { relayGameName, strategyGameName } from 'schemas';
import botWrapper from './botwrapper';

/** Each game the server hosts, beside the bot that plays it: a relay and a
 *  strategy match per competition that has one, under the names the client
 *  connects by. One entry holds both, so a game cannot end up with another
 *  game's bot.
 *
 *  The relay's judge is built from the bank here, once, so a relay that names
 *  a missing problem fails the server's start rather than a team's match.
 *  `assertValidRegistry` has checked by then that every strategy game id is
 *  registered. */
export function competitionGames({ competitions, problems }: Registry) {
  return [...competitions.values()].flatMap(({ id, languages, relay, strategy }) => [
    ...(relay === undefined ? [] : [{
      game: { ...RelayWrapper(undefined, { durationMinutes: relay.durationMinutes }), name: relayGameName(id) },
      bot: botWrapper(relayStrategy(judgeProblems(relay, languages, problems))),
    }]),
    ...(strategy === undefined ? [] : [{
      game: {
        ...gameWrapper(strategyGameWrappers[strategy.gameId as StrategyGameKey](), undefined,
          { durationMinutes: strategy.durationMinutes }),
        name: strategyGameName(id),
      },
      bot: botWrapper(StrategyStrategy[strategy.gameId as StrategyGameKey]()),
    }]),
  ]);
}
