import { MyGameWrappers as strategyGameWrappers, RelayWrapper, gameWrapper } from 'game';
import type { MyGameState, RelaySetupData, StrategyGameKey } from 'game';
import { StrategyWrappers as StrategyStrategy } from 'game/bot';
import type { State } from 'boardgame.io';
import { judgeProblems, relayStrategy } from 'relay-bot';
import { RELAY_GAME_NAME, strategyGameName } from 'schemas';
import type { Language, ProblemSource, RelayConfig } from 'schemas';
import botWrapper from './botwrapper';

/** The relay's judge, reading the problems of the match it plays from the
 *  match's setup data, which no client is sent. A relay started before the
 *  problems moved there (one game per competition, #797) has none, and cannot
 *  be judged. */
function relayJudge(state: State<MyGameState>, botID: string, setupData: unknown) {
  const judge = (setupData as Partial<RelaySetupData> | undefined)?.judge;
  if (judge === undefined) {
    throw new Error('This relay match has no problems in its setup data: it was started before the server '
      + 'hosted one relay game for every competition, and cannot be judged.');
  }
  return relayStrategy(judge)(state, botID);
}

/** Each game the server hosts, beside the bot that plays it: one relay, and
 *  one per strategy game, under the names the client connects by. One entry
 *  holds both, so a game cannot end up with another game's bot.
 *
 *  None of them belongs to a competition: a match is set up with its
 *  competition's settings when a team starts it (`relaySetup`, and the
 *  strategy's duration), so a competition the source starts returning later
 *  is played without a restart. */
export function hostedGames() {
  return [
    { game: { ...RelayWrapper(), name: RELAY_GAME_NAME }, bot: botWrapper(relayJudge) },
    ...(Object.keys(strategyGameWrappers) as StrategyGameKey[]).map(gameId => ({
      game: { ...gameWrapper(strategyGameWrappers[gameId]()), name: strategyGameName(gameId) },
      bot: botWrapper(StrategyStrategy[gameId]()),
    })),
  ];
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
