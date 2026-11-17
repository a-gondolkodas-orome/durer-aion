import { MyGameWrappers as strategyGameWrappers, RelayWrapper, gameWrapper } from 'game';
import type { MyGameState, RelaySetupData, StrategyGameKey } from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import type { State } from 'boardgame.io';
import { judgeProblems, relayStrategy } from 'relay-bot';
import { strategyGameName } from 'schemas';
import type { Language, ProblemSource, RelayConfig } from 'schemas';
import botWrapper from './botwrapper';

/** The relay's judge, over the problems in its match's setup data. */
function relayJudge(state: State<MyGameState>, botID: string, setupData: unknown) {
  const judge = (setupData as Partial<RelaySetupData> | undefined)?.judge;
  if (judge === undefined) {
    throw new Error('This relay match has no problems in its setup data (started before #797).');
  }
  return relayStrategy(judge)(state, botID);
}

/** Each game the server hosts beside the bot that plays it, so a game cannot
 *  end up with another game's bot. None belongs to a competition
 *  (docs/ARCHITECTURE.md § *The two kinds of match*). */
export function hostedGames() {
  return [
    { game: RelayWrapper(), bot: botWrapper(relayJudge) },
    ...(Object.keys(strategyGameWrappers) as StrategyGameKey[]).map(hostedStrategyGame),
  ];
}

// Generic over the game, so that its rules and its bot are one game's.
function hostedStrategyGame<K extends StrategyGameKey>(gameId: K) {
  return {
    game: { ...gameWrapper(strategyGameWrappers[gameId]()), name: strategyGameName(gameId) },
    bot: botWrapper(StrategyStrategy[gameId]()),
  };
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
